import NetInfo from "@react-native-community/netinfo";
import { offlineStorage } from "./offlineStorage";

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncTime: number | null;
  pendingItems: number;
  failedItems: number;
}

type SyncQueueItem = Awaited<
  ReturnType<typeof offlineStorage.getSyncQueue>
>[number];
type SyncProcessor = (item: SyncQueueItem) => Promise<void>;

class SyncService {
  private isOnline = false;
  private isSyncing = false;
  private lastSyncTime: number | null = null;
  private pendingItems = 0;
  private failedItems = 0;
  private syncListeners: ((status: SyncStatus) => void)[] = [];
  private syncInterval: NodeJS.Timeout | null = null;
  private unsubscribeNetwork: (() => void) | null = null;
  private processor: SyncProcessor | null = null;

  constructor() {
    this.initializeNetworkListener();
    void this.refreshQueueMetrics();
  }

  configureProcessor(processor: SyncProcessor) {
    this.processor = processor;
  }

  private initializeNetworkListener() {
    this.unsubscribeNetwork = NetInfo.addEventListener(state => {
      void this.setOnlineStatus(
        Boolean(state.isConnected && state.isInternetReachable !== false)
      );
    });
  }

  private async refreshQueueMetrics() {
    const queue = await offlineStorage.getSyncQueue();
    this.pendingItems = queue.filter(item => item.status !== "failed").length;
    this.failedItems = queue.filter(item => item.status === "failed").length;
    this.notifyListeners();
  }

  async setOnlineStatus(isOnline: boolean) {
    this.isOnline = isOnline;
    this.notifyListeners();

    if (isOnline) {
      await this.syncPendingItems();
    }
  }

  private notifyListeners() {
    const status = this.getSyncStatus();
    this.syncListeners.forEach(listener => listener(status));
  }

  getSyncStatus(): SyncStatus {
    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      lastSyncTime: this.lastSyncTime,
      pendingItems: this.pendingItems,
      failedItems: this.failedItems,
    };
  }

  onSyncStatusChange(listener: (status: SyncStatus) => void): () => void {
    this.syncListeners.push(listener);
    return () => {
      this.syncListeners = this.syncListeners.filter(l => l !== listener);
    };
  }

  async syncPendingItems() {
    if (this.isSyncing || !this.isOnline) {
      return;
    }

    this.isSyncing = true;
    this.notifyListeners();

    try {
      const queue = await offlineStorage.getSyncQueue();

      if (!this.processor) {
        throw new Error("Offline sync processor is not configured");
      }

      for (const item of queue.filter(item => item.status !== "failed")) {
        try {
          await this.processSyncItem(item);
          await offlineStorage.removeFromSyncQueue(item.id);
        } catch (error) {
          console.error(`Failed to sync item ${item.id}:`, error);

          // Increment retry count
          const newRetries = (item.retries || 0) + 1;
          await offlineStorage.updateSyncQueueItem(item.id, {
            retries: newRetries,
            status: newRetries >= 3 ? "failed" : "pending",
            lastError:
              error instanceof Error ? error.message : "Unknown sync error",
          });
        }
      }
    } finally {
      this.isSyncing = false;
      this.lastSyncTime = Date.now();
      await this.refreshQueueMetrics();
      this.notifyListeners();
    }
  }

  private async processSyncItem(item: SyncQueueItem) {
    if (!this.processor) {
      throw new Error("Offline sync processor is not configured");
    }
    await this.processor(item);
  }

  async queueAction(
    action:
      | "create"
      | "update"
      | "delete"
      | "publish"
      | "scheduler-cancel"
      | "scheduler-reschedule"
      | "social-disconnect"
      | "ab-publish-variation",
    data: unknown
  ) {
    const item = {
      id: `${action}-${Date.now()}-${Math.random()}`,
      action,
      data,
      timestamp: Date.now(),
      retries: 0,
      status: "pending" as const,
    };

    await offlineStorage.addToSyncQueue(item);

    // If online, sync immediately
    if (this.isOnline) {
      await this.syncPendingItems();
    }

    await this.refreshQueueMetrics();
    this.notifyListeners();
  }

  startAutoSync(intervalMs = 30000) {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(() => {
      if (this.isOnline) {
        this.syncPendingItems();
      }
    }, intervalMs);
  }

  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    this.unsubscribeNetwork?.();
    this.unsubscribeNetwork = null;
  }
}

export const syncService = new SyncService();

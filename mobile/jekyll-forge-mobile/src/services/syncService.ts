import { offlineStorage } from './offlineStorage';

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncTime: number | null;
  pendingItems: number;
  failedItems: number;
}

class SyncService {
  private isOnline = true;
  private isSyncing = false;
  private syncListeners: ((status: SyncStatus) => void)[] = [];
  private syncInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeNetworkListener();
  }

  private initializeNetworkListener() {
    // In a real app, you'd use react-native-netinfo or similar
    // For now, we'll use a simple approach
    this.checkNetworkStatus();
  }

  private checkNetworkStatus() {
    // This would be replaced with actual network detection
    // For demo purposes, we'll assume online
    this.isOnline = true;
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
    this.syncListeners.forEach((listener) => listener(status));
  }

  getSyncStatus(): SyncStatus {
    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      lastSyncTime: null,
      pendingItems: 0,
      failedItems: 0,
    };
  }

  onSyncStatusChange(listener: (status: SyncStatus) => void): () => void {
    this.syncListeners.push(listener);
    return () => {
      this.syncListeners = this.syncListeners.filter((l) => l !== listener);
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

      for (const item of queue) {
        try {
          await this.processSyncItem(item);
          await offlineStorage.removeFromSyncQueue(item.id);
        } catch (error) {
          console.error(`Failed to sync item ${item.id}:`, error);

          // Increment retry count
          const newRetries = (item.retries || 0) + 1;
          if (newRetries > 3) {
            // Remove after 3 failed attempts
            await offlineStorage.removeFromSyncQueue(item.id);
          } else {
            await offlineStorage.updateSyncQueueItem(item.id, {
              retries: newRetries,
            });
          }
        }
      }
    } finally {
      this.isSyncing = false;
      this.notifyListeners();
    }
  }

  private async processSyncItem(item: any) {
    // This would call your tRPC procedures
    // For now, we'll simulate the sync
    return new Promise((resolve) => {
      setTimeout(resolve, 500);
    });
  }

  async queueAction(
    action: 'create' | 'update' | 'delete' | 'publish',
    data: any
  ) {
    const item = {
      id: `${action}-${Date.now()}-${Math.random()}`,
      action,
      data,
      timestamp: Date.now(),
      retries: 0,
    };

    await offlineStorage.addToSyncQueue(item);

    // If online, sync immediately
    if (this.isOnline) {
      await this.syncPendingItems();
    }

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
  }
}

export const syncService = new SyncService();

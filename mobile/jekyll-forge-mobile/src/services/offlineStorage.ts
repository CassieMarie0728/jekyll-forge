import AsyncStorage from "@react-native-async-storage/async-storage";

interface StoredDraft {
  id: string;
  siteId: string;
  title: string;
  content: string;
  frontMatter: Record<string, any>;
  lastModified: number;
  status: "draft" | "pending_sync" | "synced";
}

export interface SyncQueue {
  id: string;
  action:
    | "create"
    | "update"
    | "delete"
    | "publish"
    | "scheduler-cancel"
    | "scheduler-reschedule"
    | "social-disconnect"
    | "ab-publish-variation";
  data: unknown;
  timestamp: number;
  retries: number;
  status: "pending" | "failed";
  lastError?: string;
}

const DRAFTS_KEY = "@jekyll_forge_drafts";
const SYNC_QUEUE_KEY = "@jekyll_forge_sync_queue";
const ASSETS_KEY = "@jekyll_forge_assets";
const SETTINGS_KEY = "@jekyll_forge_settings";

export const offlineStorage = {
  // Draft Management
  async saveDraft(draft: StoredDraft): Promise<void> {
    try {
      const drafts = await this.getDrafts();
      const index = drafts.findIndex(d => d.id === draft.id);

      if (index >= 0) {
        drafts[index] = { ...draft, lastModified: Date.now() };
      } else {
        drafts.push({ ...draft, lastModified: Date.now() });
      }

      await AsyncStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
    } catch (error) {
      console.error("Failed to save draft:", error);
      throw error;
    }
  },

  async getDrafts(): Promise<StoredDraft[]> {
    try {
      const data = await AsyncStorage.getItem(DRAFTS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("Failed to get drafts:", error);
      return [];
    }
  },

  async getDraft(id: string): Promise<StoredDraft | null> {
    try {
      const drafts = await this.getDrafts();
      return drafts.find(d => d.id === id) || null;
    } catch (error) {
      console.error("Failed to get draft:", error);
      return null;
    }
  },

  async deleteDraft(id: string): Promise<void> {
    try {
      const drafts = await this.getDrafts();
      const filtered = drafts.filter(d => d.id !== id);
      await AsyncStorage.setItem(DRAFTS_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error("Failed to delete draft:", error);
      throw error;
    }
  },

  async clearDrafts(): Promise<void> {
    try {
      await AsyncStorage.removeItem(DRAFTS_KEY);
    } catch (error) {
      console.error("Failed to clear drafts:", error);
      throw error;
    }
  },

  // Sync Queue Management
  async addToSyncQueue(item: SyncQueue): Promise<void> {
    try {
      const queue = await this.getSyncQueue();
      queue.push(item);
      await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
    } catch (error) {
      console.error("Failed to add to sync queue:", error);
      throw error;
    }
  },

  async getSyncQueue(): Promise<SyncQueue[]> {
    try {
      const data = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("Failed to get sync queue:", error);
      return [];
    }
  },

  async removeFromSyncQueue(id: string): Promise<void> {
    try {
      const queue = await this.getSyncQueue();
      const filtered = queue.filter(item => item.id !== id);
      await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error("Failed to remove from sync queue:", error);
      throw error;
    }
  },

  async updateSyncQueueItem(
    id: string,
    updates: Partial<SyncQueue>
  ): Promise<void> {
    try {
      const queue = await this.getSyncQueue();
      const index = queue.findIndex(item => item.id === id);

      if (index >= 0) {
        queue[index] = { ...queue[index], ...updates };
        await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
      }
    } catch (error) {
      console.error("Failed to update sync queue item:", error);
      throw error;
    }
  },

  async clearSyncQueue(): Promise<void> {
    try {
      await AsyncStorage.removeItem(SYNC_QUEUE_KEY);
    } catch (error) {
      console.error("Failed to clear sync queue:", error);
      throw error;
    }
  },

  // Asset Management
  async saveAsset(assetId: string, assetData: any): Promise<void> {
    try {
      const assets = await this.getAssets();
      assets[assetId] = {
        ...assetData,
        savedAt: Date.now(),
      };
      await AsyncStorage.setItem(ASSETS_KEY, JSON.stringify(assets));
    } catch (error) {
      console.error("Failed to save asset:", error);
      throw error;
    }
  },

  async getAssets(): Promise<Record<string, any>> {
    try {
      const data = await AsyncStorage.getItem(ASSETS_KEY);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error("Failed to get assets:", error);
      return {};
    }
  },

  async deleteAsset(assetId: string): Promise<void> {
    try {
      const assets = await this.getAssets();
      delete assets[assetId];
      await AsyncStorage.setItem(ASSETS_KEY, JSON.stringify(assets));
    } catch (error) {
      console.error("Failed to delete asset:", error);
      throw error;
    }
  },

  async clearAssets(): Promise<void> {
    try {
      await AsyncStorage.removeItem(ASSETS_KEY);
    } catch (error) {
      console.error("Failed to clear assets:", error);
      throw error;
    }
  },

  // Settings Management
  async saveSetting(key: string, value: any): Promise<void> {
    try {
      const settings = await this.getSettings();
      settings[key] = value;
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error("Failed to save setting:", error);
      throw error;
    }
  },

  async getSetting(key: string, defaultValue?: any): Promise<any> {
    try {
      const settings = await this.getSettings();
      return settings[key] ?? defaultValue;
    } catch (error) {
      console.error("Failed to get setting:", error);
      return defaultValue;
    }
  },

  async getSettings(): Promise<Record<string, any>> {
    try {
      const data = await AsyncStorage.getItem(SETTINGS_KEY);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error("Failed to get settings:", error);
      return {};
    }
  },

  async clearSettings(): Promise<void> {
    try {
      await AsyncStorage.removeItem(SETTINGS_KEY);
    } catch (error) {
      console.error("Failed to clear settings:", error);
      throw error;
    }
  },

  // Utility Methods
  async clearAllData(): Promise<void> {
    try {
      await Promise.all([
        this.clearDrafts(),
        this.clearSyncQueue(),
        this.clearAssets(),
        this.clearSettings(),
      ]);
    } catch (error) {
      console.error("Failed to clear all data:", error);
      throw error;
    }
  },

  async getStorageStats(): Promise<{
    draftsCount: number;
    syncQueueCount: number;
    assetsCount: number;
  }> {
    try {
      const [drafts, queue, assets] = await Promise.all([
        this.getDrafts(),
        this.getSyncQueue(),
        this.getAssets(),
      ]);

      return {
        draftsCount: drafts.length,
        syncQueueCount: queue.length,
        assetsCount: Object.keys(assets).length,
      };
    } catch (error) {
      console.error("Failed to get storage stats:", error);
      return { draftsCount: 0, syncQueueCount: 0, assetsCount: 0 };
    }
  },
};

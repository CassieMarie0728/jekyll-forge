import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getExpoProjectId } from "./expoProjectId";

const PUSH_TOKEN_KEY = "@jekyll_forge_push_token";
const NOTIFICATION_PREFS_KEY = "@jekyll_forge_notification_prefs";

export interface NotificationPreferences {
  publishSuccess: boolean;
  scheduledReminders: boolean;
  analyticsUpdates: boolean;
  socialMediaAlerts: boolean;
  abTestResults: boolean;
  systemUpdates: boolean;
}

const DEFAULT_PREFS: NotificationPreferences = {
  publishSuccess: true,
  scheduledReminders: true,
  analyticsUpdates: true,
  socialMediaAlerts: true,
  abTestResults: true,
  systemUpdates: true,
};

export interface LocalNotification {
  id: string;
  title: string;
  body: string;
  type: "success" | "info" | "warning" | "error";
  category: keyof NotificationPreferences;
  timestamp: number;
  read: boolean;
  data?: Record<string, unknown>;
}

type NotificationApiClient = {
  notifications: {
    registerDevice: {
      mutate: (input: { token: string; platform: "android" }) => Promise<unknown>;
    };
  };
};

class PushNotificationService {
  private pushToken: string | null = null;
  private notificationListeners: ((notification: LocalNotification) => void)[] =
    [];
  private notifications: LocalNotification[] = [];
  private apiClient: NotificationApiClient | null = null;

  configureClient(client: NotificationApiClient): void {
    this.apiClient = client;
  }

  async initialize(): Promise<void> {
    try {
      // Request permissions
      const granted = await this.requestPermissions();
      if (!granted) {
        console.warn("Push notification permissions not granted");
        return;
      }

      // Get push token
      await this.registerForPushNotifications();

      // Load saved notifications
      await this.loadNotifications();
    } catch (error) {
      console.error("Failed to initialize push notifications:", error);
    }
  }

  private async requestPermissions(): Promise<boolean> {
    const current = await Notifications.getPermissionsAsync();
    if (current.status === "granted") return true;
    const requested = await Notifications.requestPermissionsAsync();
    return requested.status === "granted";
  }

  private async registerForPushNotifications(): Promise<void> {
    try {
      const projectId = getExpoProjectId();
      if (!projectId) {
        console.warn(
          "Push notifications unavailable until EXPO_PUBLIC_EAS_PROJECT_ID is configured"
        );
        return;
      }

      const tokenResponse = await Notifications.getExpoPushTokenAsync({
        projectId,
      });
      const token = tokenResponse.data;
      this.pushToken = token;
      await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);
      await this.registerTokenWithBackend(token);
    } catch (error) {
      console.error("Failed to register for push notifications:", error);
    }
  }

  private async registerTokenWithBackend(token: string): Promise<void> {
    if (!this.apiClient?.notifications?.registerDevice?.mutate) {
      throw new Error("Notification API client is not configured");
    }
    await this.apiClient.notifications.registerDevice.mutate({
      token,
      platform: "android",
    });
  }

  async getPushToken(): Promise<string | null> {
    if (this.pushToken) return this.pushToken;

    try {
      this.pushToken = await AsyncStorage.getItem(PUSH_TOKEN_KEY);
      return this.pushToken;
    } catch (error) {
      console.error("Failed to get push token:", error);
      return null;
    }
  }

  // Notification Preferences
  async getPreferences(): Promise<NotificationPreferences> {
    try {
      const data = await AsyncStorage.getItem(NOTIFICATION_PREFS_KEY);
      return data ? { ...DEFAULT_PREFS, ...JSON.parse(data) } : DEFAULT_PREFS;
    } catch (error) {
      console.error("Failed to get notification preferences:", error);
      return DEFAULT_PREFS;
    }
  }

  async updatePreferences(
    prefs: Partial<NotificationPreferences>
  ): Promise<void> {
    try {
      const current = await this.getPreferences();
      const updated = { ...current, ...prefs };
      await AsyncStorage.setItem(
        NOTIFICATION_PREFS_KEY,
        JSON.stringify(updated)
      );
    } catch (error) {
      console.error("Failed to update notification preferences:", error);
      throw error;
    }
  }

  // Local Notifications
  async scheduleLocalNotification(
    notification: Omit<LocalNotification, "id" | "timestamp" | "read">
  ): Promise<void> {
    const prefs = await this.getPreferences();

    // Check if this category is enabled
    if (!prefs[notification.category]) {
      return;
    }

    const localNotification: LocalNotification = {
      ...notification,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      read: false,
    };

    this.notifications.unshift(localNotification);
    await this.saveNotifications();

    // Notify listeners
    this.notificationListeners.forEach(listener => listener(localNotification));
  }

  // Notification Management
  async getNotifications(): Promise<LocalNotification[]> {
    return this.notifications;
  }

  async getUnreadCount(): Promise<number> {
    return this.notifications.filter(n => !n.read).length;
  }

  async markAsRead(notificationId: string): Promise<void> {
    const index = this.notifications.findIndex(n => n.id === notificationId);
    if (index >= 0) {
      this.notifications[index].read = true;
      await this.saveNotifications();
    }
  }

  async markAllAsRead(): Promise<void> {
    this.notifications = this.notifications.map(n => ({ ...n, read: true }));
    await this.saveNotifications();
  }

  async clearNotifications(): Promise<void> {
    this.notifications = [];
    await this.saveNotifications();
  }

  async deleteNotification(notificationId: string): Promise<void> {
    this.notifications = this.notifications.filter(
      n => n.id !== notificationId
    );
    await this.saveNotifications();
  }

  // Listeners
  onNotification(
    listener: (notification: LocalNotification) => void
  ): () => void {
    this.notificationListeners.push(listener);
    return () => {
      this.notificationListeners = this.notificationListeners.filter(
        l => l !== listener
      );
    };
  }

  // Persistence
  private async loadNotifications(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem("@jekyll_forge_notifications");
      this.notifications = data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("Failed to load notifications:", error);
      this.notifications = [];
    }
  }

  private async saveNotifications(): Promise<void> {
    try {
      // Keep only last 100 notifications
      const toSave = this.notifications.slice(0, 100);
      await AsyncStorage.setItem(
        "@jekyll_forge_notifications",
        JSON.stringify(toSave)
      );
    } catch (error) {
      console.error("Failed to save notifications:", error);
    }
  }

  // Pre-built notification triggers
  async notifyPublishSuccess(postTitle: string): Promise<void> {
    await this.scheduleLocalNotification({
      title: "Post Published!",
      body: `"${postTitle}" has been published successfully.`,
      type: "success",
      category: "publishSuccess",
      data: { postTitle },
    });
  }

  async notifyScheduledReminder(
    postTitle: string,
    scheduledTime: string
  ): Promise<void> {
    await this.scheduleLocalNotification({
      title: "Scheduled Post Reminder",
      body: `"${postTitle}" is scheduled to publish at ${scheduledTime}.`,
      type: "info",
      category: "scheduledReminders",
      data: { postTitle, scheduledTime },
    });
  }

  async notifyAnalyticsUpdate(
    platform: string,
    metric: string,
    value: number
  ): Promise<void> {
    await this.scheduleLocalNotification({
      title: "Analytics Update",
      body: `Your ${platform} post reached ${value} ${metric}!`,
      type: "info",
      category: "analyticsUpdates",
      data: { platform, metric, value },
    });
  }

  async notifySocialMediaAlert(
    platform: string,
    message: string
  ): Promise<void> {
    await this.scheduleLocalNotification({
      title: `${platform} Alert`,
      body: message,
      type: "warning",
      category: "socialMediaAlerts",
      data: { platform },
    });
  }

  async notifyABTestResult(
    postTitle: string,
    winningVariation: string
  ): Promise<void> {
    await this.scheduleLocalNotification({
      title: "A/B Test Complete!",
      body: `"${postTitle}" - Variation "${winningVariation}" won!`,
      type: "success",
      category: "abTestResults",
      data: { postTitle, winningVariation },
    });
  }
}

export const pushNotificationService = new PushNotificationService();

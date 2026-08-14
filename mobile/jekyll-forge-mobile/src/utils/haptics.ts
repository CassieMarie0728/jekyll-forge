// Haptic feedback utility
// Uses expo-haptics when available, gracefully degrades otherwise

import type * as ExpoHaptics from "expo-haptics";

type HapticStyle =
  | "light"
  | "medium"
  | "heavy"
  | "success"
  | "warning"
  | "error"
  | "selection";

class HapticService {
  private haptics: typeof ExpoHaptics | null = null;
  private enabled: boolean = true;

  async initialize(): Promise<void> {
    try {
      // Dynamically import expo-haptics
      this.haptics = await import("expo-haptics").catch(() => null);
    } catch {
      this.haptics = null;
    }
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  async trigger(style: HapticStyle = "light"): Promise<void> {
    if (!this.enabled || !this.haptics) return;

    try {
      switch (style) {
        case "light":
          await this.haptics.impactAsync(
            this.haptics.ImpactFeedbackStyle.Light
          );
          break;
        case "medium":
          await this.haptics.impactAsync(
            this.haptics.ImpactFeedbackStyle.Medium
          );
          break;
        case "heavy":
          await this.haptics.impactAsync(
            this.haptics.ImpactFeedbackStyle.Heavy
          );
          break;
        case "success":
          await this.haptics.notificationAsync(
            this.haptics.NotificationFeedbackType.Success
          );
          break;
        case "warning":
          await this.haptics.notificationAsync(
            this.haptics.NotificationFeedbackType.Warning
          );
          break;
        case "error":
          await this.haptics.notificationAsync(
            this.haptics.NotificationFeedbackType.Error
          );
          break;
        case "selection":
          await this.haptics.selectionAsync();
          break;
      }
    } catch {
      // Silently fail if haptics unavailable
    }
  }

  // Convenience methods
  async light(): Promise<void> {
    await this.trigger("light");
  }
  async medium(): Promise<void> {
    await this.trigger("medium");
  }
  async heavy(): Promise<void> {
    await this.trigger("heavy");
  }
  async success(): Promise<void> {
    await this.trigger("success");
  }
  async warning(): Promise<void> {
    await this.trigger("warning");
  }
  async error(): Promise<void> {
    await this.trigger("error");
  }
  async selection(): Promise<void> {
    await this.trigger("selection");
  }

  // Common interaction patterns
  async buttonTap(): Promise<void> {
    await this.trigger("light");
  }
  async toggleSwitch(): Promise<void> {
    await this.trigger("selection");
  }
  async deleteItem(): Promise<void> {
    await this.trigger("medium");
  }
  async publishSuccess(): Promise<void> {
    await this.trigger("success");
  }
  async errorOccurred(): Promise<void> {
    await this.trigger("error");
  }
  async pullToRefresh(): Promise<void> {
    await this.trigger("medium");
  }
  async longPress(): Promise<void> {
    await this.trigger("heavy");
  }
  async tabSwitch(): Promise<void> {
    await this.trigger("selection");
  }
}

export const haptics = new HapticService();

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Alert,
  Switch,
} from 'react-native';
import {
  pushNotificationService,
  LocalNotification,
  NotificationPreferences,
} from '../services/pushNotifications';

export default function NotificationsScreen({ navigation }: any) {
  const [notifications, setNotifications] = useState<LocalNotification[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [activeTab, setActiveTab] = useState<'notifications' | 'settings'>('notifications');
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadData();

    const unsubscribe = pushNotificationService.onNotification((notification) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);
    });

    return unsubscribe;
  }, []);

  const loadData = async () => {
    const notifs = await pushNotificationService.getNotifications();
    const prefs = await pushNotificationService.getPreferences();
    const count = await pushNotificationService.getUnreadCount();

    setNotifications(notifs);
    setPreferences(prefs);
    setUnreadCount(count);
  };

  const handleMarkAllRead = async () => {
    await pushNotificationService.markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const handleClearAll = () => {
    Alert.alert('Clear All', 'Remove all notifications?', [
      { text: 'Cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: async () => {
          await pushNotificationService.clearNotifications();
          setNotifications([]);
          setUnreadCount(0);
        },
      },
    ]);
  };

  const handleMarkAsRead = async (id: string) => {
    await pushNotificationService.markAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const handleDeleteNotification = async (id: string) => {
    await pushNotificationService.deleteNotification(id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleTogglePreference = async (key: keyof NotificationPreferences) => {
    if (!preferences) return;

    const updated = { ...preferences, [key]: !preferences[key] };
    setPreferences(updated);
    await pushNotificationService.updatePreferences({ [key]: !preferences[key] });
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return '✓';
      case 'info': return 'ℹ';
      case 'warning': return '⚠';
      case 'error': return '✕';
      default: return '•';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success': return '#10b981';
      case 'info': return '#3b82f6';
      case 'warning': return '#f59e0b';
      case 'error': return '#ef4444';
      default: return '#9ca3af';
    }
  };

  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const renderNotification = ({ item }: { item: LocalNotification }) => (
    <TouchableOpacity
      style={[styles.notificationCard, !item.read && styles.notificationUnread]}
      onPress={() => handleMarkAsRead(item.id)}
      onLongPress={() => {
        Alert.alert('Delete', 'Remove this notification?', [
          { text: 'Cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => handleDeleteNotification(item.id),
          },
        ]);
      }}
    >
      <View
        style={[
          styles.notificationIconContainer,
          { backgroundColor: getNotificationColor(item.type) + '20' },
        ]}
      >
        <Text style={[styles.notificationIcon, { color: getNotificationColor(item.type) }]}>
          {getNotificationIcon(item.type)}
        </Text>
      </View>
      <View style={styles.notificationContent}>
        <Text style={styles.notificationTitle}>{item.title}</Text>
        <Text style={styles.notificationBody} numberOfLines={2}>
          {item.body}
        </Text>
        <Text style={styles.notificationTime}>{formatTime(item.timestamp)}</Text>
      </View>
      {!item.read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  const preferenceLabels: Record<keyof NotificationPreferences, { label: string; description: string }> = {
    publishSuccess: { label: 'Publish Success', description: 'When a post is published successfully' },
    scheduledReminders: { label: 'Scheduled Reminders', description: 'Reminders for upcoming scheduled posts' },
    analyticsUpdates: { label: 'Analytics Updates', description: 'When posts reach engagement milestones' },
    socialMediaAlerts: { label: 'Social Media Alerts', description: 'Alerts about social media account issues' },
    abTestResults: { label: 'A/B Test Results', description: 'When A/B tests complete with a winner' },
    systemUpdates: { label: 'System Updates', description: 'App updates and maintenance notices' },
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Notifications</Text>
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unreadCount}</Text>
          </View>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'notifications' && styles.tabActive]}
          onPress={() => setActiveTab('notifications')}
        >
          <Text style={[styles.tabText, activeTab === 'notifications' && styles.tabTextActive]}>
            Notifications
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'settings' && styles.tabActive]}
          onPress={() => setActiveTab('settings')}
        >
          <Text style={[styles.tabText, activeTab === 'settings' && styles.tabTextActive]}>
            Settings
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'notifications' ? (
        <>
          {/* Actions */}
          {notifications.length > 0 && (
            <View style={styles.actionsRow}>
              <TouchableOpacity onPress={handleMarkAllRead}>
                <Text style={styles.actionText}>Mark all read</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleClearAll}>
                <Text style={[styles.actionText, { color: '#ef4444' }]}>Clear all</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Notifications List */}
          {notifications.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🔔</Text>
              <Text style={styles.emptyTitle}>No notifications</Text>
              <Text style={styles.emptyText}>
                You're all caught up! Notifications will appear here.
              </Text>
            </View>
          ) : (
            <FlatList
              data={notifications}
              renderItem={renderNotification}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
            />
          )}
        </>
      ) : (
        /* Settings Tab */
        <ScrollView style={styles.settingsContent}>
          <Text style={styles.settingsHeader}>Notification Preferences</Text>
          <Text style={styles.settingsSubheader}>
            Choose which notifications you'd like to receive
          </Text>

          {preferences &&
            (Object.keys(preferenceLabels) as Array<keyof NotificationPreferences>).map((key) => (
              <View key={key} style={styles.preferenceItem}>
                <View style={styles.preferenceInfo}>
                  <Text style={styles.preferenceLabel}>{preferenceLabels[key].label}</Text>
                  <Text style={styles.preferenceDescription}>
                    {preferenceLabels[key].description}
                  </Text>
                </View>
                <Switch
                  value={preferences[key]}
                  onValueChange={() => handleTogglePreference(key)}
                  trackColor={{ false: '#475569', true: '#3b82f6' }}
                  thumbColor={preferences[key] ? '#fff' : '#9ca3af'}
                />
              </View>
            ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  badge: {
    backgroundColor: '#ef4444',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#3b82f6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9ca3af',
  },
  tabTextActive: {
    color: '#3b82f6',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3b82f6',
  },
  listContent: {
    padding: 16,
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#1e293b',
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
  },
  notificationUnread: {
    backgroundColor: '#1e293b',
    borderLeftWidth: 3,
    borderLeftColor: '#3b82f6',
  },
  notificationIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  notificationIcon: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  notificationBody: {
    fontSize: 13,
    color: '#d1d5db',
    lineHeight: 18,
    marginBottom: 6,
  },
  notificationTime: {
    fontSize: 11,
    color: '#9ca3af',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3b82f6',
    marginLeft: 8,
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 13,
    color: '#9ca3af',
    textAlign: 'center',
  },
  settingsContent: {
    padding: 16,
  },
  settingsHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  settingsSubheader: {
    fontSize: 13,
    color: '#9ca3af',
    marginBottom: 20,
  },
  preferenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1e293b',
    padding: 14,
    borderRadius: 8,
    marginBottom: 10,
  },
  preferenceInfo: {
    flex: 1,
    marginRight: 12,
  },
  preferenceLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  preferenceDescription: {
    fontSize: 12,
    color: '#9ca3af',
  },
});

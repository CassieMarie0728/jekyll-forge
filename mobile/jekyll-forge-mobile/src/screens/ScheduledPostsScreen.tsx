import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { trpc } from '../utils/trpc';

interface ScheduledPost {
  id: string;
  title: string;
  content: string;
  scheduledDate: string;
  platforms: string[];
  status: 'scheduled' | 'published' | 'cancelled';
  createdAt: string;
}

export default function ScheduledPostsScreen({ route, navigation }: any) {
  const { siteId } = route.params || {};
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'scheduled' | 'published' | 'cancelled'>('all');

  const getScheduledPostsMutation = trpc.posts.getScheduled.useQuery({ siteId });
  const cancelScheduleMutation = trpc.posts.cancelSchedule.useMutation();
  const reschedulePostMutation = trpc.posts.reschedule.useMutation();

  const handleCancelSchedule = (post: ScheduledPost) => {
    Alert.alert(
      'Cancel Schedule',
      `Cancel scheduled post "${post.title}"?`,
      [
        { text: 'Keep Scheduled', onPress: () => {} },
        {
          text: 'Cancel',
          onPress: async () => {
            try {
              await cancelScheduleMutation.mutateAsync({ postId: post.id });
              setScheduledPosts((prev) =>
                prev.map((p) =>
                  p.id === post.id ? { ...p, status: 'cancelled' } : p
                )
              );
              Alert.alert('Success', 'Schedule cancelled');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to cancel schedule');
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const handleReschedule = (post: ScheduledPost) => {
    Alert.prompt(
      'Reschedule Post',
      'Enter new date and time (YYYY-MM-DD HH:MM)',
      [
        { text: 'Cancel', onPress: () => {} },
        {
          text: 'Reschedule',
          onPress: async (newDate) => {
            if (!newDate) return;

            try {
              await reschedulePostMutation.mutateAsync({
                postId: post.id,
                newDate,
              });
              setScheduledPosts((prev) =>
                prev.map((p) =>
                  p.id === post.id
                    ? { ...p, scheduledDate: newDate }
                    : p
                )
              );
              Alert.alert('Success', 'Post rescheduled');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to reschedule');
            }
          },
        },
      ],
      'plain-text',
      post.scheduledDate
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return '#3b82f6';
      case 'published':
        return '#10b981';
      case 'cancelled':
        return '#ef4444';
      default:
        return '#9ca3af';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled':
        return '⏰';
      case 'published':
        return '✓';
      case 'cancelled':
        return '✕';
      default:
        return '•';
    }
  };

  const filteredPosts = scheduledPosts.filter((post) => {
    if (selectedFilter === 'all') return true;
    return post.status === selectedFilter;
  });

  const renderPostCard = (post: ScheduledPost) => {
    const scheduledTime = new Date(post.scheduledDate);
    const isUpcoming = scheduledTime > new Date() && post.status === 'scheduled';

    return (
      <View key={post.id} style={styles.postCard}>
        <View style={styles.postHeader}>
          <View style={styles.postTitleContainer}>
            <Text style={styles.postTitle} numberOfLines={2}>
              {post.title}
            </Text>
            <Text style={styles.postDate}>
              {scheduledTime.toLocaleString()}
            </Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(post.status) },
            ]}
          >
            <Text style={styles.statusIcon}>{getStatusIcon(post.status)}</Text>
            <Text style={styles.statusText}>{post.status}</Text>
          </View>
        </View>

        <Text style={styles.postExcerpt} numberOfLines={2}>
          {post.content}
        </Text>

        <View style={styles.platformsContainer}>
          {post.platforms.map((platform) => (
            <View key={platform} style={styles.platformTag}>
              <Text style={styles.platformTagText}>{platform}</Text>
            </View>
          ))}
        </View>

        {post.status === 'scheduled' && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleReschedule(post)}
            >
              <Text style={styles.actionButtonText}>📅 Reschedule</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonDanger]}
              onPress={() => handleCancelSchedule(post)}
            >
              <Text style={styles.actionButtonTextDanger}>✕ Cancel</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Scheduled Posts</Text>
        <Text style={styles.subtitle}>Manage your scheduled content</Text>
      </View>

      {/* Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersContainer}
      >
        {(['all', 'scheduled', 'published', 'cancelled'] as const).map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterButton,
              selectedFilter === filter && styles.filterButtonActive,
            ]}
            onPress={() => setSelectedFilter(filter)}
          >
            <Text
              style={[
                styles.filterButtonText,
                selectedFilter === filter && styles.filterButtonTextActive,
              ]}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Posts List */}
      <ScrollView style={styles.content}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3b82f6" />
          </View>
        ) : filteredPosts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyTitle}>No {selectedFilter} posts</Text>
            <Text style={styles.emptyText}>
              {selectedFilter === 'all'
                ? 'You don\'t have any scheduled posts yet'
                : `You don't have any ${selectedFilter} posts`}
            </Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => navigation.navigate('Editor')}
            >
              <Text style={styles.createButtonText}>✍️ Create Post</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={filteredPosts}
            renderItem={({ item }) => renderPostCard(item)}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            style={styles.postsList}
          />
        )}
      </ScrollView>

      {/* Stats Footer */}
      {scheduledPosts.length > 0 && (
        <View style={styles.statsFooter}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Scheduled</Text>
            <Text style={styles.statValue}>
              {scheduledPosts.filter((p) => p.status === 'scheduled').length}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Published</Text>
            <Text style={styles.statValue}>
              {scheduledPosts.filter((p) => p.status === 'published').length}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Cancelled</Text>
            <Text style={styles.statValue}>
              {scheduledPosts.filter((p) => p.status === 'cancelled').length}
            </Text>
          </View>
        </View>
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
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#9ca3af',
  },
  filtersContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#1e293b',
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: '#3b82f6',
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9ca3af',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 300,
    paddingHorizontal: 16,
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
    marginBottom: 16,
  },
  createButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: '#3b82f6',
  },
  createButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  postsList: {
    marginBottom: 16,
  },
  postCard: {
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  postTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  postTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  postDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    gap: 4,
  },
  statusIcon: {
    fontSize: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  postExcerpt: {
    fontSize: 12,
    color: '#d1d5db',
    lineHeight: 18,
    marginBottom: 12,
  },
  platformsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  platformTag: {
    backgroundColor: '#0f172a',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#475569',
  },
  platformTagText: {
    fontSize: 11,
    color: '#d1d5db',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
  },
  actionButtonDanger: {
    backgroundColor: '#ef4444',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  actionButtonTextDanger: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  statsFooter: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: '#9ca3af',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
});

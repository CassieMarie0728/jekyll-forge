import React, { useMemo, useState } from "react";
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
  Modal,
  TextInput,
} from "react-native";
import { trpc } from "../utils/trpc";
import {
  enqueueSchedulerCancel,
  enqueueSchedulerReschedule,
} from "../services/offlineQueueProducers";

interface ScheduledPost {
  id: number;
  title: string;
  content: string;
  scheduledDate: string;
  platforms: string[];
  status: "scheduled" | "published" | "cancelled" | "failed";
  createdAt: string;
}

type ScheduledPostsScreenProps = {
  route: { params?: { siteId?: number } };
  navigation: {
    navigate: (
      routeName: "AppStack",
      params: { screen: "EditorTab" }
    ) => void;
  };
};

export default function ScheduledPostsScreen({
  route,
  navigation,
}: ScheduledPostsScreenProps) {
  const { siteId } = route.params || {};
  const [selectedFilter, setSelectedFilter] = useState<
    "all" | "scheduled" | "published" | "cancelled" | "failed"
  >("all");
  const [postToReschedule, setPostToReschedule] =
    useState<ScheduledPost | null>(null);
  const [rescheduleValue, setRescheduleValue] = useState("");
  const normalizedSiteId = Number(siteId);

  const scheduledPostsQuery = trpc.scheduler.list.useQuery(
    { siteId: normalizedSiteId },
    { enabled: Number.isInteger(normalizedSiteId) && normalizedSiteId > 0 }
  );
  const cancelScheduleMutation = trpc.scheduler.cancel.useMutation();
  const reschedulePostMutation = trpc.scheduler.reschedule.useMutation();

  const scheduledPosts = useMemo<ScheduledPost[]>(
    () =>
      (scheduledPostsQuery.data || []).map(job => ({
        id: job.id,
        title:
          job.targetPath.split("/").pop()?.replace(/\.md$/, "") ||
          "Scheduled post",
        content: job.commitMessage || job.draftPath,
        scheduledDate: job.scheduledAt.toISOString(),
        platforms: [],
        status:
          job.status === "published"
            ? "published"
            : job.status === "cancelled"
              ? "cancelled"
              : job.status === "failed"
                ? "failed"
                : "scheduled",
        createdAt: job.createdAt.toISOString(),
      })),
    [scheduledPostsQuery.data]
  );

  const handleCancelSchedule = (post: ScheduledPost) => {
    Alert.alert("Cancel Schedule", `Cancel scheduled post "${post.title}"?`, [
      { text: "Keep Scheduled", onPress: () => {} },
      {
        text: "Cancel",
        onPress: async () => {
          try {
            await cancelScheduleMutation.mutateAsync({ id: post.id });
            await scheduledPostsQuery.refetch();
            Alert.alert("Success", "Schedule cancelled");
          } catch (error: unknown) {
            await enqueueSchedulerCancel(post.id);
            Alert.alert(
              "Cancellation queued",
              error instanceof Error
                ? `${error.message} The cancellation will retry when online.`
                : "The cancellation will retry when online."
            );
          }
        },
        style: "destructive",
      },
    ]);
  };

  const handleReschedule = (post: ScheduledPost) => {
    const localValue = new Date(post.scheduledDate)
      .toISOString()
      .slice(0, 16)
      .replace("T", " ");
    setPostToReschedule(post);
    setRescheduleValue(localValue);
  };

  const submitReschedule = async () => {
    if (!postToReschedule) return;
    const scheduledAt = new Date(rescheduleValue.replace(" ", "T"));
    if (Number.isNaN(scheduledAt.getTime()) || scheduledAt <= new Date()) {
      Alert.alert("Error", "Enter a valid future date and time.");
      return;
    }

    try {
      await reschedulePostMutation.mutateAsync({
        id: postToReschedule.id,
        scheduledAt,
      });
      await scheduledPostsQuery.refetch();
      Alert.alert("Success", "Post rescheduled");
    } catch (error: unknown) {
      await enqueueSchedulerReschedule(postToReschedule.id, scheduledAt);
      Alert.alert(
        "Reschedule queued",
        error instanceof Error
          ? `${error.message} The update will retry when online.`
          : "The update will retry when online."
      );
    } finally {
      setPostToReschedule(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "#3b82f6";
      case "published":
        return "#10b981";
      case "cancelled":
        return "#ef4444";
      default:
        return "#9ca3af";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "scheduled":
        return "⏰";
      case "published":
        return "✓";
      case "cancelled":
        return "✕";
      default:
        return "•";
    }
  };

  const filteredPosts = scheduledPosts.filter(post => {
    if (selectedFilter === "all") return true;
    return post.status === selectedFilter;
  });

  const renderPostCard = (post: ScheduledPost) => {
    const scheduledTime = new Date(post.scheduledDate);

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
          {post.platforms.map(platform => (
            <View key={platform} style={styles.platformTag}>
              <Text style={styles.platformTagText}>{platform}</Text>
            </View>
          ))}
        </View>

        {post.status === "scheduled" && (
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
        {(["all", "scheduled", "published", "cancelled", "failed"] as const).map(
          filter => (
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
          )
        )}
      </ScrollView>

      {/* Posts List */}
      <ScrollView style={styles.content}>
        {scheduledPostsQuery.isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3b82f6" />
          </View>
        ) : filteredPosts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyTitle}>No {selectedFilter} posts</Text>
            <Text style={styles.emptyText}>
              {selectedFilter === "all"
                ? "You don't have any scheduled posts yet"
                : `You don't have any ${selectedFilter} posts`}
            </Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => navigation.navigate("AppStack", { screen: "EditorTab" })}
            >
              <Text style={styles.createButtonText}>✍️ Create Post</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={filteredPosts}
            renderItem={({ item }) => renderPostCard(item)}
            keyExtractor={item => String(item.id)}
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
              {scheduledPosts.filter(p => p.status === "scheduled").length}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Published</Text>
            <Text style={styles.statValue}>
              {scheduledPosts.filter(p => p.status === "published").length}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Cancelled</Text>
            <Text style={styles.statValue}>
              {scheduledPosts.filter(p => p.status === "cancelled").length}
            </Text>
          </View>
        </View>
      )}

      <Modal
        visible={postToReschedule !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setPostToReschedule(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Reschedule post</Text>
            <Text style={styles.modalText}>
              Enter a future local date and time in YYYY-MM-DD HH:MM format.
            </Text>
            <TextInput
              value={rescheduleValue}
              onChangeText={setRescheduleValue}
              placeholder="2026-09-01 09:30"
              placeholderTextColor="#64748b"
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.modalInput}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalSecondaryButton}
                onPress={() => setPostToReschedule(null)}
              >
                <Text style={styles.modalSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalPrimaryButton}
                onPress={() => void submitReschedule()}
              >
                <Text style={styles.modalPrimaryText}>Reschedule</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1e293b",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#9ca3af",
  },
  filtersContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1e293b",
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: "#1e293b",
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: "#3b82f6",
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#9ca3af",
  },
  filterButtonTextActive: {
    color: "#fff",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 200,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 300,
    paddingHorizontal: 16,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 13,
    color: "#9ca3af",
    textAlign: "center",
    marginBottom: 16,
  },
  createButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: "#3b82f6",
  },
  createButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#fff",
  },
  postsList: {
    marginBottom: 16,
  },
  postCard: {
    backgroundColor: "#1e293b",
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  postHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  postTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  postTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  postDate: {
    fontSize: 12,
    color: "#9ca3af",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
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
    fontWeight: "600",
    color: "#fff",
  },
  postExcerpt: {
    fontSize: 12,
    color: "#d1d5db",
    lineHeight: 18,
    marginBottom: 12,
  },
  platformsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 12,
  },
  platformTag: {
    backgroundColor: "#0f172a",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#475569",
  },
  platformTagText: {
    fontSize: 11,
    color: "#d1d5db",
  },
  actions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: "#3b82f6",
    alignItems: "center",
  },
  actionButtonDanger: {
    backgroundColor: "#ef4444",
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#fff",
  },
  actionButtonTextDanger: {
    fontSize: 12,
    fontWeight: "600",
    color: "#fff",
  },
  statsFooter: {
    flexDirection: "row",
    backgroundColor: "#1e293b",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: "#334155",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statLabel: {
    fontSize: 11,
    color: "#9ca3af",
    marginBottom: 2,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#3b82f6",
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "rgba(2, 6, 23, 0.72)",
  },
  modalCard: {
    borderRadius: 12,
    padding: 20,
    backgroundColor: "#1e293b",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  modalText: {
    marginTop: 8,
    color: "#cbd5e1",
    fontSize: 13,
    lineHeight: 18,
  },
  modalInput: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#475569",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#fff",
    backgroundColor: "#0f172a",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 18,
  },
  modalSecondaryButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#334155",
  },
  modalPrimaryButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#3b82f6",
  },
  modalSecondaryText: {
    color: "#e2e8f0",
    fontWeight: "600",
  },
  modalPrimaryText: {
    color: "#fff",
    fontWeight: "700",
  },
});

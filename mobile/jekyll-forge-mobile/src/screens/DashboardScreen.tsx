import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface Post {
  id: string;
  title: string;
  status: "draft" | "published" | "scheduled";
  createdAt: string;
  updatedAt: string;
}

interface Site {
  id: string;
  name: string;
  url: string;
  posts: number;
  drafts: number;
}

export default function DashboardScreen() {
  const [sites, setSites] = useState<Site[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPosts: 0,
    drafts: 0,
    scheduled: 0,
  });

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      // Load sites from cache
      const sitesData = await AsyncStorage.getItem("sites");
      if (sitesData) {
        setSites(JSON.parse(sitesData));
      }

      // Load posts from cache
      const postsData = await AsyncStorage.getItem("posts");
      if (postsData) {
        const allPosts = JSON.parse(postsData);
        setPosts(allPosts);

        // Calculate stats
        setStats({
          totalPosts: allPosts.filter((p: Post) => p.status === "published")
            .length,
          drafts: allPosts.filter((p: Post) => p.status === "draft").length,
          scheduled: allPosts.filter((p: Post) => p.status === "scheduled")
            .length,
        });
      }
    } catch (error) {
      console.error("Failed to load dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderStatCard = (title: string, value: number, icon: string) => (
    <View style={styles.statCard}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  );

  const renderPostItem = ({ item }: { item: Post }) => (
    <TouchableOpacity style={styles.postCard}>
      <View style={styles.postContent}>
        <Text style={styles.postTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.postMeta}>
          {new Date(item.updatedAt).toLocaleDateString()} • {item.status}
        </Text>
      </View>
      <View
        style={[
          styles.statusBadge,
          item.status === "published" && styles.publishedBadge,
          item.status === "draft" && styles.draftBadge,
          item.status === "scheduled" && styles.scheduledBadge,
        ]}
      >
        <Text style={styles.statusText}>
          {item.status.charAt(0).toUpperCase()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Dashboard</Text>
          <Text style={styles.subtitle}>Manage your Jekyll sites</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          {renderStatCard("Published", stats.totalPosts, "📝")}
          {renderStatCard("Drafts", stats.drafts, "✏️")}
          {renderStatCard("Scheduled", stats.scheduled, "📅")}
        </View>

        {/* Recent Posts */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Posts</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllLink}>View All →</Text>
            </TouchableOpacity>
          </View>

          {posts.length === 0 ? (
            <Text style={styles.emptyText}>
              No posts yet. Create one to get started!
            </Text>
          ) : (
            <FlatList
              data={posts.slice(0, 5)}
              renderItem={renderPostItem}
              keyExtractor={item => item.id}
              scrollEnabled={false}
            />
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <TouchableOpacity style={[styles.actionButton, styles.newPostButton]}>
            <Text style={styles.actionIcon}>✍️</Text>
            <Text style={styles.actionText}>New Post</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.uploadButton]}>
            <Text style={styles.actionIcon}>📤</Text>
            <Text style={styles.actionText}>Upload Asset</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.settingsButton]}
          >
            <Text style={styles.actionIcon}>⚙️</Text>
            <Text style={styles.actionText}>Site Settings</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#9ca3af",
  },
  statsContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#1e293b",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 12,
    color: "#9ca3af",
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  viewAllLink: {
    color: "#3b82f6",
    fontSize: 12,
    fontWeight: "500",
  },
  postCard: {
    flexDirection: "row",
    backgroundColor: "#1e293b",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: "center",
  },
  postContent: {
    flex: 1,
  },
  postTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#fff",
    marginBottom: 4,
  },
  postMeta: {
    fontSize: 12,
    color: "#9ca3af",
  },
  statusBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  publishedBadge: {
    backgroundColor: "#10b981",
  },
  draftBadge: {
    backgroundColor: "#f59e0b",
  },
  scheduledBadge: {
    backgroundColor: "#3b82f6",
  },
  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  emptyText: {
    color: "#6b7280",
    fontSize: 14,
    textAlign: "center",
    paddingVertical: 24,
  },
  actionButton: {
    flexDirection: "row",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: "center",
  },
  newPostButton: {
    backgroundColor: "#3b82f6",
  },
  uploadButton: {
    backgroundColor: "#8b5cf6",
  },
  settingsButton: {
    backgroundColor: "#6366f1",
  },
  actionIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  actionText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
});

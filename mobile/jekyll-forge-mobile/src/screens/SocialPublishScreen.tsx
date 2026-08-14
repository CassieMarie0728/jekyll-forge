import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Switch,
  FlatList,
} from "react-native";
import { trpc } from "../utils/trpc";

interface PublishTarget {
  platform: "twitter" | "linkedin" | "facebook" | "instagram";
  selected: boolean;
  icon: string;
  name: string;
}

export default function SocialPublishScreen({ route }: any) {
  const { postId, repurposedContentId = postId, title, content } = route.params || {};
  const [selectedPlatforms, setSelectedPlatforms] = useState<PublishTarget[]>([
    { platform: "twitter", selected: false, icon: "𝕏", name: "Twitter/X" },
    { platform: "linkedin", selected: false, icon: "💼", name: "LinkedIn" },
    { platform: "facebook", selected: false, icon: "👍", name: "Facebook" },
    { platform: "instagram", selected: false, icon: "📸", name: "Instagram" },
  ]);

  const [loading, setLoading] = useState(false);
  const connectedAccountsQuery = trpc.socialMedia.getAccounts.useQuery();
  const publishMutation = trpc.socialMedia.publishContent.useMutation();

  const handlePlatformToggle = (platform: string) => {
    setSelectedPlatforms(prev =>
      prev.map(p =>
        p.platform === platform ? { ...p, selected: !p.selected } : p
      )
    );
  };

  const handlePublish = async () => {
    const selected = selectedPlatforms.filter(p => p.selected);

    if (selected.length === 0) {
      Alert.alert("Error", "Please select at least one platform");
      return;
    }
    if (typeof repurposedContentId !== "number") {
      Alert.alert("Error", "Generate repurposed content before publishing it.");
      return;
    }

    setLoading(true);
    try {
      for (const platform of selected) {
        const account = connectedAccountsQuery.data?.find(
          item => item.platform === platform.platform && item.isConnected
        );
        if (!account) {
          throw new Error(`Connect a ${platform.name} account before publishing.`);
        }
        await publishMutation.mutateAsync({
          repurposedContentId,
          accountId: account.id,
        });
      }
      Alert.alert("Success", "Post published to selected platforms");
    } catch (error) {
      Alert.alert("Error", "Failed to publish post");
      console.error("Publish error:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderPlatformCard = (item: PublishTarget) => (
    <View style={styles.platformCard}>
      <View style={styles.platformInfo}>
        <Text style={styles.platformIcon}>{item.icon}</Text>
        <Text style={styles.platformName}>{item.name}</Text>
      </View>
      <Switch
        value={item.selected}
        onValueChange={() => handlePlatformToggle(item.platform)}
        trackColor={{ false: "#334155", true: "#3b82f6" }}
        thumbColor="#fff"
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Publish to Social Media</Text>
          <Text style={styles.subtitle}>
            Select platforms to share your post
          </Text>
        </View>

        {/* Post Preview */}
        <View style={styles.previewSection}>
          <Text style={styles.sectionTitle}>Post Preview</Text>
          <View style={styles.previewCard}>
            <Text style={styles.previewTitle} numberOfLines={2}>
              {title || "Untitled Post"}
            </Text>
            <Text style={styles.previewContent} numberOfLines={3}>
              {content || "No content"}
            </Text>
          </View>
        </View>

        {/* Platform Selection */}
        <View style={styles.platformsSection}>
          <Text style={styles.sectionTitle}>Select Platforms</Text>
          <FlatList
            data={selectedPlatforms}
            renderItem={({ item }) => renderPlatformCard(item)}
            keyExtractor={item => item.platform}
            scrollEnabled={false}
          />
        </View>

        {/* Publishing Options */}
        <View style={styles.optionsSection}>
          <Text style={styles.sectionTitle}>Options</Text>
          <View style={styles.optionItem}>
            <View style={styles.optionInfo}>
              <Text style={styles.optionTitle}>Include Link</Text>
              <Text style={styles.optionSubtitle}>Add blog post link</Text>
            </View>
            <Switch
              value={true}
              disabled
              trackColor={{ false: "#334155", true: "#3b82f6" }}
              thumbColor="#fff"
            />
          </View>
          <View style={styles.optionItem}>
            <View style={styles.optionInfo}>
              <Text style={styles.optionTitle}>Track Analytics</Text>
              <Text style={styles.optionSubtitle}>Monitor engagement</Text>
            </View>
            <Switch
              value={true}
              disabled
              trackColor={{ false: "#334155", true: "#3b82f6" }}
              thumbColor="#fff"
            />
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        <TouchableOpacity style={styles.cancelButton}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.publishButton}
          onPress={handlePublish}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.publishButtonText}>📤 Publish</Text>
          )}
        </TouchableOpacity>
      </View>
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
  header: {
    marginBottom: 24,
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
  previewSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 12,
  },
  previewCard: {
    backgroundColor: "#1e293b",
    padding: 12,
    borderRadius: 8,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 8,
  },
  previewContent: {
    fontSize: 12,
    color: "#9ca3af",
    lineHeight: 18,
  },
  platformsSection: {
    marginBottom: 24,
  },
  platformCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#1e293b",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  platformInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  platformIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  platformName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#fff",
  },
  optionsSection: {
    marginBottom: 24,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#1e293b",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  optionInfo: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#fff",
    marginBottom: 2,
  },
  optionSubtitle: {
    fontSize: 12,
    color: "#9ca3af",
  },
  actionContainer: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "#1e293b",
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: "#334155",
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  publishButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: "#3b82f6",
    alignItems: "center",
    justifyContent: "center",
  },
  publishButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});

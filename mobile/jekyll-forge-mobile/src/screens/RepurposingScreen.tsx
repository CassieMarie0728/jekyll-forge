import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Alert,
} from "react-native";
import { trpc } from "../utils/trpc";

interface RepurposedContent {
  format: string;
  title: string;
  icon: string;
  content: string;
  metadata: {
    characterCount: number;
    wordCount: number;
    estimatedDuration?: string;
  };
}

const REPURPOSING_FORMATS = [
  { format: "twitter", title: "Twitter Thread", icon: "𝕏" },
  { format: "linkedin", title: "LinkedIn Article", icon: "💼" },
  { format: "tiktok", title: "TikTok Script", icon: "📱" },
  { format: "youtube", title: "YouTube Description", icon: "▶️" },
  { format: "newsletter", title: "Newsletter", icon: "📧" },
  { format: "email", title: "Email Campaign", icon: "✉️" },
  { format: "podcast", title: "Podcast Outline", icon: "🎙️" },
  { format: "slides", title: "Slide Deck", icon: "📊" },
] as const;

type RepurposingFormat = (typeof REPURPOSING_FORMATS)[number]["format"];

export default function RepurposingScreen({ route, navigation }: any) {
  const { postId, siteId, post } = route.params || {};
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedFormats, setSelectedFormats] = useState<RepurposingFormat[]>(
    []
  );
  const [repurposedContent, setRepurposedContent] = useState<
    RepurposedContent[]
  >([]);
  const [activeTab, setActiveTab] = useState<"generate" | "results">(
    "generate"
  );

  const generateMutation = trpc.repurposing.generate.useMutation();

  const handleFormatToggle = (format: RepurposingFormat) => {
    setSelectedFormats(prev =>
      prev.includes(format) ? prev.filter(f => f !== format) : [...prev, format]
    );
  };

  const handleGenerate = async () => {
    if (selectedFormats.length === 0) {
      Alert.alert("Error", "Please select at least one format");
      return;
    }

    if (typeof postId !== "number" || typeof siteId !== "number") {
      Alert.alert("Error", "Save the post before generating repurposed content.");
      return;
    }

    setIsGenerating(true);
    try {
      const results = await Promise.all(
        selectedFormats.map(async format => {
          const response = await generateMutation.mutateAsync({
            postId,
            siteId,
            format,
          });
          const formatDetails = REPURPOSING_FORMATS.find(
            item => item.format === response.format
          );
          return {
            format: response.format,
            title: formatDetails?.title || response.format,
            icon: formatDetails?.icon || "✦",
            content: response.content,
            metadata: {
              characterCount: response.content.length,
              wordCount: response.content.trim()
                ? response.content.trim().split(/\s+/).length
                : 0,
            },
          };
        })
      );

      setRepurposedContent(results);
      setActiveTab("results");
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to generate content");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyContent = (content: string, format: string) => {
    Alert.alert("Copied", `${format} content copied to clipboard`);
  };

  const handlePublishContent = (format: string, content: string) => {
    Alert.alert("Publish", `Ready to publish to ${format}?`, [
      { text: "Cancel", onPress: () => {} },
      {
        text: "Publish",
        onPress: () => {
          Alert.alert("Success", `Content published to ${format}`);
        },
      },
    ]);
  };

  const renderFormatCard = (item: (typeof REPURPOSING_FORMATS)[number]) => (
    <TouchableOpacity
      key={item.format}
      style={[
        styles.formatCard,
        selectedFormats.includes(item.format) && styles.formatCardSelected,
      ]}
      onPress={() => handleFormatToggle(item.format)}
    >
      <Text style={styles.formatIcon}>{item.icon}</Text>
      <Text style={styles.formatTitle}>{item.title}</Text>
      <View style={styles.formatCheckbox}>
        {selectedFormats.includes(item.format) && (
          <Text style={styles.checkmark}>✓</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderResultCard = (item: RepurposedContent) => (
    <View key={item.format} style={styles.resultCard}>
      <View style={styles.resultHeader}>
        <Text style={styles.resultIcon}>{item.icon}</Text>
        <View style={styles.resultTitleContainer}>
          <Text style={styles.resultTitle}>{item.title}</Text>
          <Text style={styles.resultMeta}>
            {item.metadata.wordCount} words • {item.metadata.characterCount}{" "}
            chars
          </Text>
        </View>
      </View>

      <View style={styles.resultContent}>
        <Text style={styles.resultText} numberOfLines={4}>
          {item.content}
        </Text>
      </View>

      <View style={styles.resultActions}>
        <TouchableOpacity
          style={styles.resultActionButton}
          onPress={() => handleCopyContent(item.content, item.title)}
        >
          <Text style={styles.resultActionText}>📋 Copy</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.resultActionButton, styles.resultActionButtonPrimary]}
          onPress={() => handlePublishContent(item.format, item.content)}
        >
          <Text style={styles.resultActionTextPrimary}>📤 Publish</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "generate" && styles.tabActive]}
          onPress={() => setActiveTab("generate")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "generate" && styles.tabTextActive,
            ]}
          >
            Generate
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "results" && styles.tabActive]}
          onPress={() => setActiveTab("results")}
          disabled={repurposedContent.length === 0}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "results" && styles.tabTextActive,
            ]}
          >
            Results ({repurposedContent.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {activeTab === "generate" ? (
          <>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Repurpose Content</Text>
              <Text style={styles.subtitle}>
                Transform your post into multiple formats
              </Text>
            </View>

            {/* Post Info */}
            <View style={styles.postInfo}>
              <Text style={styles.postTitle}>{post?.title || "Untitled"}</Text>
              <Text style={styles.postStats}>
                {post?.content?.split(" ").length || 0} words
              </Text>
            </View>

            {/* Format Selection */}
            <Text style={styles.sectionTitle}>Select Formats</Text>
            <View style={styles.formatsGrid}>
              {REPURPOSING_FORMATS.map(format => renderFormatCard(format))}
            </View>

            {/* Generate Button */}
            <TouchableOpacity
              style={[
                styles.generateButton,
                isGenerating && styles.generateButtonDisabled,
              ]}
              onPress={handleGenerate}
              disabled={isGenerating || selectedFormats.length === 0}
            >
              {isGenerating ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.generateButtonText}>
                  Generate {selectedFormats.length} Format
                  {selectedFormats.length !== 1 ? "s" : ""}
                </Text>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <>
            {/* Results Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Generated Content</Text>
              <Text style={styles.subtitle}>
                {repurposedContent.length} format
                {repurposedContent.length !== 1 ? "s" : ""} ready
              </Text>
            </View>

            {/* Results */}
            <FlatList
              data={repurposedContent}
              renderItem={({ item }) => renderResultCard(item)}
              keyExtractor={item => item.format}
              scrollEnabled={false}
              style={styles.resultsList}
            />

            {/* Publish All Button */}
            <TouchableOpacity style={styles.publishAllButton}>
              <Text style={styles.publishAllButtonText}>
                📤 Publish All to Social Media
              </Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  tabs: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#1e293b",
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: {
    borderBottomColor: "#3b82f6",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#9ca3af",
  },
  tabTextActive: {
    color: "#3b82f6",
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
  postInfo: {
    backgroundColor: "#1e293b",
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  postTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  postStats: {
    fontSize: 12,
    color: "#9ca3af",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 12,
  },
  formatsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 24,
  },
  formatCard: {
    width: "48%",
    backgroundColor: "#1e293b",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  formatCardSelected: {
    borderColor: "#3b82f6",
    backgroundColor: "#1e3a5f",
  },
  formatIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  formatTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#fff",
    textAlign: "center",
  },
  formatCheckbox: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#3b82f6",
    justifyContent: "center",
    alignItems: "center",
  },
  checkmark: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "bold",
  },
  generateButton: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#3b82f6",
    alignItems: "center",
    marginBottom: 24,
  },
  generateButtonDisabled: {
    opacity: 0.6,
  },
  generateButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  resultsList: {
    marginBottom: 24,
  },
  resultCard: {
    backgroundColor: "#1e293b",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  resultIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  resultTitleContainer: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 2,
  },
  resultMeta: {
    fontSize: 11,
    color: "#9ca3af",
  },
  resultContent: {
    backgroundColor: "#0f172a",
    padding: 12,
    borderRadius: 6,
    marginBottom: 12,
  },
  resultText: {
    fontSize: 12,
    color: "#d1d5db",
    lineHeight: 18,
  },
  resultActions: {
    flexDirection: "row",
    gap: 8,
  },
  resultActionButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#475569",
    alignItems: "center",
  },
  resultActionButtonPrimary: {
    backgroundColor: "#3b82f6",
    borderColor: "#3b82f6",
  },
  resultActionText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#d1d5db",
  },
  resultActionTextPrimary: {
    fontSize: 12,
    fontWeight: "600",
    color: "#fff",
  },
  publishAllButton: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#10b981",
    alignItems: "center",
    marginBottom: 24,
  },
  publishAllButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
});

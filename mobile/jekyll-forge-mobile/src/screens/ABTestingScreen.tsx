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
import { enqueueAbVariationPublish } from "../services/offlineQueueProducers";

interface Variation {
  variationIndex: number;
  tone: string;
  angle: string;
  headline: string;
  content: string;
}

const AB_PLATFORMS = [
  "twitter",
  "linkedin",
  "facebook",
  "instagram",
] as const;

type AbPlatform = (typeof AB_PLATFORMS)[number];

interface TestResult {
  variationIndex: number;
  platform: string;
  impressions: number;
  engagements: number;
  clicks: number;
  engagementRate: number;
}

type ABTestingScreenProps = {
  route: {
    params?: {
      postId?: number;
      post?: { title?: string; content?: string };
    };
  };
};

export default function ABTestingScreen({ route }: ABTestingScreenProps) {
  const { postId, post } = route.params || {};
  const [activeTab, setActiveTab] = useState<"generate" | "results">(
    "generate"
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [variations, setVariations] = useState<Variation[]>([]);
  const [testResults] = useState<TestResult[]>([]);
  const [variationCount, setVariationCount] = useState(3);
  const [selectedPlatforms, setSelectedPlatforms] = useState<AbPlatform[]>([
    "twitter",
    "linkedin",
  ]);

  const generateMutation = trpc.abTesting.generateVariations.useMutation();
  const publishMutation = trpc.abTesting.publishVariation.useMutation();

  const handleGenerateVariations = async () => {
    if (typeof postId !== "number") {
      Alert.alert("Error", "Save the post before generating variations.");
      return;
    }
    setIsGenerating(true);
    try {
      const response = await generateMutation.mutateAsync({
        postId,
        count: variationCount,
        content: post?.content || "",
        headline: post?.title || "",
      });

      setVariations(response.variations);
      setActiveTab("results");
    } catch (error: unknown) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to generate variations"
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePublishVariations = async () => {
    if (variations.length === 0) {
      Alert.alert("Error", "No variations to publish");
      return;
    }
    if (typeof postId !== "number" || selectedPlatforms.length === 0) {
      Alert.alert("Error", "Select at least one platform and save the post first.");
      return;
    }

    Alert.alert(
      "Publish Variations",
      `Publish ${variations.length} variations to ${selectedPlatforms.join(", ")}?`,
      [
        { text: "Cancel", onPress: () => {} },
        {
          text: "Publish",
          onPress: async () => {
            try {
              let publishedCount = 0;
              let queuedCount = 0;
              for (const variation of variations) {
                const payload = {
                  postId,
                  variationIndex: variation.variationIndex,
                  platforms: selectedPlatforms,
                };
                try {
                  await publishMutation.mutateAsync(payload);
                  publishedCount += 1;
                } catch (error) {
                  console.warn("Queueing A/B variation for retry:", error);
                  await enqueueAbVariationPublish(payload);
                  queuedCount += 1;
                }
              }
              Alert.alert(
                queuedCount > 0 ? "Variations queued" : "Success",
                queuedCount > 0
                  ? `${publishedCount} variation(s) published and ${queuedCount} will retry when online.`
                  : "All variations published"
              );
            } catch (error: unknown) {
              Alert.alert(
                "Error",
                error instanceof Error
                  ? error.message
                  : "Failed to publish variations"
              );
            }
          },
        },
      ]
    );
  };

  const renderVariationCard = (variation: Variation) => (
    <View key={variation.variationIndex} style={styles.variationCard}>
      <View style={styles.variationHeader}>
        <View style={styles.variationBadges}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{variation.tone}</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{variation.angle}</Text>
          </View>
        </View>
        <Text style={styles.variationIndex}>
          Variation {variation.variationIndex}
        </Text>
      </View>

      <Text style={styles.variationTitle}>{variation.headline}</Text>
      <Text style={styles.variationPreview} numberOfLines={3}>
        {variation.content}
      </Text>

      <View style={styles.variationActions}>
        <TouchableOpacity style={styles.viewButton}>
          <Text style={styles.viewButtonText}>👁️ View</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.editButton}>
          <Text style={styles.editButtonText}>✏️ Edit</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderResultCard = (result: TestResult) => {
    const winner =
      testResults.length > 0 &&
      result.engagementRate ===
        Math.max(...testResults.map(r => r.engagementRate));

    return (
      <View
        key={`${result.variationIndex}-${result.platform}`}
        style={[styles.resultCard, winner && styles.resultCardWinner]}
      >
        <View style={styles.resultHeader}>
          <Text style={styles.resultVariation}>
            Variation {result.variationIndex + 1}
          </Text>
          <Text style={styles.resultPlatform}>{result.platform}</Text>
          {winner && <Text style={styles.winnerBadge}>🏆 Winner</Text>}
        </View>

        <View style={styles.resultMetrics}>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>Impressions</Text>
            <Text style={styles.metricValue}>
              {result.impressions.toLocaleString()}
            </Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>Engagements</Text>
            <Text style={styles.metricValue}>
              {result.engagements.toLocaleString()}
            </Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>Engagement Rate</Text>
            <Text
              style={[styles.metricValue, winner && styles.metricValueWinner]}
            >
              {result.engagementRate.toFixed(1)}%
            </Text>
          </View>
        </View>
      </View>
    );
  };

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
          disabled={variations.length === 0}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "results" && styles.tabTextActive,
            ]}
          >
            Results ({variations.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {activeTab === "generate" ? (
          <>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>A/B Testing</Text>
              <Text style={styles.subtitle}>
                Generate and test content variations
              </Text>
            </View>

            {/* Post Info */}
            <View style={styles.postInfo}>
              <Text style={styles.postTitle}>{post?.title || "Untitled"}</Text>
              <Text style={styles.postStats}>
                {post?.content?.split(" ").length || 0} words
              </Text>
            </View>

            {/* Variation Count */}
            <View style={styles.optionSection}>
              <Text style={styles.optionLabel}>Number of Variations</Text>
              <View style={styles.countButtons}>
                {[2, 3, 4, 5].map(count => (
                  <TouchableOpacity
                    key={count}
                    style={[
                      styles.countButton,
                      variationCount === count && styles.countButtonActive,
                    ]}
                    onPress={() => setVariationCount(count)}
                  >
                    <Text
                      style={[
                        styles.countButtonText,
                        variationCount === count &&
                          styles.countButtonTextActive,
                      ]}
                    >
                      {count}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Platform Selection */}
            <View style={styles.optionSection}>
              <Text style={styles.optionLabel}>Publish Platforms</Text>
              <View style={styles.platformButtons}>
                {AB_PLATFORMS.map(
                  platform => (
                    <TouchableOpacity
                      key={platform}
                      style={[
                        styles.platformButton,
                        selectedPlatforms.includes(platform) &&
                          styles.platformButtonActive,
                      ]}
                  onPress={() => {
                        setSelectedPlatforms(prev =>
                          prev.includes(platform)
                            ? prev.filter(p => p !== platform)
                            : [...prev, platform]
                        );
                      }}
                    >
                      <Text
                        style={[
                          styles.platformButtonText,
                          selectedPlatforms.includes(platform) &&
                            styles.platformButtonTextActive,
                        ]}
                      >
                        {platform.charAt(0).toUpperCase() + platform.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  )
                )}
              </View>
            </View>

            {/* Generate Button */}
            <TouchableOpacity
              style={[
                styles.generateButton,
                isGenerating && styles.generateButtonDisabled,
              ]}
              onPress={handleGenerateVariations}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.generateButtonText}>
                  Generate {variationCount} Variations
                </Text>
              )}
            </TouchableOpacity>

            {/* Info */}
            <View style={styles.infoCard}>
              <Text style={styles.infoIcon}>ℹ️</Text>
              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>How A/B Testing Works</Text>
                <Text style={styles.infoText}>
                  We'll generate {variationCount} variations with different
                  tones and angles, publish them to your selected platforms, and
                  track which performs best.
                </Text>
              </View>
            </View>
          </>
        ) : (
          <>
            {/* Results Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Test Results</Text>
              <Text style={styles.subtitle}>
                {variations.length} variations • {selectedPlatforms.length}{" "}
                platform{selectedPlatforms.length !== 1 ? "s" : ""}
              </Text>
            </View>

            {/* Variations */}
            <Text style={styles.sectionTitle}>Variations</Text>
            <FlatList
              data={variations}
              renderItem={({ item }) => renderVariationCard(item)}
              keyExtractor={item => String(item.variationIndex)}
              scrollEnabled={false}
              style={styles.variationsList}
            />

            {/* Results */}
            {testResults.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Performance Metrics</Text>
                <FlatList
                  data={testResults}
                  renderItem={({ item }) => renderResultCard(item)}
                  keyExtractor={item =>
                    `${item.variationIndex}-${item.platform}`
                  }
                  scrollEnabled={false}
                  style={styles.resultsList}
                />
              </>
            )}

            {/* Publish Button */}
            <TouchableOpacity
              style={styles.publishButton}
              onPress={handlePublishVariations}
            >
              <Text style={styles.publishButtonText}>
                📤 Publish All Variations
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
  optionSection: {
    marginBottom: 24,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 12,
  },
  countButtons: {
    flexDirection: "row",
    gap: 8,
  },
  countButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: "#1e293b",
    borderWidth: 1,
    borderColor: "#475569",
    alignItems: "center",
  },
  countButtonActive: {
    backgroundColor: "#3b82f6",
    borderColor: "#3b82f6",
  },
  countButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#9ca3af",
  },
  countButtonTextActive: {
    color: "#fff",
  },
  platformButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  platformButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: "#1e293b",
    borderWidth: 1,
    borderColor: "#475569",
  },
  platformButtonActive: {
    backgroundColor: "#3b82f6",
    borderColor: "#3b82f6",
  },
  platformButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#9ca3af",
  },
  platformButtonTextActive: {
    color: "#fff",
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
  infoCard: {
    flexDirection: "row",
    backgroundColor: "#1e3a5f",
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#3b82f6",
  },
  infoIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 4,
  },
  infoText: {
    fontSize: 12,
    color: "#d1d5db",
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 12,
    marginTop: 24,
  },
  variationsList: {
    marginBottom: 24,
  },
  variationCard: {
    backgroundColor: "#1e293b",
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  variationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  variationBadges: {
    flexDirection: "row",
    gap: 8,
  },
  badge: {
    backgroundColor: "#3b82f6",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#fff",
  },
  variationIndex: {
    fontSize: 12,
    fontWeight: "600",
    color: "#9ca3af",
  },
  variationTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  variationPreview: {
    fontSize: 12,
    color: "#d1d5db",
    lineHeight: 18,
    marginBottom: 12,
  },
  variationActions: {
    flexDirection: "row",
    gap: 8,
  },
  viewButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#475569",
    alignItems: "center",
  },
  viewButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#d1d5db",
  },
  editButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: "#3b82f6",
    alignItems: "center",
  },
  editButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#fff",
  },
  resultsList: {
    marginBottom: 24,
  },
  resultCard: {
    backgroundColor: "#1e293b",
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#475569",
  },
  resultCardWinner: {
    borderLeftColor: "#fbbf24",
    backgroundColor: "#1e3a1f",
  },
  resultHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  resultVariation: {
    fontSize: 13,
    fontWeight: "600",
    color: "#fff",
  },
  resultPlatform: {
    fontSize: 12,
    color: "#9ca3af",
  },
  winnerBadge: {
    fontSize: 12,
    fontWeight: "600",
    color: "#fbbf24",
  },
  resultMetrics: {
    flexDirection: "row",
    gap: 12,
  },
  metric: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 11,
    color: "#9ca3af",
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#3b82f6",
  },
  metricValueWinner: {
    color: "#fbbf24",
  },
  publishButton: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#10b981",
    alignItems: "center",
    marginBottom: 24,
  },
  publishButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
});

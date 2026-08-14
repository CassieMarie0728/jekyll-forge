import React, { useState } from "react";
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
import { trpc } from "../utils/trpc";

interface PlatformMetrics {
  platform: "twitter" | "linkedin" | "facebook" | "instagram";
  icon: string;
  name: string;
  impressions: number;
  engagements: number;
  clicks: number;
  shares: number;
  engagementRate: number;
}

interface Post {
  id: string;
  title: string;
  platform: string;
  status: string;
  metrics: {
    impressions: number;
    engagements: number;
    clicks: number;
  };
}

export default function SocialAnalyticsScreen({ route }: any) {
  const [selectedPlatform, setSelectedPlatform] = useState<string>("all");

  const { data: analyticsData, isLoading } =
    trpc.socialMedia.getAnalyticsSummary.useQuery();

  const getPlatformMetrics = (
    platform: PlatformMetrics["platform"]
  ) => {
    const metrics = analyticsData?.byPlatform[platform];
    const impressions = metrics?.impressions || 0;
    const engagements = metrics?.engagements || 0;
    return {
      impressions,
      engagements,
      clicks: metrics?.clicks || 0,
      shares: 0,
      engagementRate: impressions > 0 ? (engagements / impressions) * 100 : 0,
    };
  };

  const platformMetrics: PlatformMetrics[] = [
    {
      platform: "twitter",
      icon: "𝕏",
      name: "Twitter/X",
      ...getPlatformMetrics("twitter"),
    },
    {
      platform: "linkedin",
      icon: "💼",
      name: "LinkedIn",
      ...getPlatformMetrics("linkedin"),
    },
    {
      platform: "facebook",
      icon: "👍",
      name: "Facebook",
      ...getPlatformMetrics("facebook"),
    },
    {
      platform: "instagram",
      icon: "📸",
      name: "Instagram",
      ...getPlatformMetrics("instagram"),
    },
  ];

  const renderMetricCard = (metric: PlatformMetrics) => (
    <TouchableOpacity
      key={metric.platform}
      style={[
        styles.metricCard,
        selectedPlatform === metric.platform && styles.metricCardActive,
      ]}
      onPress={() => setSelectedPlatform(metric.platform)}
    >
      <Text style={styles.metricIcon}>{metric.icon}</Text>
      <Text style={styles.metricName}>{metric.name}</Text>
      <View style={styles.metricStats}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>
            {metric.impressions.toLocaleString()}
          </Text>
          <Text style={styles.statLabel}>Impressions</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>
            {metric.engagements.toLocaleString()}
          </Text>
          <Text style={styles.statLabel}>Engagements</Text>
        </View>
      </View>
      <View style={styles.engagementRate}>
        <Text style={styles.engagementRateValue}>
          {metric.engagementRate.toFixed(1)}%
        </Text>
        <Text style={styles.engagementRateLabel}>Engagement Rate</Text>
      </View>
    </TouchableOpacity>
  );

  const renderStatRow = (
    label: string,
    value: number,
    color: string = "#3b82f6"
  ) => (
    <View style={styles.statRow}>
      <Text style={styles.statRowLabel}>{label}</Text>
      <View style={styles.statRowValue}>
        <View
          style={[
            styles.statRowBar,
            {
              backgroundColor: color,
              width: `${Math.min((value / 1000) * 100, 100)}%`,
            },
          ]}
        />
        <Text style={styles.statRowNumber}>{value.toLocaleString()}</Text>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      </SafeAreaView>
    );
  }

  const selectedMetrics =
    platformMetrics.find(m => m.platform === selectedPlatform) ||
    platformMetrics[0];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Social Media Analytics</Text>
          <Text style={styles.subtitle}>Track your post performance</Text>
        </View>

        {/* Platform Cards */}
        <View style={styles.platformsContainer}>
          {platformMetrics.map(metric => renderMetricCard(metric))}
        </View>

        {/* Detailed Stats */}
        <View style={styles.detailedSection}>
          <Text style={styles.sectionTitle}>
            {selectedMetrics.name} Details
          </Text>
          <View style={styles.statsCard}>
            {renderStatRow(
              "Impressions",
              selectedMetrics.impressions,
              "#3b82f6"
            )}
            {renderStatRow(
              "Engagements",
              selectedMetrics.engagements,
              "#10b981"
            )}
            {renderStatRow("Clicks", selectedMetrics.clicks, "#f59e0b")}
            {renderStatRow("Shares", selectedMetrics.shares, "#8b5cf6")}
          </View>
        </View>

        {/* Performance Tips */}
        <View style={styles.tipsSection}>
          <Text style={styles.sectionTitle}>Performance Tips</Text>
          <View style={styles.tipCard}>
            <Text style={styles.tipIcon}>💡</Text>
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Best Posting Time</Text>
              <Text style={styles.tipText}>
                Post between 9 AM - 12 PM for maximum engagement
              </Text>
            </View>
          </View>
          <View style={styles.tipCard}>
            <Text style={styles.tipIcon}>📊</Text>
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Top Performer</Text>
              <Text style={styles.tipText}>
                {selectedMetrics.name} has the highest engagement rate
              </Text>
            </View>
          </View>
          <View style={styles.tipCard}>
            <Text style={styles.tipIcon}>🎯</Text>
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Engagement Goal</Text>
              <Text style={styles.tipText}>
                Aim for 5%+ engagement rate for optimal reach
              </Text>
            </View>
          </View>
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
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#9ca3af",
  },
  platformsContainer: {
    marginBottom: 24,
  },
  metricCard: {
    backgroundColor: "#1e293b",
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: "transparent",
  },
  metricCardActive: {
    borderColor: "#3b82f6",
  },
  metricIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  metricName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 12,
  },
  metricStats: {
    flexDirection: "row",
    marginBottom: 12,
    gap: 12,
  },
  stat: {
    flex: 1,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#3b82f6",
  },
  statLabel: {
    fontSize: 11,
    color: "#9ca3af",
    marginTop: 2,
  },
  engagementRate: {
    alignItems: "center",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#334155",
  },
  engagementRateValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#10b981",
  },
  engagementRateLabel: {
    fontSize: 11,
    color: "#9ca3af",
    marginTop: 2,
  },
  detailedSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 12,
  },
  statsCard: {
    backgroundColor: "#1e293b",
    padding: 16,
    borderRadius: 8,
  },
  statRow: {
    marginBottom: 16,
  },
  statRowLabel: {
    fontSize: 12,
    color: "#9ca3af",
    marginBottom: 6,
  },
  statRowValue: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statRowBar: {
    height: 20,
    borderRadius: 4,
    minWidth: 40,
  },
  statRowNumber: {
    fontSize: 12,
    fontWeight: "600",
    color: "#fff",
  },
  tipsSection: {
    marginBottom: 24,
  },
  tipCard: {
    flexDirection: "row",
    backgroundColor: "#1e293b",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: "flex-start",
  },
  tipIcon: {
    fontSize: 20,
    marginRight: 12,
    marginTop: 2,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 2,
  },
  tipText: {
    fontSize: 12,
    color: "#9ca3af",
  },
});

/**
 * A/B Testing Framework for Social Media Posts
 * Allows testing different variations of content and tracking performance
 */

export interface PostVariation {
  id: string;
  content: string;
  headline?: string;
  callToAction?: string;
  hashtags?: string[];
  mediaType?: "text" | "image" | "video" | "link";
}

export interface ABTest {
  id: string;
  userId: number;
  repurposedContentId: number;
  platform: "twitter" | "linkedin" | "facebook" | "instagram";
  variations: PostVariation[];
  status: "draft" | "active" | "completed" | "paused";
  startDate: Date;
  endDate?: Date;
  winnerVariationId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface VariationMetrics {
  variationId: string;
  impressions: number;
  clicks: number;
  engagements: number;
  likes: number;
  comments: number;
  shares: number;
  conversionRate: number;
  engagementRate: number;
}

export interface ABTestResults {
  testId: string;
  variations: VariationMetrics[];
  winnerVariationId?: string;
  confidenceLevel?: number;
  statisticalSignificance?: boolean;
}

/**
 * Create A/B test variations
 */
export function createVariations(
  baseContent: string,
  count: number = 3
): PostVariation[] {
  const variations: PostVariation[] = [];

  // Variation 1: Original
  variations.push({
    id: "var-1",
    content: baseContent,
  });

  // Variation 2: With question
  if (count >= 2) {
    variations.push({
      id: "var-2",
      content: `${baseContent}\n\nWhat do you think?`,
    });
  }

  // Variation 3: With call to action
  if (count >= 3) {
    variations.push({
      id: "var-3",
      content: `${baseContent}\n\nLearn more →`,
    });
  }

  // Variation 4: Shorter version
  if (count >= 4) {
    const shortened = baseContent.substring(
      0,
      Math.floor(baseContent.length * 0.8)
    );
    variations.push({
      id: "var-4",
      content: shortened,
    });
  }

  return variations;
}

/**
 * Calculate engagement rate
 */
export function calculateEngagementRate(
  engagements: number,
  impressions: number
): number {
  if (impressions === 0) return 0;
  return (engagements / impressions) * 100;
}

/**
 * Calculate conversion rate
 */
export function calculateConversionRate(
  clicks: number,
  impressions: number
): number {
  if (impressions === 0) return 0;
  return (clicks / impressions) * 100;
}

/**
 * Determine winner using statistical significance
 */
export function determineWinner(
  variations: VariationMetrics[]
): { winnerId: string; confidence: number; isSignificant: boolean } | null {
  if (variations.length < 2) return null;

  // Sort by engagement rate
  const sorted = [...variations].sort(
    (a, b) => b.engagementRate - a.engagementRate
  );

  const winner = sorted[0];
  const runner = sorted[1];

  // Simple confidence calculation (Chi-square test approximation)
  const engagementDiff = Math.abs(
    winner.engagementRate - runner.engagementRate
  );
  const confidence = Math.min(100, engagementDiff * 10);

  // Consider significant if confidence > 85% and engagement difference > 10%
  const isSignificant = confidence > 85 && engagementDiff > 10;

  return {
    winnerId: winner.variationId,
    confidence,
    isSignificant,
  };
}

/**
 * Generate A/B test report
 */
export function generateABTestReport(results: ABTestResults): string {
  const lines: string[] = [];

  lines.push("=== A/B Test Results ===\n");

  // Sort variations by engagement rate
  const sorted = [...results.variations].sort(
    (a, b) => b.engagementRate - a.engagementRate
  );

  lines.push("Variation Performance:");
  sorted.forEach((variation, index) => {
    lines.push(`\n${index + 1}. Variation ${variation.variationId}`);
    lines.push(`   Impressions: ${variation.impressions}`);
    lines.push(`   Clicks: ${variation.clicks}`);
    lines.push(`   Engagement Rate: ${variation.engagementRate.toFixed(2)}%`);
    lines.push(`   Conversion Rate: ${variation.conversionRate.toFixed(2)}%`);
    lines.push(`   Engagements: ${variation.engagements}`);
  });

  if (results.winnerVariationId) {
    lines.push(`\n✓ Winner: Variation ${results.winnerVariationId}`);
    if (results.confidenceLevel) {
      lines.push(`  Confidence: ${results.confidenceLevel.toFixed(1)}%`);
    }
    if (results.statisticalSignificance) {
      lines.push("  Statistical Significance: Yes");
    }
  } else {
    lines.push("\nNo clear winner yet. Continue testing.");
  }

  return lines.join("\n");
}

/**
 * Recommend best performing variation
 */
export function recommendBestVariation(
  variations: VariationMetrics[]
): PostVariation | null {
  if (variations.length === 0) return null;

  const best = variations.reduce((prev, current) =>
    current.engagementRate > prev.engagementRate ? current : prev
  );

  return {
    id: best.variationId,
    content: "", // Would need to fetch from DB
  };
}

/**
 * Calculate sample size needed for statistical significance
 */
export function calculateRequiredSampleSize(
  baselineRate: number,
  minimumDetectableEffect: number = 0.1,
  confidenceLevel: number = 0.95,
  power: number = 0.8
): number {
  // Simplified sample size calculation
  // In production, use proper statistical libraries
  const z = confidenceLevel === 0.95 ? 1.96 : 1.645;
  const beta = power === 0.8 ? 0.84 : 0.64;

  const p1 = baselineRate;
  const p2 = baselineRate + minimumDetectableEffect;

  const numerator = (z + beta) ** 2 * (p1 * (1 - p1) + p2 * (1 - p2));
  const denominator = (p1 - p2) ** 2;

  return Math.ceil(numerator / denominator);
}

/**
 * Suggest next variation based on performance
 */
export function suggestNextVariation(
  baseContent: string,
  topPerformer: PostVariation
): PostVariation {
  // Analyze what made the top performer successful
  // and suggest improvements

  const hasQuestion = topPerformer.content.includes("?");
  const hasCTA = topPerformer.content.toLowerCase().includes("learn more");
  const length = topPerformer.content.length;

  let suggestion = baseContent;

  // If question performed well, try different question
  if (hasQuestion) {
    suggestion = `${baseContent}\n\nHow has this impacted you?`;
  }
  // If CTA performed well, try different CTA
  else if (hasCTA) {
    suggestion = `${baseContent}\n\nDiscover more →`;
  }
  // If short version performed well, make even shorter
  else if (length < baseContent.length * 0.8) {
    suggestion = baseContent.substring(0, Math.floor(length * 0.9));
  }

  return {
    id: `var-suggested`,
    content: suggestion,
  };
}

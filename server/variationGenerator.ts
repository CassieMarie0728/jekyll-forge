/**
 * Content Variation Generator
 * Generates multiple variations of blog posts using LLM with different tones and angles
 */

import { invokeLLM } from "./_core/llm";

export interface VariationOptions {
  count?: number; // Number of variations to generate (default: 3)
  tones?: string[]; // Tones to use (default: professional, casual, humorous)
  angles?: string[]; // Angles to use (default: beginner-friendly, advanced, contrarian)
}

const DEFAULT_TONES = ["professional", "casual", "humorous"];
const DEFAULT_ANGLES = ["beginner-friendly", "advanced", "contrarian"];

export interface GeneratedVariation {
  variationIndex: number;
  headline: string;
  content: string;
  tone: string;
  angle: string;
}

/**
 * Generate variations of a blog post using LLM
 */
export async function generatePostVariations(
  originalHeadline: string,
  originalContent: string,
  options: VariationOptions = {}
): Promise<GeneratedVariation[]> {
  const count = options.count || 3;
  const tones = options.tones || DEFAULT_TONES;
  const angles = options.angles || DEFAULT_ANGLES;

  const variations: GeneratedVariation[] = [];

  // Generate variations with different combinations of tones and angles
  let variationIndex = 1;
  for (let i = 0; i < count && i < tones.length * angles.length; i++) {
    const tone = tones[i % tones.length];
    const angle = angles[Math.floor(i / tones.length) % angles.length];

    const variation = await generateSingleVariation(
      originalHeadline,
      originalContent,
      tone,
      angle,
      variationIndex
    );

    variations.push(variation);
    variationIndex++;
  }

  return variations;
}

/**
 * Generate a single variation with specified tone and angle
 */
async function generateSingleVariation(
  headline: string,
  content: string,
  tone: string,
  angle: string,
  variationIndex: number
): Promise<GeneratedVariation> {
  const prompt = buildVariationPrompt(headline, content, tone, angle);

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are an expert content strategist and copywriter. Your task is to rewrite blog posts with different tones and angles to maximize engagement and reach different audience segments.`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "post_variation",
          strict: true,
          schema: {
            type: "object",
            properties: {
              headline: {
                type: "string",
                description: "The rewritten headline (60-80 characters)",
              },
              content: {
                type: "string",
                description: "The rewritten post content (same length as original)",
              },
            },
            required: ["headline", "content"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = typeof response.choices[0].message.content === 'string' 
      ? response.choices[0].message.content 
      : JSON.stringify(response.choices[0].message.content);
    const result = JSON.parse(content || "{}");

    return {
      variationIndex,
      headline: result.headline || headline,
      content: result.content || content,
      tone,
      angle,
    };
  } catch (error) {
    console.error("[VariationGenerator] Error generating variation:", error);
    // Return original content if generation fails
    return {
      variationIndex,
      headline,
      content,
      tone,
      angle,
    };
  }
}

/**
 * Build the prompt for generating a variation
 */
function buildVariationPrompt(
  headline: string,
  content: string,
  tone: string,
  angle: string
): string {
  const toneDescriptions: Record<string, string> = {
    professional: "formal, authoritative, and business-focused",
    casual: "friendly, conversational, and approachable",
    humorous: "witty, entertaining, and lighthearted",
    technical: "detailed, precise, and technical",
    inspirational: "motivational, uplifting, and empowering",
  };

  const angleDescriptions: Record<string, string> = {
    "beginner-friendly": "for beginners with no prior knowledge",
    advanced: "for advanced practitioners looking for deep insights",
    contrarian: "challenging conventional wisdom with a fresh perspective",
    "data-driven": "backed by statistics, research, and concrete data",
    "story-based": "using narratives and real-world examples",
  };

  return `
Rewrite the following blog post with a different tone and angle:

ORIGINAL HEADLINE: ${headline}

ORIGINAL CONTENT:
${content}

TARGET TONE: ${tone} (${toneDescriptions[tone] || "adapt the writing style"})
TARGET ANGLE: ${angle} (${angleDescriptions[angle] || "adapt the perspective"})

INSTRUCTIONS:
1. Rewrite the headline to be compelling for the target tone and angle (60-80 characters)
2. Rewrite the content to match the target tone and angle
3. Keep the core message and key points intact
4. Maintain approximately the same length as the original
5. Make it engaging and optimized for the target audience
6. Return ONLY valid JSON with "headline" and "content" fields

Focus on:
- Adjusting vocabulary and sentence structure for the tone
- Reframing the angle to appeal to the target perspective
- Maintaining factual accuracy
- Creating compelling hooks and transitions
`;
}

/**
 * Calculate engagement metrics for variations
 */
export function calculateEngagementRate(
  engagements: number,
  impressions: number
): number {
  if (impressions === 0) return 0;
  return (engagements / impressions) * 100;
}

/**
 * Determine winning variation based on metrics
 */
export function determineWinner(
  results: Array<{
    variationIndex: number;
    engagementRate: number | string;
    engagements: number;
    clicks: number;
  }>
): {
  winningVariationIndex: number;
  winningMetric: string;
  engagementRateDifference: number;
} {
  if (results.length === 0) {
    return {
      winningVariationIndex: 0,
      winningMetric: "none",
      engagementRateDifference: 0,
    };
  }

  // Find variation with highest engagement rate
  const winner = results.reduce((prev, current) => {
    const currentRate = typeof current.engagementRate === 'string' ? parseFloat(current.engagementRate) : current.engagementRate;
    const prevRate = typeof prev.engagementRate === 'string' ? parseFloat(prev.engagementRate) : prev.engagementRate;
    return currentRate > prevRate ? current : prev;
  });

  const runnerUp = results.reduce((prev, current) => {
    const currentRate = typeof current.engagementRate === 'string' ? parseFloat(current.engagementRate) : current.engagementRate;
    const prevRate = typeof prev.engagementRate === 'string' ? parseFloat(prev.engagementRate) : prev.engagementRate;
    return currentRate < prevRate ? current : prev;
  });

  const winnerRate = typeof winner.engagementRate === 'string' ? parseFloat(winner.engagementRate) : winner.engagementRate;
  const runnerUpRate = typeof runnerUp.engagementRate === 'string' ? parseFloat(runnerUp.engagementRate) : runnerUp.engagementRate;
  const difference = winnerRate - runnerUpRate;

  return {
    winningVariationIndex: winner.variationIndex,
    winningMetric: "engagement_rate",
    engagementRateDifference: parseFloat(difference.toFixed(2)),
  };
}

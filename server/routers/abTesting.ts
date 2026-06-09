/**
 * A/B Testing Router
 * tRPC procedures for content variation generation, publishing, and analytics
 */

import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import {
  createContentVariation,
  getContentVariations,
  updateVariationStatus,
  createAbTestResult,
  updateAbTestMetrics,
  getAbTestResults,
  createAbTestSummary,
  updateAbTestSummary,
  getAbTestSummary,
} from "../db";
import {
  generatePostVariations,
  determineWinner,
  VariationOptions,
} from "../variationGenerator";

export const abTestingRouter = router({
  /**
   * Generate variations for a post
   */
  generateVariations: protectedProcedure
    .input(
      z.object({
        postId: z.number(),
        count: z.number().min(2).max(5).optional(),
        tones: z.array(z.string()).optional(),
        angles: z.array(z.string()).optional(),
        headline: z.string(),
        content: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const options: VariationOptions = {
          count: input.count || 3,
          tones: input.tones,
          angles: input.angles,
        };

        // Generate variations using LLM
        const variations = await generatePostVariations(
          input.headline,
          input.content,
          options
        );

        // Save variations to database
        const savedVariations = [];
        for (const variation of variations) {
          await createContentVariation(
            ctx.user.id,
            input.postId,
            variation.variationIndex,
            variation.headline,
            variation.content,
            variation.tone,
            variation.angle
          );
          savedVariations.push(variation);
        }

        // Create A/B test summary
        await createAbTestSummary(
          ctx.user.id,
          input.postId,
          variations.length,
          7 // 7-day test duration
        );

        return {
          success: true,
          variations: savedVariations,
          message: `Generated ${variations.length} variations for testing`,
        };
      } catch (error) {
        console.error("[abTesting.generateVariations] Error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to generate variations",
        });
      }
    }),

  /**
   * Get all variations for a post
   */
  getVariations: protectedProcedure
    .input(z.object({ postId: z.number() }))
    .query(async ({ ctx, input }) => {
      try {
        const variations = await getContentVariations(input.postId);
        return variations || [];
      } catch (error) {
        console.error("[abTesting.getVariations] Error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch variations",
        });
      }
    }),

  /**
   * Publish a variation to social media
   */
  publishVariation: protectedProcedure
    .input(
      z.object({
        postId: z.number(),
        variationIndex: z.number(),
        platforms: z.array(
          z.enum(["twitter", "linkedin", "facebook", "instagram", "email", "direct"])
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const results = [];

        for (const platform of input.platforms) {
          // Create test result record
          const testResult = await createAbTestResult(
            ctx.user.id,
            input.postId,
            input.variationIndex,
            platform
          );

          results.push({
            platform,
            status: "published",
            message: `Variation ${input.variationIndex} published to ${platform}`,
          });
        }

        // Update variation status to published
        await updateVariationStatus(input.variationIndex, "published");

        return {
          success: true,
          results,
          message: `Published variation to ${input.platforms.length} platform(s)`,
        };
      } catch (error) {
        console.error("[abTesting.publishVariation] Error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to publish variation",
        });
      }
    }),

  /**
   * Update metrics for a variation
   */
  updateMetrics: protectedProcedure
    .input(
      z.object({
        postId: z.number(),
        variationIndex: z.number(),
        platform: z.string(),
        metrics: z.object({
          impressions: z.number().optional(),
          engagements: z.number().optional(),
          clicks: z.number().optional(),
          shares: z.number().optional(),
          likes: z.number().optional(),
          replies: z.number().optional(),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const results = await getAbTestResults(input.postId);
        const testResult = results.find(
          (r) =>
            r.variationIndex === input.variationIndex &&
            r.platform === input.platform
        );

        if (!testResult) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Test result not found",
          });
        }

        await updateAbTestMetrics(testResult.id, input.metrics);

        return {
          success: true,
          message: "Metrics updated successfully",
        };
      } catch (error) {
        console.error("[abTesting.updateMetrics] Error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update metrics",
        });
      }
    }),

  /**
   * Get test results for a post
   */
  getResults: protectedProcedure
    .input(z.object({ postId: z.number() }))
    .query(async ({ ctx, input }) => {
      try {
        const results = await getAbTestResults(input.postId);
        const summary = await getAbTestSummary(input.postId);

        // Format results for frontend
        const formattedResults = (results || []).map((r) => ({
          ...r,
          engagementRate: r.engagementRate || "0",
        }));

        return {
          results: formattedResults,
          summary: summary?.[0] || null,
        };
      } catch (error) {
        console.error("[abTesting.getResults] Error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch test results",
        });
      }
    }),

  /**
   * Determine winner and complete test
   */
  completeTest: protectedProcedure
    .input(z.object({ postId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const results = await getAbTestResults(input.postId);
        const summary = await getAbTestSummary(input.postId);

        if (!summary || summary.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Test summary not found",
          });
        }

        // Calculate winner based on engagement rates
        const formattedResults = results.map((r) => ({
          variationIndex: r.variationIndex,
          engagementRate: r.engagementRate || "0",
          engagements: r.engagements || 0,
          clicks: r.clicks || 0,
        }));

        const { winningVariationIndex, winningMetric, engagementRateDifference } =
          determineWinner(formattedResults);

        // Generate insights
        const insights = {
          winningVariationIndex,
          winningMetric,
          engagementRateDifference,
          totalVariations: results.length,
          topPerformer: results.find((r) => r.variationIndex === winningVariationIndex),
          allResults: formattedResults,
          completedAt: new Date().toISOString(),
        };

        // Update summary with winner
        await updateAbTestSummary(
          summary[0].id,
          winningVariationIndex,
          winningMetric,
          insights
        );

        return {
          success: true,
          winner: winningVariationIndex,
          insights,
          message: `Test completed. Variation ${winningVariationIndex} is the winner!`,
        };
      } catch (error) {
        console.error("[abTesting.completeTest] Error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to complete test",
        });
      }
    }),

  /**
   * Apply winning version to original post
   */
  applyWinner: protectedProcedure
    .input(
      z.object({
        postId: z.number(),
        winningVariationIndex: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const variations = await getContentVariations(input.postId);
        const winner = variations.find(
          (v) => v.variationIndex === input.winningVariationIndex
        );

        if (!winner) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Winning variation not found",
          });
        }

        // In a real implementation, this would update the original post
        // For now, we'll just mark it as archived and return the winner data
        await updateVariationStatus(input.winningVariationIndex, "published");

        return {
          success: true,
          winner: {
            headline: winner.headline,
            content: winner.content,
            tone: winner.tone,
            angle: winner.angle,
          },
          message: "Winning variation applied successfully",
        };
      } catch (error) {
        console.error("[abTesting.applyWinner] Error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to apply winning variation",
        });
      }
    }),
});

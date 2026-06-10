import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  createSocialMediaAccount,
  getSocialMediaAccountsByUserId,
  getSocialMediaAccount,
  updateSocialMediaAccount,
  deleteSocialMediaAccount,
  createContentAnalytics,
  getContentAnalyticsByRepurposedId,
  getContentAnalyticsByPlatform,
  updateContentAnalytics,
  getAnalyticsSummary,
  getRepurposedContentById,
} from "../db";
import { getSocialMediaService } from "../_core/socialMediaService";
import { TRPCError } from "@trpc/server";

export const socialMediaRouter = router({
  /**
   * Connect a social media account (OAuth callback handler)
   */
  connectAccount: protectedProcedure
    .input(z.object({
      platform: z.enum(["twitter", "linkedin", "facebook", "instagram"]),
      accessToken: z.string(),
      refreshToken: z.string().optional(),
      expiresAt: z.date().optional(),
      accountId: z.string(),
      username: z.string().optional(),
      displayName: z.string().optional(),
      profileImageUrl: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const accountId = await createSocialMediaAccount({
          userId: ctx.user.id,
          platform: input.platform,
          accessToken: input.accessToken,
          refreshToken: input.refreshToken,
          expiresAt: input.expiresAt,
          accountId: input.accountId,
          username: input.username,
          displayName: input.displayName,
          profileImageUrl: input.profileImageUrl,
          isConnected: true,
        });

        return { success: true, accountId };
      } catch (error) {
        console.error("[SocialMedia] Connect error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to connect social media account",
        });
      }
    }),

  /**
   * Get all connected social media accounts
   */
  getAccounts: protectedProcedure.query(async ({ ctx }) => {
    return getSocialMediaAccountsByUserId(ctx.user.id);
  }),

  /**
   * Disconnect a social media account
   */
  disconnectAccount: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const account = await getSocialMediaAccount(input.id, ctx.user.id);
      if (!account) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Account not found" });
      }

      await deleteSocialMediaAccount(input.id, ctx.user.id);
      return { success: true };
    }),

  /**
   * Publish repurposed content to social media
   */
  publishContent: protectedProcedure
    .input(z.object({
      repurposedContentId: z.number(),
      accountId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Get the repurposed content
      const content = await getRepurposedContentById(input.repurposedContentId, ctx.user.id);
      if (!content) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Content not found" });
      }

      // Get the social media account
      const account = await getSocialMediaAccount(input.accountId, ctx.user.id);
      if (!account) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Account not found" });
      }

      try {
        // Get the appropriate service
        const service = getSocialMediaService(account.platform as "twitter" | "linkedin" | "facebook" | "instagram", account.accessToken);

        // Publish based on format
        let result;
        if (account.platform === "twitter" && content.format === "twitter") {
          // Parse Twitter thread
          const tweets = content.content
            .split("\n\n")
            .filter((t) => t.trim())
            .map((t) => t.trim());
          result = await (service as any).postThread(tweets);
        } else if (account.platform === "linkedin" && content.format === "linkedin") {
          // Extract title and content for LinkedIn
          const lines = content.content.split("\n");
          const title = lines[0] || "Check out this article";
          const body = lines.slice(1).join("\n");
          result = await (service as any).postArticle(title, body);
        } else {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Cannot publish ${content.format} content to ${account.platform}`,
          });
        }

        // Store analytics record
        const analyticsId = await createContentAnalytics({
          userId: ctx.user.id,
          repurposedContentId: input.repurposedContentId,
          platform: account.platform,
          externalPostId: result.externalPostId,
          externalUrl: result.externalUrl,
          impressions: 0,
          engagements: 0,
          clicks: 0,
        });

        return { success: true, analyticsId, ...result };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("[SocialMedia] Publish error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to publish to ${account.platform}`,
        });
      }
    }),

  /**
   * Get analytics for a repurposed content
   */
  getContentAnalytics: protectedProcedure
    .input(z.object({ repurposedContentId: z.number() }))
    .query(async ({ ctx, input }) => {
      return getContentAnalyticsByRepurposedId(input.repurposedContentId, ctx.user.id);
    }),

  /**
   * Get analytics by platform
   */
  getAnalyticsByPlatform: protectedProcedure
    .input(z.object({ platform: z.enum(["twitter", "linkedin"]) }))
    .query(async ({ ctx, input }) => {
      return getContentAnalyticsByPlatform(ctx.user.id, input.platform);
    }),

  /**
   * Sync analytics from social media platforms
   */
  syncAnalytics: protectedProcedure
    .input(z.object({ analyticsId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Get all analytics and find by ID
        const twitterAnalytics = await getContentAnalyticsByPlatform(ctx.user.id, "twitter");
        const linkedinAnalytics = await getContentAnalyticsByPlatform(ctx.user.id, "linkedin");
        const analytics = [...twitterAnalytics, ...linkedinAnalytics].find((a) => a.id === input.analyticsId);

        if (!analytics || !analytics.externalPostId) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Analytics record not found" });
        }

        // Get the account for this platform
        const accounts = await getSocialMediaAccountsByUserId(ctx.user.id);
        const account = accounts.find((a) => a.platform === analytics.platform);

        if (!account) {
          throw new TRPCError({ code: "NOT_FOUND", message: `No ${analytics.platform} account connected` });
        }

        // Get the service and fetch metrics
        const service = getSocialMediaService(account.platform, account.accessToken);
        const metrics = await (service as any).getTweetMetrics(analytics.externalPostId);

        // Update analytics
        await updateContentAnalytics(input.analyticsId, ctx.user.id, {
          impressions: metrics.impressions,
          engagements: metrics.engagements,
          clicks: metrics.clicks,
          likes: metrics.likes,
          replies: metrics.replies,
          retweets: metrics.retweets,
          shares: metrics.shares,
          lastSyncedAt: new Date(),
          rawMetrics: metrics,
        });

        return { success: true, metrics };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("[SocialMedia] Sync error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to sync analytics",
        });
      }
    }),

  /**
   * Get analytics summary for user
   */
  getAnalyticsSummary: protectedProcedure.query(async ({ ctx }) => {
    return getAnalyticsSummary(ctx.user.id);
  }),

  /**
   * Get details for a specific connected account
   */
  getAccountDetails: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const account = await getSocialMediaAccount(input.id, ctx.user.id);
      if (!account) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Account not found" });
      }
      return account;
    }),
});

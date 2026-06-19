import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  createRepurposedContent,
  getRepurposedContentByPostId,
  getRepurposedContentById,
  updateRepurposedContent,
  deleteRepurposedContent,
  getPostById,
  getAiSettings,
  incrementAiUsage,
} from "../db";
import { invokeLLM } from "../_core/llm";
import {
  getRepurposingPrompt,
  getFormatMetadata,
  RepurposingFormat,
} from "../repurposingPrompts";
import { TRPCError } from "@trpc/server";

export const repurposingRouter = router({
  /**
   * Generate repurposed content for a post in a specific format
   */
  generate: protectedProcedure
    .input(
      z.object({
        postId: z.number(),
        siteId: z.number(),
        format: z.enum([
          "twitter",
          "linkedin",
          "tiktok",
          "youtube",
          "newsletter",
          "email",
          "podcast",
          "slides",
        ]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify user owns the post
      const post = await getPostById(input.postId, ctx.user.id);
      if (!post) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Post not found" });
      }

      // Check AI settings
      const aiSettings = await getAiSettings(ctx.user.id);
      if (aiSettings && !aiSettings.enabled) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "AI features are disabled",
        });
      }

      // Get post content
      const postContent = post.markdown || "";
      if (!postContent.trim()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Post content is empty",
        });
      }

      try {
        // Build repurposing prompt
        const userPrompt = getRepurposingPrompt(
          input.format as RepurposingFormat,
          postContent
        );

        // Call LLM
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content:
                aiSettings?.systemPrompt ||
                "You are an expert content strategist specializing in repurposing blog content for different platforms. Create engaging, platform-appropriate content that maintains the core message of the original post.",
            },
            { role: "user", content: userPrompt },
          ],
        });

        const generatedContent = response.choices[0]?.message?.content;
        if (!generatedContent || typeof generatedContent !== "string") {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to generate content",
          });
        }

        // Track usage
        if (response.usage) {
          await incrementAiUsage(
            ctx.user.id,
            response.usage.prompt_tokens || 0,
            response.usage.completion_tokens || 0
          );
        }

        // Get format-specific metadata
        const metadata = getFormatMetadata(
          input.format as RepurposingFormat,
          generatedContent
        );

        // Save to database
        const contentId = await createRepurposedContent({
          userId: ctx.user.id,
          siteId: input.siteId,
          postId: input.postId,
          postTitle: post.title || "",
          postSlug: post.slug || "",
          format: input.format as RepurposingFormat,
          content: generatedContent,
          metadata,
          isCustomized: false,
          status: "generated",
        });

        return {
          id: contentId,
          format: input.format,
          content: generatedContent,
          metadata,
          isCustomized: false,
          status: "generated",
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("[Repurposing] Generation error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to generate repurposed content",
        });
      }
    }),

  /**
   * Get all repurposed content for a post
   */
  getByPost: protectedProcedure
    .input(
      z.object({
        postId: z.number(),
      })
    )
    .query(async ({ ctx, input }) => {
      return getRepurposedContentByPostId(input.postId, ctx.user.id);
    }),

  /**
   * Get a specific repurposed content item
   */
  getById: protectedProcedure
    .input(
      z.object({
        id: z.number(),
      })
    )
    .query(async ({ ctx, input }) => {
      return getRepurposedContentById(input.id, ctx.user.id);
    }),

  /**
   * Update repurposed content (e.g., mark as customized or approved)
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        content: z.string().optional(),
        status: z
          .enum(["generated", "approved", "published", "archived"])
          .optional(),
        isCustomized: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await getRepurposedContentById(input.id, ctx.user.id);
      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Repurposed content not found",
        });
      }

      const updateData: Record<string, unknown> = {};
      if (input.content !== undefined) {
        updateData.content = input.content;
        updateData.isCustomized = true;
      }
      if (input.status !== undefined) updateData.status = input.status;
      if (input.isCustomized !== undefined)
        updateData.isCustomized = input.isCustomized;

      await updateRepurposedContent(input.id, ctx.user.id, updateData);

      return { success: true };
    }),

  /**
   * Delete repurposed content
   */
  delete: protectedProcedure
    .input(
      z.object({
        id: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await getRepurposedContentById(input.id, ctx.user.id);
      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Repurposed content not found",
        });
      }

      await deleteRepurposedContent(input.id, ctx.user.id);
      return { success: true };
    }),

  /**
   * Regenerate content for a specific format
   */
  regenerate: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        postId: z.number(),
        siteId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await getRepurposedContentById(input.id, ctx.user.id);
      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Repurposed content not found",
        });
      }

      // Delete the old one and generate new
      await deleteRepurposedContent(input.id, ctx.user.id);

      // Regenerate using the generate procedure logic
      const post = await getPostById(input.postId, ctx.user.id);
      if (!post) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Post not found" });
      }

      const aiSettings = await getAiSettings(ctx.user.id);
      if (aiSettings && !aiSettings.enabled) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "AI features are disabled",
        });
      }

      const postContent = post.markdown || "";
      if (!postContent.trim()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Post content is empty",
        });
      }

      const userPrompt = getRepurposingPrompt(existing.format, postContent);

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content:
              aiSettings?.systemPrompt ||
              "You are an expert content strategist specializing in repurposing blog content for different platforms.",
          },
          { role: "user", content: userPrompt },
        ],
      });

      const generatedContent = response.choices[0]?.message?.content;
      if (!generatedContent || typeof generatedContent !== "string") {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to regenerate content",
        });
      }

      if (response.usage) {
        await incrementAiUsage(
          ctx.user.id,
          response.usage.prompt_tokens || 0,
          response.usage.completion_tokens || 0
        );
      }

      const metadata = getFormatMetadata(existing.format, generatedContent);

      const newContentId = await createRepurposedContent({
        userId: ctx.user.id,
        siteId: input.siteId,
        postId: input.postId,
        postTitle: post.title || "",
        postSlug: post.slug || "",
        format: existing.format,
        content: generatedContent,
        metadata,
        isCustomized: false,
        status: "generated",
      });

      return {
        id: newContentId,
        format: existing.format,
        content: generatedContent,
        metadata,
        isCustomized: false,
        status: "generated",
      };
    }),
});

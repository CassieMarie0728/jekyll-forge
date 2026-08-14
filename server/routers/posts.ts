import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import {
  getPostsBySiteId,
  getSiteById,
  getPostById,
  upsertPost,
  updatePost,
  deletePost,
  autosavePost,
  getFrontMatterTemplates,
} from "../db";

export const postsRouter = router({
  list: protectedProcedure
    .input(z.object({ siteId: z.number() }))
    .query(({ ctx, input }) => getPostsBySiteId(input.siteId, ctx.user.id)),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(({ ctx, input }) => getPostById(input.id, ctx.user.id)),

  upsert: protectedProcedure
    .input(
      z.object({
        siteId: z.number(),
        path: z.string(),
        filename: z.string().optional(),
        slug: z.string().optional(),
        title: z.string().optional(),
        status: z
          .enum([
            "draft",
            "published",
            "modified",
            "new",
            "scheduled",
            "archived",
          ])
          .optional(),
        frontMatter: z.record(z.string(), z.unknown()).optional(),
        markdown: z.string().optional(),
        sha: z.string().optional(),
        scheduledAt: z.date().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const site = await getSiteById(input.siteId, ctx.user.id);
      if (!site) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Site not found" });
      }
      return upsertPost({ ...input, userId: ctx.user.id });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string().optional(),
        slug: z.string().optional(),
        status: z
          .enum([
            "draft",
            "published",
            "modified",
            "new",
            "scheduled",
            "archived",
          ])
          .optional(),
        frontMatter: z.record(z.string(), z.unknown()).optional(),
        markdown: z.string().optional(),
        sha: z.string().optional(),
        scheduledAt: z.date().optional().nullable(),
      })
    )
    .mutation(({ ctx, input }) => {
      const { id, ...data } = input;
      return updatePost(id, ctx.user.id, data);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await getPostById(input.id, ctx.user.id);
      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Post not found" });
      }
      await deletePost(input.id, ctx.user.id);
      return { success: true };
    }),

  autosave: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        markdown: z.string(),
        frontMatter: z.record(z.string(), z.unknown()),
      })
    )
    .mutation(({ ctx, input }) =>
      autosavePost(input.id, ctx.user.id, input.markdown, input.frontMatter)
    ),

  getFrontMatterTemplates: protectedProcedure
    .input(z.object({ siteId: z.number().optional() }))
    .query(({ ctx, input }) =>
      getFrontMatterTemplates(ctx.user.id, input.siteId)
    ),
});

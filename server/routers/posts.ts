import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getPostsBySiteId, getPostById, upsertPost, updatePost, autosavePost, getFrontMatterTemplates } from "../db";

export const postsRouter = router({
  list: protectedProcedure
    .input(z.object({ siteId: z.number() }))
    .query(({ ctx, input }) => getPostsBySiteId(input.siteId, ctx.user.id)),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(({ ctx, input }) => getPostById(input.id, ctx.user.id)),

  upsert: protectedProcedure
    .input(z.object({
      siteId: z.number(), path: z.string(), filename: z.string().optional(),
      slug: z.string().optional(), title: z.string().optional(),
      status: z.enum(["draft", "published", "modified", "new", "scheduled", "archived"]).optional(),
      frontMatter: z.record(z.string(), z.unknown()).optional(), markdown: z.string().optional(),
      sha: z.string().optional(), scheduledAt: z.date().optional(),
    }))
    .mutation(({ ctx, input }) => upsertPost({ ...input, userId: ctx.user.id })),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().optional(), slug: z.string().optional(),
      status: z.enum(["draft", "published", "modified", "new", "scheduled", "archived"]).optional(),
      frontMatter: z.record(z.string(), z.unknown()).optional(), markdown: z.string().optional(),
      sha: z.string().optional(), scheduledAt: z.date().optional().nullable(),
    }))
    .mutation(({ ctx, input }) => {
      const { id, ...data } = input;
      return updatePost(id, ctx.user.id, data);
    }),

  autosave: protectedProcedure
    .input(z.object({ id: z.number(), markdown: z.string(), frontMatter: z.record(z.string(), z.unknown()) }))
    .mutation(({ ctx, input }) => autosavePost(input.id, ctx.user.id, input.markdown, input.frontMatter)),

  getFrontMatterTemplates: protectedProcedure
    .input(z.object({ siteId: z.number().optional() }))
    .query(({ ctx, input }) => getFrontMatterTemplates(ctx.user.id, input.siteId)),
});

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  createSnapshot,
  getSnapshotsByPost,
  getSnapshotById,
  getSiteById,
  getPostById,
} from "../db";
import { TRPCError } from "@trpc/server";

export const snapshotsRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        siteId: z.number(),
        postId: z.number().optional(),
        postPath: z.string().optional(),
        label: z.string(),
        reason: z
          .enum([
            "manual",
            "autosave",
            "before-ai",
            "before-publish",
            "before-theme",
            "before-plugin",
          ])
          .default("manual"),
        markdown: z.string().optional(),
        frontMatter: z.record(z.string(), z.unknown()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const site = await getSiteById(input.siteId, ctx.user.id);
      if (!site) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Site not found" });
      }

      if (input.postId !== undefined) {
        const post = await getPostById(input.postId, ctx.user.id);
        if (!post || post.siteId !== site.id) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Post not found" });
        }
      }

      return createSnapshot({ ...input, userId: ctx.user.id });
    }),

  listByPost: protectedProcedure
    .input(z.object({ postPath: z.string(), siteId: z.number() }))
    .query(({ ctx, input }) =>
      getSnapshotsByPost(input.postPath, input.siteId, ctx.user.id)
    ),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(({ ctx, input }) => getSnapshotById(input.id, ctx.user.id)),
});

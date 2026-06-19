import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { createSnapshot, getSnapshotsByPost, getSnapshotById } from "../db";

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
    .mutation(({ ctx, input }) =>
      createSnapshot({ ...input, userId: ctx.user.id })
    ),

  listByPost: protectedProcedure
    .input(z.object({ postPath: z.string(), siteId: z.number() }))
    .query(({ ctx, input }) =>
      getSnapshotsByPost(input.postPath, input.siteId, ctx.user.id)
    ),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(({ ctx, input }) => getSnapshotById(input.id, ctx.user.id)),
});

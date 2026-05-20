import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { createScheduledPost, getScheduledPostsBySite, updateScheduledPost, getPendingScheduledPosts } from "../db";
import { notifyOwner } from "../_core/notification";

export const schedulerRouter = router({
  list: protectedProcedure
    .input(z.object({ siteId: z.number() }))
    .query(({ ctx, input }) => getScheduledPostsBySite(input.siteId, ctx.user.id)),

  schedule: protectedProcedure
    .input(z.object({
      siteId: z.number(), postId: z.number().optional(),
      draftPath: z.string(), targetPath: z.string(),
      scheduledAt: z.date(), timezone: z.string().default("UTC"),
      commitMessage: z.string().optional(),
    }))
    .mutation(({ ctx, input }) => createScheduledPost({ ...input, userId: ctx.user.id })),

  cancel: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ ctx, input }) => updateScheduledPost(input.id, { status: "cancelled" })),

  // Called by heartbeat/cron
  processPending: protectedProcedure.mutation(async ({ ctx }) => {
    const pending = await getPendingScheduledPosts(new Date());
    const results = [];

    for (const job of pending) {
      try {
        await updateScheduledPost(job.id, { status: "processing" });
        // The actual GitHub commit is done client-side via the github router
        // Here we just mark as ready and notify
        results.push({ id: job.id, status: "ready", draftPath: job.draftPath, targetPath: job.targetPath, siteId: job.siteId, userId: job.userId });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        await updateScheduledPost(job.id, { status: "failed", errorMessage: msg });
        await notifyOwner({ title: "Jekyll Forge: Scheduled publish failed", content: `Failed to process scheduled post: ${job.draftPath}\nError: ${msg}` });
      }
    }

    return results;
  }),

  markPublished: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ ctx, input }) => updateScheduledPost(input.id, { status: "published", publishedAt: new Date() })),

  markFailed: protectedProcedure
    .input(z.object({ id: z.number(), errorMessage: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await updateScheduledPost(input.id, { status: "failed", errorMessage: input.errorMessage });
      await notifyOwner({ title: "Jekyll Forge: Scheduled publish failed", content: `Scheduled post failed to publish.\nError: ${input.errorMessage}` });
    }),
});

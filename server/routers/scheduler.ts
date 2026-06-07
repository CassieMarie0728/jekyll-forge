import { z } from "zod";
import { parse as parseCookie } from "cookie";
import { COOKIE_NAME } from "@shared/const";
import { protectedProcedure, router } from "../_core/trpc";
import { createHeartbeatJob, deleteHeartbeatJob, listHeartbeatJobs } from "../_core/heartbeat";
import {
  createScheduledPost,
  getScheduledPostsBySite,
  getScheduledPostById,
  updateScheduledPost,
} from "../db";
import { notifyOwner } from "../_core/notification";

/**
 * Convert a UTC Date to a 6-field cron expression that fires once at that time.
 * Format: "sec min hour dom mon dow"
 * The handler is idempotent — once published, subsequent triggers are no-ops.
 */
function dateToCron(date: Date): string {
  const sec = date.getUTCSeconds();
  const min = date.getUTCMinutes();
  const hour = date.getUTCHours();
  const dom = date.getUTCDate();
  const mon = date.getUTCMonth() + 1; // 1-12
  return `${sec} ${min} ${hour} ${dom} ${mon} *`;
}

export const schedulerRouter = router({
  /**
   * List all scheduled posts for a site.
   */
  list: protectedProcedure
    .input(z.object({ siteId: z.number() }))
    .query(({ ctx, input }) => getScheduledPostsBySite(input.siteId, ctx.user.id)),

  /**
   * Schedule a post for future publishing.
   * Creates a heartbeat cron job and persists the taskUid on the row.
   * NOTE: Heartbeat jobs require the site to be deployed first.
   * In dev mode, we still create the DB row but skip the heartbeat creation.
   */
  schedule: protectedProcedure
    .input(z.object({
      siteId: z.number(),
      postId: z.number().optional(),
      draftPath: z.string(),
      targetPath: z.string(),
      scheduledAt: z.date(),
      timezone: z.string().default("UTC"),
      commitMessage: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Create the DB row first
      const id = await createScheduledPost({
        userId: ctx.user.id,
        siteId: input.siteId,
        postId: input.postId,
        draftPath: input.draftPath,
        targetPath: input.targetPath,
        scheduledAt: input.scheduledAt,
        timezone: input.timezone,
        commitMessage: input.commitMessage,
        status: "pending",
      });

      // Attempt to create the heartbeat job
      // This will fail in dev (sandbox not deployed) — we catch and log
      try {
        const sessionToken = parseCookie(ctx.req.headers.cookie ?? "")[COOKIE_NAME] ?? "";
        const cron = dateToCron(input.scheduledAt);
        const filename = input.targetPath.split("/").pop() || input.targetPath;

        const job = await createHeartbeatJob({
          name: `jekyll-publish-${id}`,
          cron,
          path: "/api/scheduled/publish-post",
          payload: { scheduledPostId: id },
          description: `Scheduled publish: ${filename} at ${input.scheduledAt.toISOString()}`,
        }, sessionToken);

        // Persist the taskUid so the handler can look up by it
        await updateScheduledPost(id, { scheduleCronTaskUid: job.taskUid });

        return { id, taskUid: job.taskUid, nextExecutionAt: job.nextExecutionAt };
      } catch (err) {
        // In dev or if heartbeat fails, the DB row exists but no cron is registered.
        console.warn("[Scheduler] Could not create heartbeat job (site may not be deployed):", err instanceof Error ? err.message : err);
        return { id, taskUid: null, warning: "Heartbeat job not created — deploy the site first to activate scheduling." };
      }
    }),

  /**
   * Cancel a scheduled post.
   * Deletes the heartbeat job and marks the row as cancelled.
   */
  cancel: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      // Fetch the specific row by ID and userId (safe, no siteId=0 bug)
      const row = await getScheduledPostById(input.id, ctx.user.id);
      if (!row) {
        return { success: false, error: "Scheduled post not found" };
      }

      // Delete the heartbeat job if we have a taskUid
      if (row.scheduleCronTaskUid) {
        try {
          const sessionToken = parseCookie(ctx.req.headers.cookie ?? "")[COOKIE_NAME] ?? "";
          await deleteHeartbeatJob(row.scheduleCronTaskUid, sessionToken);
        } catch (err) {
          console.warn("[Scheduler] Could not delete heartbeat job:", err instanceof Error ? err.message : err);
        }
      }

      await updateScheduledPost(input.id, { status: "cancelled" });
      return { success: true };
    }),

  /**
   * Cancel all scheduled posts for a site.
   */
  cancelAll: protectedProcedure
    .input(z.object({ siteId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const jobs = await getScheduledPostsBySite(input.siteId, ctx.user.id);
      const sessionToken = parseCookie(ctx.req.headers.cookie ?? "")[COOKIE_NAME] ?? "";

      let cancelled = 0;
      for (const job of jobs) {
        if (job.status !== "pending") continue;
        if (job.scheduleCronTaskUid) {
          try {
            await deleteHeartbeatJob(job.scheduleCronTaskUid, sessionToken);
          } catch { /* ignore */ }
        }
        await updateScheduledPost(job.id, { status: "cancelled" });
        cancelled++;
      }
      return { cancelled };
    }),

  /**
   * List heartbeat jobs for the current user (from the platform).
   * Useful for debugging and admin view.
   */
  listHeartbeatJobs: protectedProcedure
    .input(z.object({ page: z.number().default(1), pageSize: z.number().default(20) }))
    .query(async ({ ctx, input }) => {
      try {
        const sessionToken = parseCookie(ctx.req.headers.cookie ?? "")[COOKIE_NAME] ?? "";
        return await listHeartbeatJobs(sessionToken, { page: input.page, pageSize: input.pageSize });
      } catch {
        // Not deployed yet or no jobs
        return { total: 0, actorUserId: "", jobs: [] };
      }
    }),

  /**
   * Manually mark a scheduled post as published (for testing/recovery).
   */
  markPublished: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => updateScheduledPost(input.id, { status: "published", publishedAt: new Date() })),

  /**
   * Manually mark a scheduled post as failed with an error message.
   */
  markFailed: protectedProcedure
    .input(z.object({ id: z.number(), errorMessage: z.string() }))
    .mutation(async ({ input }) => {
      await updateScheduledPost(input.id, { status: "failed", errorMessage: input.errorMessage });
      await notifyOwner({
        title: "Jekyll Forge: Scheduled publish failed",
        content: `Scheduled post failed to publish.\nError: ${input.errorMessage}`,
      });
    }),
});

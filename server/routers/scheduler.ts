import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";
import { scheduledPosts } from "../../drizzle/schema";
import { and, eq } from "drizzle-orm";

function future(date: Date) {
  if (date.getTime() <= Date.now())
    throw new Error("Scheduled publish time must be in the future");
}
async function owned(id: number, userId: number) {
  const row = await db.getScheduledPostById(id, userId);
  if (!row) throw new Error("Scheduled post not found");
  return row;
}
function path(value: string) {
  const result = value.replace(/^\/+/, "");
  if (
    !result ||
    result.split("/").some(part => part === ".." || part === "." || !part) ||
    /[\\?#\x00-\x1f]/.test(result)
  ) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Invalid repository path",
    });
  }
  return result;
}
export const schedulerRouter = router({
  list: protectedProcedure
    .input(z.object({ siteId: z.number() }))
    .query(({ ctx, input }) =>
      db.getScheduledPostsBySite(input.siteId, ctx.user.id)
    ),
  schedule: protectedProcedure
    .input(
      z.object({
        siteId: z.number(),
        postId: z.number().optional(),
        draftPath: z.string(),
        targetPath: z.string(),
        scheduledAt: z.date(),
        timezone: z.string().default("UTC"),
        commitMessage: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const site = await db.getSiteById(input.siteId, ctx.user.id);
      if (!site) throw new Error("Site not found");
      if (input.postId !== undefined) {
        const post = await db.getPostById(input.postId, ctx.user.id);
        if (!post || post.siteId !== site.id) throw new Error("Post not found");
      }
      future(input.scheduledAt);
      const draftPath = path(input.draftPath),
        targetPath = path(input.targetPath);
      if (draftPath === targetPath)
        throw new Error("Draft and target paths must differ");
      const id = await db.createScheduledPost({
        ...input,
        draftPath,
        targetPath,
        userId: ctx.user.id,
        branch: site.selectedBranch || site.defaultBranch || "main",
        status: "pending",
      });
      return {
        id,
        taskUid: `d1:${id}`,
        nextExecutionAt: input.scheduledAt.toISOString(),
      };
    }),
  cancel: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await owned(input.id, ctx.user.id);
      const database = await db.getDb();
      const changed = await database
        .update(scheduledPosts)
        .set({ status: "cancelled" })
        .where(
          and(
            eq(scheduledPosts.id, input.id),
            eq(scheduledPosts.userId, ctx.user.id),
            eq(scheduledPosts.status, "pending")
          )
        )
        .returning({ id: scheduledPosts.id });
      if (!changed.length)
        throw new Error("Only pending scheduled posts can be cancelled");
      return { success: true };
    }),
  reschedule: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        scheduledAt: z.date(),
        timezone: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await owned(input.id, ctx.user.id);
      future(input.scheduledAt);
      const database = await db.getDb();
      const changed = await database
        .update(scheduledPosts)
        .set({
          scheduledAt: input.scheduledAt,
          ...(input.timezone ? { timezone: input.timezone } : {}),
          errorMessage: null,
        })
        .where(
          and(
            eq(scheduledPosts.id, input.id),
            eq(scheduledPosts.userId, ctx.user.id),
            eq(scheduledPosts.status, "pending")
          )
        )
        .returning({ id: scheduledPosts.id });
      if (!changed.length)
        throw new Error("Only pending scheduled posts can be rescheduled");
      return {
        success: true,
        taskUid: `d1:${input.id}`,
        nextExecutionAt: input.scheduledAt.toISOString(),
      };
    }),
  cancelAll: protectedProcedure
    .input(z.object({ siteId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const database = await db.getDb();
      const rows = await database
        .update(scheduledPosts)
        .set({ status: "cancelled" })
        .where(
          and(
            eq(scheduledPosts.siteId, input.siteId),
            eq(scheduledPosts.userId, ctx.user.id),
            eq(scheduledPosts.status, "pending")
          )
        )
        .returning({ id: scheduledPosts.id });
      return { cancelled: rows.length };
    }),
  // Retain the wire name for the existing native client; this is a database queue.
  listHeartbeatJobs: protectedProcedure
    .input(
      z.object({
        page: z.number().default(1),
        pageSize: z.number().default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const database = await db.getDb();
      const rows = await database
        .select()
        .from(scheduledPosts)
        .where(
          and(
            eq(scheduledPosts.userId, ctx.user.id),
            eq(scheduledPosts.status, "pending")
          )
        );
      return {
        total: rows.length,
        actorUserId: String(ctx.user.id),
        jobs: rows
          .slice((input.page - 1) * input.pageSize, input.page * input.pageSize)
          .map(row => ({
            taskUid: `d1:${row.id}`,
            name: row.targetPath,
            isEnable: true,
            nextExecutionAt: row.scheduledAt.toISOString(),
          })),
      };
    }),
  markPublished: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await owned(input.id, ctx.user.id);
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message:
          "A schedule is marked published only after GitHub confirms the commit.",
      });
    }),
  markFailed: protectedProcedure
    .input(z.object({ id: z.number(), errorMessage: z.string().max(2000) }))
    .mutation(async ({ ctx, input }) => {
      await owned(input.id, ctx.user.id);
      const database = await db.getDb();
      const changed = await database
        .update(scheduledPosts)
        .set({ status: "failed", errorMessage: input.errorMessage })
        .where(
          and(
            eq(scheduledPosts.id, input.id),
            eq(scheduledPosts.userId, ctx.user.id),
            eq(scheduledPosts.status, "pending")
          )
        )
        .returning({ id: scheduledPosts.id });
      if (!changed.length)
        throw new Error("Only pending scheduled posts can be marked failed");
      return { success: true };
    }),
});

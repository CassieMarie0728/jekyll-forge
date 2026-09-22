import { and, eq, lte } from "drizzle-orm";
import { getDb, getSiteById, updateScheduledPost } from "./db";
import { scheduledPosts, users } from "../drizzle/schema";
import { notifyOwner } from "./_core/notification";

async function github(token: string, endpoint: string, init: RequestInit = {}) {
  const response = await fetch("https://api.github.com" + endpoint, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "User-Agent": "Jekyll-Forge",
      ...init.headers,
    },
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok)
    throw new Error(
      `GitHub returned ${response.status}; verify access, branch and file SHA`
    );
  return response.json() as Promise<{ content?: string; sha?: string }>;
}
const encodePath = (path: string) =>
  path.split("/").map(encodeURIComponent).join("/");

export async function processScheduledPosts() {
  const database = await getDb();
  const due = await database
    .select()
    .from(scheduledPosts)
    .where(
      and(
        eq(scheduledPosts.status, "pending"),
        lte(scheduledPosts.scheduledAt, new Date())
      )
    )
    .limit(2);
  for (const job of due) {
    const claimed = await database
      .update(scheduledPosts)
      .set({ status: "processing" })
      .where(
        and(eq(scheduledPosts.id, job.id), eq(scheduledPosts.status, "pending"))
      )
      .returning({ id: scheduledPosts.id });
    if (!claimed.length) continue;
    try {
      const site = await getSiteById(job.siteId, job.userId);
      const [user] = await database
        .select()
        .from(users)
        .where(eq(users.id, job.userId))
        .limit(1);
      if (!site || !user?.githubToken)
        throw new Error("Site or connected GitHub account missing");
      const branch =
        job.branch || site.selectedBranch || site.defaultBranch || "main";
      const base = `/repos/${encodeURIComponent(site.owner)}/${encodeURIComponent(site.repo)}/contents/`;
      const draft = await github(
        user.githubToken,
        base + encodePath(job.draftPath) + "?ref=" + encodeURIComponent(branch)
      );
      if (!draft.content || !draft.sha)
        throw new Error("Draft content unavailable");
      // Do not overwrite an existing published path. GitHub rejects an update
      // without its existing SHA, making this creation-only.
      await github(user.githubToken, base + encodePath(job.targetPath), {
        method: "PUT",
        body: JSON.stringify({
          branch,
          content: draft.content.replace(/\s/g, ""),
          message: job.commitMessage || `Publish ${job.targetPath}`,
        }),
      });
      await updateScheduledPost(job.id, {
        status: "published",
        publishedAt: new Date(),
        errorMessage: null,
      });
      try {
        await github(user.githubToken, base + encodePath(job.draftPath), {
          method: "DELETE",
          body: JSON.stringify({
            branch,
            sha: draft.sha,
            message: `Remove published draft ${job.draftPath}`,
          }),
        });
      } catch {
        await updateScheduledPost(job.id, {
          errorMessage:
            "Published successfully; original draft remains in GitHub.",
        });
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Scheduled publishing failed";
      await updateScheduledPost(job.id, {
        status: "failed",
        errorMessage: message,
      });
      await notifyOwner({
        title: "Scheduled publishing needs attention",
        content: `Schedule ${job.id}: ${message}`,
      });
    }
  }
  // A interrupted claim is never replayed blindly: the remote commit may have
  // succeeded. Surface it for reconciliation to prevent duplicate side effects.
  await database
    .update(scheduledPosts)
    .set({
      status: "failed",
      errorMessage:
        "Publishing was interrupted. Check GitHub before scheduling again.",
    })
    .where(
      and(
        eq(scheduledPosts.status, "processing"),
        lte(scheduledPosts.updatedAt, new Date(Date.now() - 15 * 60000))
      )
    );
}

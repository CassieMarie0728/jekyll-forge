/**
 * Heartbeat handler for scheduled Jekyll post publishing.
 * Mounted at POST /api/scheduled/publish-post in server/_core/index.ts
 *
 * Per periodic-updates.md §3:
 * - Authenticates via sdk.authenticateRequest (isCron=true, taskUid set)
 * - Looks up the scheduled post by taskUid (NOT by req.body)
 * - Performs the GitHub commit to move _drafts → _posts
 * - Notifies owner on failure
 * - Returns 2xx always (even on business failures) to prevent unnecessary retries
 */

import type { Request, Response } from "express";
import { sdk } from "./_core/sdk";
import { notifyOwner } from "./_core/notification";
import {
  getScheduledPostByTaskUid,
  updateScheduledPost,
  getSiteByIdAny,
  getUserByOpenId,
} from "./db";

const GITHUB_API = "https://api.github.com";

async function ghFetch(token: string, path: string, options: RequestInit = {}) {
  const res = await fetch(`${GITHUB_API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(`GitHub API error ${res.status}: ${(body as { message?: string }).message || "unknown"}`);
  }
  return res.json();
}

export async function scheduledPublishHandler(req: Request, res: Response) {
  const startedAt = new Date().toISOString();

  try {
    // 1. Authenticate — must be a cron request
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron || !user.taskUid) {
      return res.status(403).json({ error: "cron-only endpoint" });
    }

    const taskUid = user.taskUid;

    // 2. Look up the scheduled post by taskUid (never by req.body)
    const job = await getScheduledPostByTaskUid(taskUid);
    if (!job) {
      // Orphan — cron was created but the row was deleted. Return 2xx to stop retries.
      return res.json({ ok: true, skipped: "orphan", taskUid });
    }

    // 3. Skip if already processed
    if (job.status !== "pending") {
      return res.json({ ok: true, skipped: `already-${job.status}`, id: job.id });
    }

    // 4. Mark as processing
    await updateScheduledPost(job.id, { status: "processing" });

    // 5. Load the site to get owner/repo/branch
    const site = await getSiteByIdAny(job.siteId);
    if (!site) {
      const msg = `Site ${job.siteId} not found`;
      await updateScheduledPost(job.id, { status: "failed", errorMessage: msg });
      await notifyOwner({
        title: "Jekyll Forge: Scheduled publish failed",
        content: `Could not find site for scheduled post.\nJob ID: ${job.id}\nDraft: ${job.draftPath}\nError: ${msg}`,
      });
      return res.json({ ok: true, failed: true, error: msg });
    }

    // 6. Load the site owner's GitHub token
    // The site's userId is the owner
    const siteOwner = await (async () => {
      // We need to find the user by their DB id, not openId
      // Use a direct DB query via drizzle
      const { getDb } = await import("./db");
      const { users } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const db = await getDb();
      if (!db) return undefined;
      const result = await db.select().from(users).where(eq(users.id, site.userId)).limit(1);
      return result[0];
    })();

    if (!siteOwner?.githubToken) {
      const msg = "Site owner has no GitHub token connected";
      await updateScheduledPost(job.id, { status: "failed", errorMessage: msg });
      await notifyOwner({
        title: "Jekyll Forge: Scheduled publish failed",
        content: `${msg}\nJob ID: ${job.id}\nDraft: ${job.draftPath}`,
      });
      return res.json({ ok: true, failed: true, error: msg });
    }

    const branch = site.selectedBranch || site.defaultBranch || "main";

    // 7. Fetch the draft file from GitHub
    const draftPath = job.draftPath.startsWith("/") ? job.draftPath.slice(1) : job.draftPath;
    const targetPath = job.targetPath.startsWith("/") ? job.targetPath.slice(1) : job.targetPath;

    let draftFile: { content: string; sha: string };
    try {
      draftFile = await ghFetch(
        siteOwner.githubToken,
        `/repos/${site.owner}/${site.repo}/contents/${draftPath}?ref=${branch}`
      );
    } catch (err) {
      const msg = `Failed to fetch draft: ${err instanceof Error ? err.message : String(err)}`;
      await updateScheduledPost(job.id, { status: "failed", errorMessage: msg });
      await notifyOwner({
        title: "Jekyll Forge: Scheduled publish failed",
        content: `${msg}\nJob ID: ${job.id}\nDraft: ${job.draftPath}`,
      });
      return res.json({ ok: true, failed: true, error: msg });
    }

    const draftContent = Buffer.from(draftFile.content, "base64").toString("utf-8");

    // 8. Commit to _posts (target path)
    const commitMessage = job.commitMessage || `Publish: ${targetPath.split("/").pop() || targetPath}`;
    try {
      await ghFetch(
        siteOwner.githubToken,
        `/repos/${site.owner}/${site.repo}/contents/${targetPath}`,
        {
          method: "PUT",
          body: JSON.stringify({
            message: commitMessage,
            content: Buffer.from(draftContent).toString("base64"),
            branch,
          }),
        }
      );
    } catch (err) {
      const msg = `Failed to commit to _posts: ${err instanceof Error ? err.message : String(err)}`;
      await updateScheduledPost(job.id, { status: "failed", errorMessage: msg });
      await notifyOwner({
        title: "Jekyll Forge: Scheduled publish failed",
        content: `${msg}\nJob ID: ${job.id}\nTarget: ${job.targetPath}`,
      });
      return res.json({ ok: true, failed: true, error: msg });
    }

    // 9. Delete the draft from _drafts
    try {
      await ghFetch(
        siteOwner.githubToken,
        `/repos/${site.owner}/${site.repo}/contents/${draftPath}`,
        {
          method: "DELETE",
          body: JSON.stringify({
            message: `Remove draft after publish: ${draftPath.split("/").pop()}`,
            sha: draftFile.sha,
            branch,
          }),
        }
      );
    } catch {
      // Non-fatal: the post is published, draft deletion failure is logged but not a hard error
      console.warn(`[Scheduler] Could not delete draft ${draftPath} after publish`);
    }

    // 10. Mark as published
    await updateScheduledPost(job.id, { status: "published", publishedAt: new Date() });

    return res.json({
      ok: true,
      published: true,
      id: job.id,
      draftPath: job.draftPath,
      targetPath: job.targetPath,
      publishedAt: new Date().toISOString(),
    });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("[Scheduler] Unhandled error in publish handler:", err);

    // Attempt to notify owner even on unexpected errors
    try {
      await notifyOwner({
        title: "Jekyll Forge: Scheduled publish error",
        content: `Unexpected error in scheduled publish handler.\nError: ${errorMsg}\nTimestamp: ${startedAt}`,
      });
    } catch { /* ignore notification failure */ }

    // Return 500 with structured error for platform Investigate flow
    return res.status(500).json({
      error: errorMsg,
      stack: err instanceof Error ? err.stack : undefined,
      context: { url: req.url, taskUid: "unknown" },
      timestamp: startedAt,
    });
  }
}

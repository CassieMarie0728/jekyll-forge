import { eq, and, desc, asc, lt, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users,
  sites, InsertSite, Site,
  posts, InsertPost, Post,
  snapshots, InsertSnapshot,
  assets, InsertAsset,
  aiSettings, InsertAiSetting,
  aiVoiceProfiles,
  aiPromptTemplates,
  scheduledPosts, InsertScheduledPost,
  reusableBlocks, InsertReusableBlock,
  frontMatterTemplates,
  repurposedContent, InsertRepurposedContent, RepurposedContent,
  socialMediaAccounts, InsertSocialMediaAccount, SocialMediaAccount,
  contentAnalytics, InsertContentAnalytics, ContentAnalytics,
} from "../drizzle/schema";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Repurposed Content ───────────────────────────────────────────────────────
export async function createRepurposedContent(data: InsertRepurposedContent): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(repurposedContent).values(data);
  return result[0].insertId as number;
}

export async function getRepurposedContentByPostId(postId: number, userId: number): Promise<RepurposedContent[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select()
    .from(repurposedContent)
    .where(and(eq(repurposedContent.postId, postId), eq(repurposedContent.userId, userId)))
    .orderBy(desc(repurposedContent.createdAt));
}

export async function getRepurposedContentById(id: number, userId: number): Promise<RepurposedContent | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select()
    .from(repurposedContent)
    .where(and(eq(repurposedContent.id, id), eq(repurposedContent.userId, userId)))
    .limit(1);
  return result[0];
}

export async function updateRepurposedContent(id: number, userId: number, data: Partial<RepurposedContent>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(repurposedContent)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(repurposedContent.id, id), eq(repurposedContent.userId, userId)));
}

export async function deleteRepurposedContent(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(repurposedContent)
    .where(and(eq(repurposedContent.id, id), eq(repurposedContent.userId, userId)));
}

// ─── Users ────────────────────────────────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};

  const fields = ["name", "email", "loginMethod", "githubToken", "githubLogin", "githubAvatarUrl", "githubId"] as const;
  for (const field of fields) {
    const v = user[field as keyof InsertUser];
    if (v !== undefined) {
      (values as Record<string, unknown>)[field] = v ?? null;
      updateSet[field] = v ?? null;
    }
  }

  values.lastSignedIn = user.lastSignedIn ?? new Date();
  updateSet.lastSignedIn = values.lastSignedIn;

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

// ─── Sites ────────────────────────────────────────────────────────────────────
export async function getSitesByUserId(userId: number): Promise<Site[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(sites).where(eq(sites.userId, userId)).orderBy(desc(sites.lastAccessedAt));
}

export async function getSiteById(id: number, userId: number): Promise<Site | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(sites).where(and(eq(sites.id, id), eq(sites.userId, userId))).limit(1);
  return result[0];
}

export async function upsertSite(data: InsertSite): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const existing = await db.select({ id: sites.id })
    .from(sites)
    .where(and(eq(sites.userId, data.userId), eq(sites.owner, data.owner), eq(sites.repo, data.repo)))
    .limit(1);
  if (existing[0]) {
    await db.update(sites).set({ ...data, lastAccessedAt: new Date() }).where(eq(sites.id, existing[0].id));
    return existing[0].id;
  }
  const result = await db.insert(sites).values({ ...data, lastAccessedAt: new Date() });
  return Number((result as unknown as { insertId: number }).insertId);
}

export async function updateSite(id: number, userId: number, data: Partial<InsertSite>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(sites).set(data).where(and(eq(sites.id, id), eq(sites.userId, userId)));
}

export async function deleteSite(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(sites).where(and(eq(sites.id, id), eq(sites.userId, userId)));
}

// For cron handlers that don't have a userId context
export async function getSiteByIdAny(id: number): Promise<Site | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(sites).where(eq(sites.id, id)).limit(1);
  return result[0];
}

// ─── Posts ────────────────────────────────────────────────────────────────────
export async function getPostsBySiteId(siteId: number, userId: number): Promise<Post[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(posts).where(and(eq(posts.siteId, siteId), eq(posts.userId, userId))).orderBy(desc(posts.updatedAt));
}

export async function getPostById(id: number, userId: number): Promise<Post | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(posts).where(and(eq(posts.id, id), eq(posts.userId, userId))).limit(1);
  return result[0];
}

export async function upsertPost(data: InsertPost): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const existing = await db.select({ id: posts.id })
    .from(posts)
    .where(and(eq(posts.userId, data.userId), eq(posts.siteId, data.siteId), eq(posts.path, data.path)))
    .limit(1);
  if (existing[0]) {
    await db.update(posts).set(data).where(eq(posts.id, existing[0].id));
    return existing[0].id;
  }
  const result = await db.insert(posts).values(data);
  return Number((result as unknown as { insertId: number }).insertId);
}

export async function updatePost(id: number, userId: number, data: Partial<InsertPost>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(posts).set(data).where(and(eq(posts.id, id), eq(posts.userId, userId)));
}

export async function autosavePost(id: number, userId: number, markdown: string, frontMatter: Record<string, unknown>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(posts).set({ autosaveContent: markdown, autosaveFrontMatter: frontMatter, lastAutosaveAt: new Date() })
    .where(and(eq(posts.id, id), eq(posts.userId, userId)));
}

// ─── Snapshots ────────────────────────────────────────────────────────────────
export async function createSnapshot(data: InsertSnapshot): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(snapshots).values(data);
  return Number((result as unknown as { insertId: number }).insertId);
}

export async function getSnapshotsByPost(postPath: string, siteId: number, userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(snapshots)
    .where(and(eq(snapshots.postPath, postPath), eq(snapshots.siteId, siteId), eq(snapshots.userId, userId)))
    .orderBy(desc(snapshots.createdAt))
    .limit(50);
}

export async function getSnapshotById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(snapshots).where(and(eq(snapshots.id, id), eq(snapshots.userId, userId))).limit(1);
  return result[0];
}

// ─── Assets ───────────────────────────────────────────────────────────────────
export async function getAssetsBySiteId(siteId: number, userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(assets).where(and(eq(assets.siteId, siteId), eq(assets.userId, userId))).orderBy(desc(assets.createdAt));
}

export async function createAsset(data: InsertAsset): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(assets).values(data);
  return Number((result as unknown as { insertId: number }).insertId);
}

export async function updateAsset(id: number, userId: number, data: Partial<InsertAsset>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(assets).set(data).where(and(eq(assets.id, id), eq(assets.userId, userId)));
}

export async function deleteAsset(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(assets).where(and(eq(assets.id, id), eq(assets.userId, userId)));
}

export async function findAssetByHash(hash: string, siteId: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(assets)
    .where(and(eq(assets.hash, hash), eq(assets.siteId, siteId), eq(assets.userId, userId))).limit(1);
  return result[0];
}

// ─── AI Settings ─────────────────────────────────────────────────────────────
export async function getAiSettings(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(aiSettings).where(eq(aiSettings.userId, userId)).limit(1);
  return result[0];
}

export async function upsertAiSettings(data: InsertAiSetting): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const { userId, ...rest } = data;
  await db.insert(aiSettings).values(data).onDuplicateKeyUpdate({ set: rest });
}

export async function incrementAiUsage(userId: number, inputTokens: number, outputTokens: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const current = await getAiSettings(userId);
  if (!current) return;
  await db.update(aiSettings).set({
    totalRequestCount: (current.totalRequestCount ?? 0) + 1,
    totalInputTokens: (current.totalInputTokens ?? 0) + inputTokens,
    totalOutputTokens: (current.totalOutputTokens ?? 0) + outputTokens,
  }).where(eq(aiSettings.userId, userId));
}

// ─── AI Voice Profiles ────────────────────────────────────────────────────────
export async function getVoiceProfiles(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(aiVoiceProfiles).where(eq(aiVoiceProfiles.userId, userId)).orderBy(asc(aiVoiceProfiles.name));
}

// ─── AI Prompt Templates ──────────────────────────────────────────────────────
export async function getPromptTemplates(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(aiPromptTemplates).where(eq(aiPromptTemplates.userId, userId)).orderBy(asc(aiPromptTemplates.name));
}

// ─── Scheduled Posts ─────────────────────────────────────────────────────────
export async function getPendingScheduledPosts(before: Date) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(scheduledPosts)
    .where(and(eq(scheduledPosts.status, "pending"), lt(scheduledPosts.scheduledAt, before)));
}

export async function createScheduledPost(data: InsertScheduledPost): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(scheduledPosts).values(data);
  return Number((result as unknown as { insertId: number }).insertId);
}

export async function updateScheduledPost(id: number, data: Partial<InsertScheduledPost>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(scheduledPosts).set(data).where(eq(scheduledPosts.id, id));
}

export async function getScheduledPostsBySite(siteId: number, userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(scheduledPosts)
    .where(and(eq(scheduledPosts.siteId, siteId), eq(scheduledPosts.userId, userId)))
    .orderBy(asc(scheduledPosts.scheduledAt));
}

// ─── Reusable Blocks ─────────────────────────────────────────────────────────
export async function getReusableBlocks(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(reusableBlocks).where(eq(reusableBlocks.userId, userId)).orderBy(asc(reusableBlocks.name));
}

export async function createReusableBlock(data: InsertReusableBlock): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(reusableBlocks).values(data);
  return Number((result as unknown as { insertId: number }).insertId);
}

export async function updateReusableBlock(id: number, userId: number, data: Partial<InsertReusableBlock>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(reusableBlocks).set(data).where(and(eq(reusableBlocks.id, id), eq(reusableBlocks.userId, userId)));
}

export async function deleteReusableBlock(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(reusableBlocks).where(and(eq(reusableBlocks.id, id), eq(reusableBlocks.userId, userId)));
}

export async function getScheduledPostById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(scheduledPosts)
    .where(and(eq(scheduledPosts.id, id), eq(scheduledPosts.userId, userId))).limit(1);
  return result[0];
}

export async function getScheduledPostByTaskUid(taskUid: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(scheduledPosts)
    .where(eq(scheduledPosts.scheduleCronTaskUid, taskUid)).limit(1);
  return result[0];
}

// ─── Front Matter Templates ───────────────────────────────────────────────────
export async function getFrontMatterTemplates(userId: number, siteId?: number) {
  const db = await getDb();
  if (!db) return [];
  const conditions = siteId
    ? and(eq(frontMatterTemplates.userId, userId), eq(frontMatterTemplates.siteId, siteId))
    : eq(frontMatterTemplates.userId, userId);
  return db.select().from(frontMatterTemplates).where(conditions).orderBy(asc(frontMatterTemplates.name));
}


// ─── Social Media Accounts ────────────────────────────────────────────────────
export async function createSocialMediaAccount(data: InsertSocialMediaAccount): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(socialMediaAccounts).values(data);
  return result[0].insertId as number;
}

export async function getSocialMediaAccountsByUserId(userId: number): Promise<SocialMediaAccount[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select()
    .from(socialMediaAccounts)
    .where(eq(socialMediaAccounts.userId, userId))
    .orderBy(desc(socialMediaAccounts.createdAt));
}

export async function getSocialMediaAccount(id: number, userId: number): Promise<SocialMediaAccount | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select()
    .from(socialMediaAccounts)
    .where(and(eq(socialMediaAccounts.id, id), eq(socialMediaAccounts.userId, userId)))
    .limit(1);
  return result[0];
}

export async function updateSocialMediaAccount(id: number, userId: number, data: Partial<SocialMediaAccount>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(socialMediaAccounts)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(socialMediaAccounts.id, id), eq(socialMediaAccounts.userId, userId)));
}

export async function deleteSocialMediaAccount(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(socialMediaAccounts)
    .where(and(eq(socialMediaAccounts.id, id), eq(socialMediaAccounts.userId, userId)));
}

// ─── Content Analytics ────────────────────────────────────────────────────────
export async function createContentAnalytics(data: InsertContentAnalytics): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(contentAnalytics).values(data);
  return result[0].insertId as number;
}

export async function getContentAnalyticsByRepurposedId(repurposedContentId: number, userId: number): Promise<ContentAnalytics[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select()
    .from(contentAnalytics)
    .where(and(eq(contentAnalytics.repurposedContentId, repurposedContentId), eq(contentAnalytics.userId, userId)))
    .orderBy(desc(contentAnalytics.createdAt));
}

export async function getContentAnalyticsByPlatform(userId: number, platform: "twitter" | "linkedin"): Promise<ContentAnalytics[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select()
    .from(contentAnalytics)
    .where(and(eq(contentAnalytics.userId, userId), eq(contentAnalytics.platform, platform)))
    .orderBy(desc(contentAnalytics.createdAt));
}

export async function updateContentAnalytics(id: number, userId: number, data: Partial<ContentAnalytics>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(contentAnalytics)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(contentAnalytics.id, id), eq(contentAnalytics.userId, userId)));
}

export async function getAnalyticsSummary(userId: number): Promise<{
  totalImpressions: number;
  totalEngagements: number;
  totalClicks: number;
  byPlatform: Record<string, { impressions: number; engagements: number; clicks: number }>;
}> {
  const db = await getDb();
  if (!db) return { totalImpressions: 0, totalEngagements: 0, totalClicks: 0, byPlatform: {} };

  const allAnalytics = await db.select()
    .from(contentAnalytics)
    .where(eq(contentAnalytics.userId, userId));

  const summary = {
    totalImpressions: 0,
    totalEngagements: 0,
    totalClicks: 0,
    byPlatform: {} as Record<string, { impressions: number; engagements: number; clicks: number }>,
  };

  for (const metric of allAnalytics) {
    summary.totalImpressions += metric.impressions || 0;
    summary.totalEngagements += metric.engagements || 0;
    summary.totalClicks += metric.clicks || 0;

    if (!summary.byPlatform[metric.platform]) {
      summary.byPlatform[metric.platform] = { impressions: 0, engagements: 0, clicks: 0 };
    }
    summary.byPlatform[metric.platform].impressions += metric.impressions || 0;
    summary.byPlatform[metric.platform].engagements += metric.engagements || 0;
    summary.byPlatform[metric.platform].clicks += metric.clicks || 0;
  }

  return summary;
}

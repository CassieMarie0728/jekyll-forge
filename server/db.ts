import { eq, and, desc, asc, lt, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  sites,
  InsertSite,
  Site,
  posts,
  InsertPost,
  Post,
  snapshots,
  InsertSnapshot,
  assets,
  InsertAsset,
  aiSettings,
  InsertAiSetting,
  scheduledPosts,
  InsertScheduledPost,
  reusableBlocks,
  InsertReusableBlock,
  frontMatterTemplates,
  repurposedContent,
  InsertRepurposedContent,
  RepurposedContent,
  socialMediaAccounts,
  InsertSocialMediaAccount,
  SocialMediaAccount,
  scheduledSocialPosts,
  InsertScheduledSocialPost,
  ScheduledSocialPost,
  mobileDeviceTokens,
  contentAnalytics,
  InsertContentAnalytics,
  ContentAnalytics,
  contentVariations,
  abTestResults,
  abTestSummary,
  ContentVariation,
  AbTestResult,
  AbTestSummary,
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

export async function registerMobileDeviceToken(
  userId: number,
  token: string,
  platform: "android" = "android"
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  const existing = await db
    .select({ id: mobileDeviceTokens.id })
    .from(mobileDeviceTokens)
    .where(eq(mobileDeviceTokens.token, token))
    .limit(1);

  if (existing[0]) {
    await db
      .update(mobileDeviceTokens)
      .set({ userId, platform, enabled: true })
      .where(eq(mobileDeviceTokens.id, existing[0].id));
    return;
  }

  await db
    .insert(mobileDeviceTokens)
    .values({ userId, token, platform, enabled: true });
}

export async function revokeMobileDeviceToken(
  userId: number,
  token: string
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .update(mobileDeviceTokens)
    .set({ enabled: false })
    .where(
      and(
        eq(mobileDeviceTokens.userId, userId),
        eq(mobileDeviceTokens.token, token)
      )
    );
}

// ─── Repurposed Content ───────────────────────────────────────────────────────
export async function createRepurposedContent(
  data: InsertRepurposedContent
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(repurposedContent).values(data);
  return result[0].insertId as number;
}

export async function getRepurposedContentByPostId(
  postId: number,
  userId: number
): Promise<RepurposedContent[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(repurposedContent)
    .where(
      and(
        eq(repurposedContent.postId, postId),
        eq(repurposedContent.userId, userId)
      )
    )
    .orderBy(desc(repurposedContent.createdAt));
}

export async function getRepurposedContentById(
  id: number,
  userId: number
): Promise<RepurposedContent | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(repurposedContent)
    .where(
      and(eq(repurposedContent.id, id), eq(repurposedContent.userId, userId))
    )
    .limit(1);
  return result[0];
}

export async function updateRepurposedContent(
  id: number,
  userId: number,
  data: Partial<RepurposedContent>
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .update(repurposedContent)
    .set({ ...data, updatedAt: new Date() })
    .where(
      and(eq(repurposedContent.id, id), eq(repurposedContent.userId, userId))
    );
}

export async function deleteRepurposedContent(
  id: number,
  userId: number
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .delete(repurposedContent)
    .where(
      and(eq(repurposedContent.id, id), eq(repurposedContent.userId, userId))
    );
}

// ─── Users ────────────────────────────────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};

  const fields = [
    "name",
    "email",
    "loginMethod",
    "githubToken",
    "githubLogin",
    "githubAvatarUrl",
    "githubId",
  ] as const;
  for (const field of fields) {
    const v = user[field as keyof InsertUser];
    if (v !== undefined) {
      (values as Record<string, unknown>)[field] = v ?? null;
      updateSet[field] = v ?? null;
    }
  }

  values.lastSignedIn = user.lastSignedIn ?? new Date();
  updateSet.lastSignedIn = values.lastSignedIn;

  await db
    .insert(users)
    .values(values)
    .onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);
  return result[0];
}

// ─── Sites ────────────────────────────────────────────────────────────────────
export async function getSitesByUserId(userId: number): Promise<Site[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(sites)
    .where(eq(sites.userId, userId))
    .orderBy(desc(sites.lastAccessedAt));
}

export async function getSiteById(
  id: number,
  userId: number
): Promise<Site | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(sites)
    .where(and(eq(sites.id, id), eq(sites.userId, userId)))
    .limit(1);
  return result[0];
}

export async function upsertSite(data: InsertSite): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const existing = await db
    .select({ id: sites.id })
    .from(sites)
    .where(
      and(
        eq(sites.userId, data.userId),
        eq(sites.owner, data.owner),
        eq(sites.repo, data.repo)
      )
    )
    .limit(1);
  if (existing[0]) {
    await db
      .update(sites)
      .set({ ...data, lastAccessedAt: new Date() })
      .where(eq(sites.id, existing[0].id));
    return existing[0].id;
  }
  const result = await db
    .insert(sites)
    .values({ ...data, lastAccessedAt: new Date() });
  return Number((result as unknown as { insertId: number }).insertId);
}

export async function updateSite(
  id: number,
  userId: number,
  data: Partial<InsertSite>
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .update(sites)
    .set(data)
    .where(and(eq(sites.id, id), eq(sites.userId, userId)));
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
export async function getPostsBySiteId(
  siteId: number,
  userId: number
): Promise<Post[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(posts)
    .where(and(eq(posts.siteId, siteId), eq(posts.userId, userId)))
    .orderBy(desc(posts.updatedAt));
}

export async function getPostById(
  id: number,
  userId: number
): Promise<Post | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(posts)
    .where(and(eq(posts.id, id), eq(posts.userId, userId)))
    .limit(1);
  return result[0];
}

export async function upsertPost(data: InsertPost): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const existing = await db
    .select({ id: posts.id })
    .from(posts)
    .where(
      and(
        eq(posts.userId, data.userId),
        eq(posts.siteId, data.siteId),
        eq(posts.path, data.path)
      )
    )
    .limit(1);
  if (existing[0]) {
    await db.update(posts).set(data).where(eq(posts.id, existing[0].id));
    return existing[0].id;
  }
  const result = await db.insert(posts).values(data);
  return Number((result as unknown as { insertId: number }).insertId);
}

export async function updatePost(
  id: number,
  userId: number,
  data: Partial<InsertPost>
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .update(posts)
    .set(data)
    .where(and(eq(posts.id, id), eq(posts.userId, userId)));
}

export async function deletePost(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(posts).where(and(eq(posts.id, id), eq(posts.userId, userId)));
}

export async function autosavePost(
  id: number,
  userId: number,
  markdown: string,
  frontMatter: Record<string, unknown>
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .update(posts)
    .set({
      autosaveContent: markdown,
      autosaveFrontMatter: frontMatter,
      lastAutosaveAt: new Date(),
    })
    .where(and(eq(posts.id, id), eq(posts.userId, userId)));
}

// ─── Snapshots ────────────────────────────────────────────────────────────────
export async function createSnapshot(data: InsertSnapshot): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(snapshots).values(data);
  return Number((result as unknown as { insertId: number }).insertId);
}

export async function getSnapshotsByPost(
  postPath: string,
  siteId: number,
  userId: number
) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(snapshots)
    .where(
      and(
        eq(snapshots.postPath, postPath),
        eq(snapshots.siteId, siteId),
        eq(snapshots.userId, userId)
      )
    )
    .orderBy(desc(snapshots.createdAt))
    .limit(50);
}

export async function getSnapshotById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(snapshots)
    .where(and(eq(snapshots.id, id), eq(snapshots.userId, userId)))
    .limit(1);
  return result[0];
}

// ─── Assets ───────────────────────────────────────────────────────────────────
export async function getAssetsBySiteId(siteId: number, userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(assets)
    .where(and(eq(assets.siteId, siteId), eq(assets.userId, userId)))
    .orderBy(desc(assets.createdAt));
}

export async function createAsset(data: InsertAsset): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(assets).values(data);
  return Number((result as unknown as { insertId: number }).insertId);
}

export async function updateAsset(
  id: number,
  userId: number,
  data: Partial<InsertAsset>
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .update(assets)
    .set(data)
    .where(and(eq(assets.id, id), eq(assets.userId, userId)));
}

export async function deleteAsset(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .delete(assets)
    .where(and(eq(assets.id, id), eq(assets.userId, userId)));
}

export async function findAssetByHash(
  hash: string,
  siteId: number,
  userId: number
) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(assets)
    .where(
      and(
        eq(assets.hash, hash),
        eq(assets.siteId, siteId),
        eq(assets.userId, userId)
      )
    )
    .limit(1);
  return result[0];
}

// ─── AI Settings ─────────────────────────────────────────────────────────────
export async function getAiSettings(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(aiSettings)
    .where(eq(aiSettings.userId, userId))
    .limit(1);
  return result[0];
}

export async function upsertAiSettings(data: InsertAiSetting): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const { userId, ...rest } = data;
  await db.insert(aiSettings).values(data).onDuplicateKeyUpdate({ set: rest });
}

export async function incrementAiUsage(
  userId: number,
  inputTokens: number,
  outputTokens: number
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const current = await getAiSettings(userId);
  if (!current) return;
  await db
    .update(aiSettings)
    .set({
      totalRequestCount: (current.totalRequestCount ?? 0) + 1,
      totalInputTokens: (current.totalInputTokens ?? 0) + inputTokens,
      totalOutputTokens: (current.totalOutputTokens ?? 0) + outputTokens,
    })
    .where(eq(aiSettings.userId, userId));
}

// ─── Scheduled Posts ─────────────────────────────────────────────────────
export async function getPendingScheduledPosts(before: Date) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(scheduledPosts)
    .where(
      and(
        eq(scheduledPosts.status, "pending"),
        lt(scheduledPosts.scheduledAt, before)
      )
    );
}

export async function createScheduledPost(
  data: InsertScheduledPost
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(scheduledPosts).values(data);
  return Number((result as unknown as { insertId: number }).insertId);
}

export async function updateScheduledPost(
  id: number,
  data: Partial<InsertScheduledPost>
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(scheduledPosts).set(data).where(eq(scheduledPosts.id, id));
}

export async function getScheduledPostsBySite(siteId: number, userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(scheduledPosts)
    .where(
      and(eq(scheduledPosts.siteId, siteId), eq(scheduledPosts.userId, userId))
    )
    .orderBy(asc(scheduledPosts.scheduledAt));
}

// ─── Scheduled Social Media Posts ────────────────────────────────────────────
export async function getPendingScheduledSocialPosts(before: Date) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(scheduledSocialPosts)
    .where(
      and(
        eq(scheduledSocialPosts.status, "pending"),
        lt(scheduledSocialPosts.scheduledAt, before)
      )
    );
}

export async function createScheduledSocialPost(
  data: InsertScheduledSocialPost
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(scheduledSocialPosts).values(data);
  return Number((result as unknown as { insertId: number }).insertId);
}

export async function getScheduledSocialPostById(
  id: number,
  userId: number
): Promise<ScheduledSocialPost | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(scheduledSocialPosts)
    .where(
      and(
        eq(scheduledSocialPosts.id, id),
        eq(scheduledSocialPosts.userId, userId)
      )
    );
  return result[0] || null;
}

export async function updateScheduledSocialPost(
  id: number,
  userId: number,
  data: Partial<InsertScheduledSocialPost>
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .update(scheduledSocialPosts)
    .set(data)
    .where(
      and(
        eq(scheduledSocialPosts.id, id),
        eq(scheduledSocialPosts.userId, userId)
      )
    );
}

export async function getScheduledSocialPostsByRepurposedContent(
  repurposedContentId: number,
  userId: number
): Promise<ScheduledSocialPost[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(scheduledSocialPosts)
    .where(
      and(
        eq(scheduledSocialPosts.repurposedContentId, repurposedContentId),
        eq(scheduledSocialPosts.userId, userId)
      )
    )
    .orderBy(asc(scheduledSocialPosts.scheduledAt));
}

export async function cancelScheduledSocialPost(
  id: number,
  userId: number
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .update(scheduledSocialPosts)
    .set({ status: "cancelled" })
    .where(
      and(
        eq(scheduledSocialPosts.id, id),
        eq(scheduledSocialPosts.userId, userId)
      )
    );
}

// ─── Reusable Blocks ─────────────────────────────────────────────────────────
export async function getReusableBlocks(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(reusableBlocks)
    .where(eq(reusableBlocks.userId, userId))
    .orderBy(asc(reusableBlocks.name));
}

export async function createReusableBlock(
  data: InsertReusableBlock
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(reusableBlocks).values(data);
  return Number((result as unknown as { insertId: number }).insertId);
}

export async function updateReusableBlock(
  id: number,
  userId: number,
  data: Partial<InsertReusableBlock>
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .update(reusableBlocks)
    .set(data)
    .where(and(eq(reusableBlocks.id, id), eq(reusableBlocks.userId, userId)));
}

export async function deleteReusableBlock(
  id: number,
  userId: number
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .delete(reusableBlocks)
    .where(and(eq(reusableBlocks.id, id), eq(reusableBlocks.userId, userId)));
}

export async function getScheduledPostById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(scheduledPosts)
    .where(and(eq(scheduledPosts.id, id), eq(scheduledPosts.userId, userId)))
    .limit(1);
  return result[0];
}

export async function getScheduledPostByTaskUid(taskUid: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(scheduledPosts)
    .where(eq(scheduledPosts.scheduleCronTaskUid, taskUid))
    .limit(1);
  return result[0];
}

// ─── Front Matter Templates ───────────────────────────────────────────────────
export async function getFrontMatterTemplates(userId: number, siteId?: number) {
  const db = await getDb();
  if (!db) return [];
  const conditions = siteId
    ? and(
        eq(frontMatterTemplates.userId, userId),
        eq(frontMatterTemplates.siteId, siteId)
      )
    : eq(frontMatterTemplates.userId, userId);
  return db
    .select()
    .from(frontMatterTemplates)
    .where(conditions)
    .orderBy(asc(frontMatterTemplates.name));
}

// ─── Social Media Accounts ────────────────────────────────────────────────────
export async function createSocialMediaAccount(
  data: InsertSocialMediaAccount
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(socialMediaAccounts).values(data);
  return result[0].insertId as number;
}

export async function getSocialMediaAccountsByUserId(
  userId: number
): Promise<SocialMediaAccount[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(socialMediaAccounts)
    .where(eq(socialMediaAccounts.userId, userId))
    .orderBy(desc(socialMediaAccounts.createdAt));
}

export async function getSocialMediaAccount(
  id: number,
  userId: number
): Promise<SocialMediaAccount | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(socialMediaAccounts)
    .where(
      and(
        eq(socialMediaAccounts.id, id),
        eq(socialMediaAccounts.userId, userId)
      )
    )
    .limit(1);
  return result[0];
}

export async function updateSocialMediaAccount(
  id: number,
  userId: number,
  data: Partial<SocialMediaAccount>
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .update(socialMediaAccounts)
    .set({ ...data, updatedAt: new Date() })
    .where(
      and(
        eq(socialMediaAccounts.id, id),
        eq(socialMediaAccounts.userId, userId)
      )
    );
}

export async function deleteSocialMediaAccount(
  id: number,
  userId: number
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .delete(socialMediaAccounts)
    .where(
      and(
        eq(socialMediaAccounts.id, id),
        eq(socialMediaAccounts.userId, userId)
      )
    );
}

// ─── Content Analytics ────────────────────────────────────────────────────────
export async function createContentAnalytics(
  data: InsertContentAnalytics
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(contentAnalytics).values(data);
  return result[0].insertId as number;
}

export async function getContentAnalyticsByRepurposedId(
  repurposedContentId: number,
  userId: number
): Promise<ContentAnalytics[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(contentAnalytics)
    .where(
      and(
        eq(contentAnalytics.repurposedContentId, repurposedContentId),
        eq(contentAnalytics.userId, userId)
      )
    )
    .orderBy(desc(contentAnalytics.createdAt));
}

export async function getContentAnalyticsByPlatform(
  userId: number,
  platform: "twitter" | "linkedin"
): Promise<ContentAnalytics[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(contentAnalytics)
    .where(
      and(
        eq(contentAnalytics.userId, userId),
        eq(contentAnalytics.platform, platform)
      )
    )
    .orderBy(desc(contentAnalytics.createdAt));
}

export async function updateContentAnalytics(
  id: number,
  userId: number,
  data: Partial<ContentAnalytics>
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .update(contentAnalytics)
    .set({ ...data, updatedAt: new Date() })
    .where(
      and(eq(contentAnalytics.id, id), eq(contentAnalytics.userId, userId))
    );
}

export async function getAnalyticsSummary(userId: number): Promise<{
  totalImpressions: number;
  totalEngagements: number;
  totalClicks: number;
  byPlatform: Record<
    string,
    { impressions: number; engagements: number; clicks: number }
  >;
}> {
  const db = await getDb();
  if (!db)
    return {
      totalImpressions: 0,
      totalEngagements: 0,
      totalClicks: 0,
      byPlatform: {},
    };

  const allAnalytics = await db
    .select()
    .from(contentAnalytics)
    .where(eq(contentAnalytics.userId, userId));

  const summary = {
    totalImpressions: 0,
    totalEngagements: 0,
    totalClicks: 0,
    byPlatform: {} as Record<
      string,
      { impressions: number; engagements: number; clicks: number }
    >,
  };

  for (const metric of allAnalytics) {
    summary.totalImpressions += metric.impressions || 0;
    summary.totalEngagements += metric.engagements || 0;
    summary.totalClicks += metric.clicks || 0;

    if (!summary.byPlatform[metric.platform]) {
      summary.byPlatform[metric.platform] = {
        impressions: 0,
        engagements: 0,
        clicks: 0,
      };
    }
    summary.byPlatform[metric.platform].impressions += metric.impressions || 0;
    summary.byPlatform[metric.platform].engagements += metric.engagements || 0;
    summary.byPlatform[metric.platform].clicks += metric.clicks || 0;
  }

  return summary;
}

// ─── A/B Testing Helpers ────────────────────────────────────────────────────────

export async function createContentVariation(
  userId: number,
  postId: number,
  variationIndex: number,
  headline: string,
  content: string,
  tone?: string,
  angle?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(contentVariations).values({
    userId,
    postId,
    variationIndex,
    headline,
    content,
    tone,
    angle,
    status: "draft",
  });
}

export async function getContentVariations(postId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db
    .select()
    .from(contentVariations)
    .where(eq(contentVariations.postId, postId));
}

export async function updateVariationStatus(
  variationId: number,
  status: "draft" | "published" | "archived"
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db
    .update(contentVariations)
    .set({ status, updatedAt: new Date() })
    .where(eq(contentVariations.id, variationId));
}

export async function createAbTestResult(
  userId: number,
  postId: number,
  variationIndex: number,
  platform: string,
  externalPostId?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(abTestResults).values({
    userId,
    postId,
    variationIndex,
    platform: platform as any,
    externalPostId,
    status: "active",
  });
}

export async function updateAbTestMetrics(
  testResultId: number,
  metrics: {
    impressions?: number;
    engagements?: number;
    clicks?: number;
    shares?: number;
    likes?: number;
    replies?: number;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const engagementRate =
    metrics.engagements && metrics.impressions
      ? (metrics.engagements / metrics.impressions) * 100
      : 0;

  return db
    .update(abTestResults)
    .set({
      ...metrics,
      engagementRate: engagementRate.toString() as any,
      updatedAt: new Date(),
    })
    .where(eq(abTestResults.id, testResultId));
}

export async function getAbTestResults(postId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db
    .select()
    .from(abTestResults)
    .where(eq(abTestResults.postId, postId));
}

export async function createAbTestSummary(
  userId: number,
  postId: number,
  totalVariations: number,
  testDurationDays: number = 7
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(abTestSummary).values({
    userId,
    postId,
    totalVariations,
    testDurationDays,
    status: "running",
  });
}

export async function updateAbTestSummary(
  summaryId: number,
  winningVariationIndex: number,
  winningMetric: string,
  insights: Record<string, unknown>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db
    .update(abTestSummary)
    .set({
      winningVariationIndex,
      winningMetric,
      insights,
      status: "completed",
      updatedAt: new Date(),
    })
    .where(eq(abTestSummary.id, summaryId));
}

export async function getAbTestSummary(postId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db
    .select()
    .from(abTestSummary)
    .where(eq(abTestSummary.postId, postId))
    .limit(1);
}

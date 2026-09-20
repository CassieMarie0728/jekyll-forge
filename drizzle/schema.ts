import {
  integer,
  sqliteTable,
  text,
  uniqueIndex,
  index,
} from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// ─── Users ──────────────────────────────────────────────────────────────────
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  openId: text("openId").notNull().unique(),
  name: text("name"),
  email: text("email"),
  loginMethod: text("loginMethod"),
  role: text("role", { enum: ["user", "admin"] })
    .default("user")
    .notNull(),
  // GitHub OAuth
  githubToken: text("githubToken"),
  githubLogin: text("githubLogin"),
  githubAvatarUrl: text("githubAvatarUrl"),
  githubId: text("githubId"),
  createdAt: integer("createdAt", { mode: "timestamp" })
    .default(sql`(unixepoch())`)
    .notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" })
    .default(sql`(unixepoch())`)
    .$onUpdate(() => new Date())
    .notNull(),
  lastSignedIn: integer("lastSignedIn", { mode: "timestamp" })
    .default(sql`(unixepoch())`)
    .notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Mobile device tokens ────────────────────────────────────────────────────
export const mobileDeviceTokens = sqliteTable(
  "mobile_device_tokens",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("userId").notNull(),
    token: text("token").notNull().unique(),
    platform: text("platform", { enum: ["android"] })
      .default("android")
      .notNull(),
    enabled: integer("enabled", { mode: "boolean" }).default(true).notNull(),
    createdAt: integer("createdAt", { mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
    updatedAt: integer("updatedAt", { mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  table => [index("mobile_device_tokens_user").on(table.userId)]
);

export type MobileDeviceToken = typeof mobileDeviceTokens.$inferSelect;
export type InsertMobileDeviceToken = typeof mobileDeviceTokens.$inferInsert;

// ─── Mobile OAuth authorization tickets ─────────────────────────────────────
// A short-lived, one-time code is redirected into the Android app after the
// browser OAuth callback. The app exchanges it for a session token over tRPC.
export const mobileAuthCodes = sqliteTable(
  "mobile_auth_codes",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("userId").notNull(),
    codeHash: text("codeHash").notNull().unique(),
    expiresAt: integer("expiresAt", { mode: "timestamp" }).notNull(),
    usedAt: integer("usedAt", { mode: "timestamp" }),
    createdAt: integer("createdAt", { mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
  },
  table => [
    index("mobile_auth_codes_user").on(table.userId),
    index("mobile_auth_codes_expiry").on(table.expiresAt),
  ]
);

export type MobileAuthCode = typeof mobileAuthCodes.$inferSelect;

// ─── Sites (GitHub Repositories) ────────────────────────────────────────────
export const sites = sqliteTable(
  "sites",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("userId").notNull(),
    owner: text("owner").notNull(),
    repo: text("repo").notNull(),
    defaultBranch: text("defaultBranch").default("main"),
    selectedBranch: text("selectedBranch").default("main"),
    rootPath: text("rootPath").default("/"),
    isJekyll: integer("isJekyll", { mode: "boolean" }).default(false),
    isFavorite: integer("isFavorite", { mode: "boolean" }).default(false),
    timezone: text("timezone").default("UTC"),
    defaultLayout: text("defaultLayout").default("post"),
    defaultAssetPath: text("defaultAssetPath").default("/assets/images"),
    aiVoiceProfile: text("aiVoiceProfile").default("default"),
    settings: text("settings", { mode: "json" }).$type<
      Record<string, unknown>
    >(),
    lastAccessedAt: integer("lastAccessedAt", { mode: "timestamp" }).default(
      sql`(unixepoch())`
    ),
    createdAt: integer("createdAt", { mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
    updatedAt: integer("updatedAt", { mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  table => [index("sites_user").on(table.userId)]
);

export type Site = typeof sites.$inferSelect;
export type InsertSite = typeof sites.$inferInsert;

// ─── Posts (local drafts / metadata cache) ───────────────────────────────────
export const posts = sqliteTable(
  "posts",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("userId").notNull(),
    siteId: integer("siteId").notNull(),
    path: text("path").notNull(),
    filename: text("filename"),
    slug: text("slug"),
    title: text("title"),
    status: text("status", {
      enum: ["draft", "published", "modified", "new", "scheduled", "archived"],
    }).default("new"),
    frontMatter: text("frontMatter", { mode: "json" }).$type<
      Record<string, unknown>
    >(),
    markdown: text("markdown"),
    sha: text("sha"),
    scheduledAt: integer("scheduledAt", { mode: "timestamp" }),
    publishedAt: integer("publishedAt", { mode: "timestamp" }),
    lastAutosaveAt: integer("lastAutosaveAt", { mode: "timestamp" }),
    autosaveContent: text("autosaveContent"),
    autosaveFrontMatter: text("autosaveFrontMatter", { mode: "json" }).$type<
      Record<string, unknown>
    >(),
    createdAt: integer("createdAt", { mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
    updatedAt: integer("updatedAt", { mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  table => [
    index("posts_user").on(table.userId),
    index("posts_site_user").on(table.siteId, table.userId),
  ]
);

export type Post = typeof posts.$inferSelect;
export type InsertPost = typeof posts.$inferInsert;

// ─── Revision Snapshots ───────────────────────────────────────────────────────
export const snapshots = sqliteTable(
  "snapshots",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("userId").notNull(),
    siteId: integer("siteId").notNull(),
    postId: integer("postId"),
    postPath: text("postPath"),
    label: text("label").notNull(),
    reason: text("reason", {
      enum: [
        "manual",
        "autosave",
        "before-ai",
        "before-publish",
        "before-theme",
        "before-plugin",
      ],
    }).default("manual"),
    markdown: text("markdown"),
    frontMatter: text("frontMatter", { mode: "json" }).$type<
      Record<string, unknown>
    >(),
    createdAt: integer("createdAt", { mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
  },
  table => [
    index("snapshots_user").on(table.userId),
    index("snapshots_site_user").on(table.siteId, table.userId),
  ]
);

export type Snapshot = typeof snapshots.$inferSelect;
export type InsertSnapshot = typeof snapshots.$inferInsert;

// ─── Assets ───────────────────────────────────────────────────────────────────
export const assets = sqliteTable(
  "assets",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("userId").notNull(),
    siteId: integer("siteId").notNull(),
    name: text("name").notNull(),
    path: text("path").notNull(),
    storageKey: text("storageKey"),
    branch: text("branch"),
    storageUrl: text("storageUrl"),
    mimeType: text("mimeType"),
    size: integer("size"),
    width: integer("width"),
    height: integer("height"),
    alt: text("alt"),
    sha: text("sha"),
    hash: text("hash"),
    optimized: integer("optimized", { mode: "boolean" }).default(false),
    /** JSON: { thumbnail?: string, medium?: string, large?: string } — S3 URLs for responsive variants */
    variants: text("variants", { mode: "json" }).$type<{
      thumbnail?: string;
      medium?: string;
      large?: string;
    }>(),
    createdAt: integer("createdAt", { mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
    updatedAt: integer("updatedAt", { mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  table => [
    index("assets_user").on(table.userId),
    index("assets_site_user").on(table.siteId, table.userId),
  ]
);

export type Asset = typeof assets.$inferSelect;
export type InsertAsset = typeof assets.$inferInsert;

// ─── AI Settings ─────────────────────────────────────────────────────────────
export const aiSettings = sqliteTable(
  "ai_settings",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("userId").notNull().unique(),
    enabled: integer("enabled", { mode: "boolean" }).default(true),
    provider: text("provider").default("built-in"),
    model: text("model"),
    temperature: integer("temperature").default(70), // stored as 0-100, divide by 100
    maxTokens: integer("maxTokens").default(2048),
    systemPrompt: text("systemPrompt"),
    brandVoicePrompt: text("brandVoicePrompt"),
    safetyPrompt: text("safetyPrompt"),
    streaming: integer("streaming", { mode: "boolean" }).default(true),
    defaultLanguage: text("defaultLanguage").default("en"),
    budgetLimitCents: integer("budgetLimitCents"),
    totalRequestCount: integer("totalRequestCount").default(0),
    totalInputTokens: integer("totalInputTokens").default(0),
    totalOutputTokens: integer("totalOutputTokens").default(0),
    createdAt: integer("createdAt", { mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
    updatedAt: integer("updatedAt", { mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  table => [index("ai_settings_user").on(table.userId)]
);

export type AiSetting = typeof aiSettings.$inferSelect;
export type InsertAiSetting = typeof aiSettings.$inferInsert;

// ─── User-owned AI Provider Keys ────────────────────────────────────────────
// Keys are encrypted by the server before persistence. They must never be
// returned to either client application or stored in mobile device storage.
export const userAiProviders = sqliteTable(
  "user_ai_providers",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("userId").notNull(),
    provider: text("provider", {
      enum: ["openrouter", "gemini", "groq", "mistral"],
    }).notNull(),
    encryptedApiKey: text("encryptedApiKey").notNull(),
    selectedModel: text("selectedModel").notNull(),
    enabled: integer("enabled", { mode: "boolean" }).default(true).notNull(),
    createdAt: integer("createdAt", { mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
    updatedAt: integer("updatedAt", { mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  table => [
    uniqueIndex("user_ai_providers_user_provider_unique").on(
      table.userId,
      table.provider
    ),
  ]
);

export type UserAiProvider = typeof userAiProviders.$inferSelect;
export type InsertUserAiProvider = typeof userAiProviders.$inferInsert;

// ─── Scheduled Posts ───────────────────────────────────────────────────────────
export const scheduledPosts = sqliteTable(
  "scheduled_posts",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("userId").notNull(),
    siteId: integer("siteId").notNull(),
    postId: integer("postId"),
    draftPath: text("draftPath").notNull(),
    targetPath: text("targetPath").notNull(),
    branch: text("branch"),
    scheduledAt: integer("scheduledAt", { mode: "timestamp" }).notNull(),
    timezone: text("timezone").default("UTC"),
    status: text("status", {
      enum: ["pending", "processing", "published", "failed", "cancelled"],
    }).default("pending"),
    commitMessage: text("commitMessage"),
    errorMessage: text("errorMessage"),
    publishedAt: integer("publishedAt", { mode: "timestamp" }),
    scheduleCronTaskUid: text("scheduleCronTaskUid"),
    createdAt: integer("createdAt", { mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
    updatedAt: integer("updatedAt", { mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  table => [
    index("scheduled_posts_user").on(table.userId),
    index("scheduled_posts_due").on(table.status, table.scheduledAt),
  ]
);

export type ScheduledPost = typeof scheduledPosts.$inferSelect;
export type InsertScheduledPost = typeof scheduledPosts.$inferInsert;

// ─── Reusable Content Blocks ──────────────────────────────────────────────────
export const reusableBlocks = sqliteTable(
  "reusable_blocks",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("userId").notNull(),
    name: text("name").notNull(),
    category: text("category"),
    content: text("content").notNull(),
    contentType: text("contentType", {
      enum: ["markdown", "html", "liquid"],
    }).default("markdown"),
    createdAt: integer("createdAt", { mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
    updatedAt: integer("updatedAt", { mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  table => [index("reusable_blocks_user").on(table.userId)]
);

export type ReusableBlock = typeof reusableBlocks.$inferSelect;
export type InsertReusableBlock = typeof reusableBlocks.$inferInsert;

// ─── Front Matter Templates ───────────────────────────────────────────────────
export const frontMatterTemplates = sqliteTable(
  "front_matter_templates",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("userId").notNull(),
    siteId: integer("siteId"),
    name: text("name").notNull(),
    template: text("template", { mode: "json" })
      .$type<Record<string, unknown>>()
      .notNull(),
    isDefault: integer("isDefault", { mode: "boolean" }).default(false),
    createdAt: integer("createdAt", { mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
    updatedAt: integer("updatedAt", { mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  table => [index("front_matter_templates_user").on(table.userId)]
);

export type FrontMatterTemplate = typeof frontMatterTemplates.$inferSelect;

// ─── Repurposed Content ───────────────────────────────────────────────────────
export const repurposedContent = sqliteTable(
  "repurposed_content",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("userId").notNull(),
    siteId: integer("siteId").notNull(),
    postId: integer("postId").notNull(),
    postTitle: text("postTitle"),
    postSlug: text("postSlug"),
    /** Format type: twitter, linkedin, tiktok, youtube, newsletter, email, podcast, slides */
    format: text("format", {
      enum: [
        "twitter",
        "linkedin",
        "tiktok",
        "youtube",
        "newsletter",
        "email",
        "podcast",
        "slides",
      ],
    }).notNull(),
    /** The repurposed content */
    content: text("content").notNull(),
    /** Metadata specific to format (e.g., character count, thread count, etc.) */
    metadata: text("metadata", { mode: "json" }).$type<
      Record<string, unknown>
    >(),
    /** Whether this content has been edited by user */
    isCustomized: integer("isCustomized", { mode: "boolean" }).default(false),
    /** Status: generated, approved, published, archived */
    status: text("status", {
      enum: ["generated", "approved", "published", "archived"],
    }).default("generated"),
    createdAt: integer("createdAt", { mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
    updatedAt: integer("updatedAt", { mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  table => [
    index("repurposed_content_user").on(table.userId),
    index("repurposed_content_site_user").on(table.siteId, table.userId),
  ]
);

export type RepurposedContent = typeof repurposedContent.$inferSelect;
export type InsertRepurposedContent = typeof repurposedContent.$inferInsert;

// ─── Social Media Accounts ────────────────────────────────────────────────────
export const socialMediaAccounts = sqliteTable(
  "social_media_accounts",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("userId").notNull(),
    platform: text("platform", {
      enum: ["twitter", "linkedin", "facebook", "instagram"],
    }).notNull(),
    accountId: text("accountId").notNull(),
    username: text("username"),
    displayName: text("displayName"),
    profileImageUrl: text("profileImageUrl"),
    accessToken: text("accessToken").notNull(),
    refreshToken: text("refreshToken"),
    expiresAt: integer("expiresAt", { mode: "timestamp" }),
    isConnected: integer("isConnected", { mode: "boolean" }).default(true),
    createdAt: integer("createdAt", { mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
    updatedAt: integer("updatedAt", { mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  table => [index("social_media_accounts_user").on(table.userId)]
);

export type SocialMediaAccount = typeof socialMediaAccounts.$inferSelect;
export type InsertSocialMediaAccount = typeof socialMediaAccounts.$inferInsert;

// ─── Scheduled Social Media Posts ──────────────────────────────────────────────
export const scheduledSocialPosts = sqliteTable(
  "scheduled_social_posts",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("userId").notNull(),
    repurposedContentId: integer("repurposedContentId").notNull(),
    socialMediaAccountId: integer("socialMediaAccountId").notNull(),
    platform: text("platform", {
      enum: ["twitter", "linkedin", "facebook", "instagram"],
    }).notNull(),
    content: text("content").notNull(),
    scheduledAt: integer("scheduledAt", { mode: "timestamp" }).notNull(),
    timezone: text("timezone").default("UTC"),
    status: text("status", {
      enum: ["pending", "processing", "published", "failed", "cancelled"],
    }).default("pending"),
    externalPostId: text("externalPostId"),
    externalUrl: text("externalUrl"),
    errorMessage: text("errorMessage"),
    retryCount: integer("retryCount").default(0),
    maxRetries: integer("maxRetries").default(3),
    lastRetryAt: integer("lastRetryAt", { mode: "timestamp" }),
    publishedAt: integer("publishedAt", { mode: "timestamp" }),
    scheduleCronTaskUid: text("scheduleCronTaskUid"),
    createdAt: integer("createdAt", { mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
    updatedAt: integer("updatedAt", { mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  table => [
    index("scheduled_social_posts_user").on(table.userId),
    index("scheduled_social_posts_due").on(table.status, table.scheduledAt),
  ]
);

export type ScheduledSocialPost = typeof scheduledSocialPosts.$inferSelect;
export type InsertScheduledSocialPost =
  typeof scheduledSocialPosts.$inferInsert;

// ─── Content Analytics ────────────────────────────────────────────────────────
export const contentAnalytics = sqliteTable(
  "content_analytics",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("userId").notNull(),
    repurposedContentId: integer("repurposedContentId").notNull(),
    platform: text("platform", {
      enum: ["twitter", "linkedin", "facebook", "instagram"],
    }).notNull(),
    externalPostId: text("externalPostId"),
    externalUrl: text("externalUrl"),
    impressions: integer("impressions").default(0),
    engagements: integer("engagements").default(0),
    clicks: integer("clicks").default(0),
    shares: integer("shares").default(0),
    likes: integer("likes").default(0),
    replies: integer("replies").default(0),
    retweets: integer("retweets").default(0),
    /** Raw analytics data from platform API */
    rawMetrics: text("rawMetrics", { mode: "json" }).$type<
      Record<string, unknown>
    >(),
    /** Last time metrics were synced from platform */
    lastSyncedAt: integer("lastSyncedAt", { mode: "timestamp" }),
    createdAt: integer("createdAt", { mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
    updatedAt: integer("updatedAt", { mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  table => [index("content_analytics_user").on(table.userId)]
);

export type ContentAnalytics = typeof contentAnalytics.$inferSelect;
export type InsertContentAnalytics = typeof contentAnalytics.$inferInsert;

// ─── Content Variations (A/B Testing) ──────────────────────────────────────────
export const contentVariations = sqliteTable(
  "content_variations",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("userId").notNull(),
    postId: integer("postId").notNull(),
    variationIndex: integer("variationIndex").notNull(), // 0 = original, 1-N = variations
    headline: text("headline").notNull(),
    content: text("content").notNull(),
    tone: text("tone"), // e.g., "professional", "casual", "humorous"
    angle: text("angle"), // e.g., "beginner-friendly", "advanced", "contrarian"
    status: text("status", { enum: ["draft", "published", "archived"] })
      .default("draft")
      .notNull(),
    createdAt: integer("createdAt", { mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
    updatedAt: integer("updatedAt", { mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  table => [index("content_variations_user").on(table.userId)]
);

export type ContentVariation = typeof contentVariations.$inferSelect;
export type InsertContentVariation = typeof contentVariations.$inferInsert;

// ─── A/B Test Results ─────────────────────────────────────────────────────────
export const abTestResults = sqliteTable(
  "ab_test_results",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("userId").notNull(),
    postId: integer("postId").notNull(),
    variationIndex: integer("variationIndex").notNull(),
    platform: text("platform", {
      enum: ["twitter", "linkedin", "facebook", "instagram", "email", "direct"],
    }).notNull(),
    externalPostId: text("externalPostId"),
    impressions: integer("impressions").default(0),
    engagements: integer("engagements").default(0),
    clicks: integer("clicks").default(0),
    shares: integer("shares").default(0),
    likes: integer("likes").default(0),
    replies: integer("replies").default(0),
    engagementRate: text("engagementRate").default("0"), // percentage
    status: text("status", { enum: ["active", "completed", "paused"] })
      .default("active")
      .notNull(),
    startedAt: integer("startedAt", { mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
    endedAt: integer("endedAt", { mode: "timestamp" }),
    createdAt: integer("createdAt", { mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
    updatedAt: integer("updatedAt", { mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  table => [index("ab_test_results_user").on(table.userId)]
);

export type AbTestResult = typeof abTestResults.$inferSelect;
export type InsertAbTestResult = typeof abTestResults.$inferInsert;

// ─── A/B Test Summary ─────────────────────────────────────────────────────────
export const abTestSummary = sqliteTable(
  "ab_test_summary",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("userId").notNull(),
    postId: integer("postId").notNull(),
    winningVariationIndex: integer("winningVariationIndex"),
    totalVariations: integer("totalVariations").notNull(),
    testDurationDays: integer("testDurationDays").default(7),
    winningMetric: text("winningMetric"), // "engagement_rate", "clicks", "shares", etc.
    status: text("status", { enum: ["running", "completed", "archived"] })
      .default("running")
      .notNull(),
    insights: text("insights", { mode: "json" }).$type<
      Record<string, unknown>
    >(), // JSON with detailed insights
    createdAt: integer("createdAt", { mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
    updatedAt: integer("updatedAt", { mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  table => [index("ab_test_summary_user").on(table.userId)]
);

export type AbTestSummary = typeof abTestSummary.$inferSelect;

export const rateWindows = sqliteTable(
  "rate_windows",
  {
    key: text("key").primaryKey(),
    count: integer("count").notNull(),
    expiresAt: integer("expiresAt").notNull(),
  },
  table => [index("rate_windows_expiry").on(table.expiresAt)]
);

export const operatorNotifications = sqliteTable("operator_notifications", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  content: text("content").notNull(),
  createdAt: integer("createdAt").notNull(),
});
export type InsertAbTestSummary = typeof abTestSummary.$inferInsert;

import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  boolean,
  json,
  bigint,
} from "drizzle-orm/mysql-core";

// ─── Users ──────────────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  // GitHub OAuth
  githubToken: text("githubToken"),
  githubLogin: varchar("githubLogin", { length: 128 }),
  githubAvatarUrl: text("githubAvatarUrl"),
  githubId: varchar("githubId", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Sites (GitHub Repositories) ────────────────────────────────────────────
export const sites = mysqlTable("sites", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  owner: varchar("owner", { length: 128 }).notNull(),
  repo: varchar("repo", { length: 256 }).notNull(),
  defaultBranch: varchar("defaultBranch", { length: 128 }).default("main"),
  selectedBranch: varchar("selectedBranch", { length: 128 }).default("main"),
  rootPath: varchar("rootPath", { length: 256 }).default("/"),
  isJekyll: boolean("isJekyll").default(false),
  isFavorite: boolean("isFavorite").default(false),
  timezone: varchar("timezone", { length: 64 }).default("UTC"),
  defaultLayout: varchar("defaultLayout", { length: 128 }).default("post"),
  defaultAssetPath: varchar("defaultAssetPath", { length: 256 }).default("/assets/images"),
  aiVoiceProfile: varchar("aiVoiceProfile", { length: 64 }).default("default"),
  settings: json("settings").$type<Record<string, unknown>>(),
  lastAccessedAt: timestamp("lastAccessedAt").defaultNow(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Site = typeof sites.$inferSelect;
export type InsertSite = typeof sites.$inferInsert;

// ─── Posts (local drafts / metadata cache) ───────────────────────────────────
export const posts = mysqlTable("posts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  siteId: int("siteId").notNull(),
  path: varchar("path", { length: 512 }).notNull(),
  filename: varchar("filename", { length: 256 }),
  slug: varchar("slug", { length: 256 }),
  title: text("title"),
  status: mysqlEnum("status", ["draft", "published", "modified", "new", "scheduled", "archived"]).default("new"),
  frontMatter: json("frontMatter").$type<Record<string, unknown>>(),
  markdown: text("markdown"),
  sha: varchar("sha", { length: 64 }),
  scheduledAt: timestamp("scheduledAt"),
  publishedAt: timestamp("publishedAt"),
  lastAutosaveAt: timestamp("lastAutosaveAt"),
  autosaveContent: text("autosaveContent"),
  autosaveFrontMatter: json("autosaveFrontMatter").$type<Record<string, unknown>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Post = typeof posts.$inferSelect;
export type InsertPost = typeof posts.$inferInsert;

// ─── Revision Snapshots ───────────────────────────────────────────────────────
export const snapshots = mysqlTable("snapshots", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  siteId: int("siteId").notNull(),
  postId: int("postId"),
  postPath: varchar("postPath", { length: 512 }),
  label: varchar("label", { length: 256 }).notNull(),
  reason: mysqlEnum("reason", ["manual", "autosave", "before-ai", "before-publish", "before-theme", "before-plugin"]).default("manual"),
  markdown: text("markdown"),
  frontMatter: json("frontMatter").$type<Record<string, unknown>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Snapshot = typeof snapshots.$inferSelect;
export type InsertSnapshot = typeof snapshots.$inferInsert;

// ─── Assets ───────────────────────────────────────────────────────────────────
export const assets = mysqlTable("assets", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  siteId: int("siteId").notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  path: varchar("path", { length: 512 }).notNull(),
  storageKey: varchar("storageKey", { length: 512 }),
  storageUrl: text("storageUrl"),
  mimeType: varchar("mimeType", { length: 128 }),
  size: bigint("size", { mode: "number" }),
  width: int("width"),
  height: int("height"),
  alt: text("alt"),
  sha: varchar("sha", { length: 64 }),
  hash: varchar("hash", { length: 64 }),
  optimized: boolean("optimized").default(false),
  /** JSON: { thumbnail?: string, medium?: string, large?: string } — S3 URLs for responsive variants */
  variants: json("variants").$type<{ thumbnail?: string; medium?: string; large?: string }>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Asset = typeof assets.$inferSelect;
export type InsertAsset = typeof assets.$inferInsert;

// ─── AI Settings ─────────────────────────────────────────────────────────────
export const aiSettings = mysqlTable("ai_settings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  enabled: boolean("enabled").default(true),
  provider: varchar("provider", { length: 64 }).default("built-in"),
  model: varchar("model", { length: 128 }),
  temperature: int("temperature").default(70), // stored as 0-100, divide by 100
  maxTokens: int("maxTokens").default(2048),
  systemPrompt: text("systemPrompt"),
  brandVoicePrompt: text("brandVoicePrompt"),
  safetyPrompt: text("safetyPrompt"),
  streaming: boolean("streaming").default(true),
  defaultLanguage: varchar("defaultLanguage", { length: 16 }).default("en"),
  budgetLimitCents: int("budgetLimitCents"),
  totalRequestCount: int("totalRequestCount").default(0),
  totalInputTokens: bigint("totalInputTokens", { mode: "number" }).default(0),
  totalOutputTokens: bigint("totalOutputTokens", { mode: "number" }).default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AiSetting = typeof aiSettings.$inferSelect;
export type InsertAiSetting = typeof aiSettings.$inferInsert;

// ─── AI Voice Profiles ────────────────────────────────────────────────────────
export const aiVoiceProfiles = mysqlTable("ai_voice_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  tone: varchar("tone", { length: 64 }),
  formality: varchar("formality", { length: 64 }),
  humorLevel: varchar("humorLevel", { length: 32 }),
  readingLevel: varchar("readingLevel", { length: 64 }),
  forbiddenPhrases: json("forbiddenPhrases").$type<string[]>(),
  requiredPhrases: json("requiredPhrases").$type<string[]>(),
  brandRules: text("brandRules"),
  exampleSamples: text("exampleSamples"),
  systemPrompt: text("systemPrompt"),
  isDefault: boolean("isDefault").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AiVoiceProfile = typeof aiVoiceProfiles.$inferSelect;

// ─── AI Prompt Templates ──────────────────────────────────────────────────────
export const aiPromptTemplates = mysqlTable("ai_prompt_templates", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  category: varchar("category", { length: 64 }),
  template: text("template").notNull(),
  variables: json("variables").$type<string[]>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AiPromptTemplate = typeof aiPromptTemplates.$inferSelect;

// ─── Scheduled Posts ─────────────────────────────────────────────────────────
export const scheduledPosts = mysqlTable("scheduled_posts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  siteId: int("siteId").notNull(),
  postId: int("postId"),
  draftPath: varchar("draftPath", { length: 512 }).notNull(),
  targetPath: varchar("targetPath", { length: 512 }).notNull(),
  scheduledAt: timestamp("scheduledAt").notNull(),
  timezone: varchar("timezone", { length: 64 }).default("UTC"),
  status: mysqlEnum("status", ["pending", "processing", "published", "failed", "cancelled"]).default("pending"),
  commitMessage: text("commitMessage"),
  errorMessage: text("errorMessage"),
  publishedAt: timestamp("publishedAt"),
  scheduleCronTaskUid: varchar("scheduleCronTaskUid", { length: 65 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ScheduledPost = typeof scheduledPosts.$inferSelect;
export type InsertScheduledPost = typeof scheduledPosts.$inferInsert;

// ─── Reusable Content Blocks ──────────────────────────────────────────────────
export const reusableBlocks = mysqlTable("reusable_blocks", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  category: varchar("category", { length: 64 }),
  content: text("content").notNull(),
  contentType: mysqlEnum("contentType", ["markdown", "html", "liquid"]).default("markdown"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ReusableBlock = typeof reusableBlocks.$inferSelect;
export type InsertReusableBlock = typeof reusableBlocks.$inferInsert;

// ─── Front Matter Templates ───────────────────────────────────────────────────
export const frontMatterTemplates = mysqlTable("front_matter_templates", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  siteId: int("siteId"),
  name: varchar("name", { length: 128 }).notNull(),
  template: json("template").$type<Record<string, unknown>>().notNull(),
  isDefault: boolean("isDefault").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FrontMatterTemplate = typeof frontMatterTemplates.$inferSelect;

// ─── Repurposed Content ───────────────────────────────────────────────────────
export const repurposedContent = mysqlTable("repurposed_content", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  siteId: int("siteId").notNull(),
  postId: int("postId").notNull(),
  postTitle: varchar("postTitle", { length: 512 }),
  postSlug: varchar("postSlug", { length: 256 }),
  /** Format type: twitter, linkedin, tiktok, youtube, newsletter, email, podcast, slides */
  format: mysqlEnum("format", ["twitter", "linkedin", "tiktok", "youtube", "newsletter", "email", "podcast", "slides"]).notNull(),
  /** The repurposed content */
  content: text("content").notNull(),
  /** Metadata specific to format (e.g., character count, thread count, etc.) */
  metadata: json("metadata").$type<Record<string, unknown>>(),
  /** Whether this content has been edited by user */
  isCustomized: boolean("isCustomized").default(false),
  /** Status: generated, approved, published, archived */
  status: mysqlEnum("status", ["generated", "approved", "published", "archived"]).default("generated"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type RepurposedContent = typeof repurposedContent.$inferSelect;
export type InsertRepurposedContent = typeof repurposedContent.$inferInsert;

// ─── Social Media Accounts ────────────────────────────────────────────────────
export const socialMediaAccounts = mysqlTable("social_media_accounts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  platform: mysqlEnum("platform", ["twitter", "linkedin"]).notNull(),
  accountId: varchar("accountId", { length: 256 }).notNull(),
  username: varchar("username", { length: 256 }),
  displayName: varchar("displayName", { length: 256 }),
  profileImageUrl: text("profileImageUrl"),
  accessToken: text("accessToken").notNull(),
  refreshToken: text("refreshToken"),
  expiresAt: timestamp("expiresAt"),
  isConnected: boolean("isConnected").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SocialMediaAccount = typeof socialMediaAccounts.$inferSelect;
export type InsertSocialMediaAccount = typeof socialMediaAccounts.$inferInsert;

// ─── Content Analytics ────────────────────────────────────────────────────────
export const contentAnalytics = mysqlTable("content_analytics", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  repurposedContentId: int("repurposedContentId").notNull(),
  platform: mysqlEnum("platform", ["twitter", "linkedin"]).notNull(),
  externalPostId: varchar("externalPostId", { length: 256 }),
  externalUrl: text("externalUrl"),
  impressions: int("impressions").default(0),
  engagements: int("engagements").default(0),
  clicks: int("clicks").default(0),
  shares: int("shares").default(0),
  likes: int("likes").default(0),
  replies: int("replies").default(0),
  retweets: int("retweets").default(0),
  /** Raw analytics data from platform API */
  rawMetrics: json("rawMetrics").$type<Record<string, unknown>>(),
  /** Last time metrics were synced from platform */
  lastSyncedAt: timestamp("lastSyncedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ContentAnalytics = typeof contentAnalytics.$inferSelect;
export type InsertContentAnalytics = typeof contentAnalytics.$inferInsert;

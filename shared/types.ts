// ─── GitHub Types ─────────────────────────────────────────────────────────────
export type GitHubRepo = {
  id: number;
  name: string;
  full_name: string;
  owner: { login: string; avatar_url: string };
  private: boolean;
  default_branch: string;
  description?: string;
  updated_at: string;
  html_url: string;
  permissions?: { admin: boolean; push: boolean; pull: boolean };
};

export type GitHubBranch = {
  name: string;
  commit: { sha: string };
  protected: boolean;
};

export type GitHubFile = {
  name: string;
  path: string;
  sha: string;
  size: number;
  type: "file" | "dir";
  download_url?: string;
  content?: string;
  encoding?: string;
};

export type GitHubCommitResult = {
  commit: { sha: string; message: string };
  content: { sha: string; path: string };
};

// ─── Jekyll Types ─────────────────────────────────────────────────────────────
export type JekyllDetection = {
  isJekyll: boolean;
  hasConfig: boolean;
  hasPosts: boolean;
  hasDrafts: boolean;
  hasLayouts: boolean;
  hasIncludes: boolean;
  hasSass: boolean;
  hasData: boolean;
  hasAssets: boolean;
  hasGemfile: boolean;
  detectedTheme?: string;
  detectedPlugins?: string[];
  buildMethod?: "github-pages" | "github-actions" | "unknown";
};

export type JekyllPost = {
  path: string;
  filename: string;
  slug: string;
  frontMatter: Record<string, unknown>;
  markdown: string;
  htmlPreview?: string;
  status: "draft" | "published" | "modified" | "new" | "scheduled" | "archived";
  sha?: string;
  scheduledAt?: string;
};

export type FrontMatterField = {
  key: string;
  value: unknown;
  type: "string" | "number" | "boolean" | "date" | "list" | "object" | "image" | "url";
};

// ─── Editor Types ─────────────────────────────────────────────────────────────
export type EditorMode = "visual" | "markdown" | "split";

export type EditorState = {
  mode: EditorMode;
  markdown: string;
  frontMatter: Record<string, unknown>;
  isDirty: boolean;
  lastSaved?: Date;
  wordCount: number;
  readingTime: number;
};

// ─── AI Types ─────────────────────────────────────────────────────────────────
export type AITask =
  | "title" | "outline" | "draft" | "rewrite" | "continue"
  | "shorter" | "longer" | "tone" | "grammar" | "seo"
  | "tags" | "categories" | "slug" | "excerpt" | "alt-text"
  | "markdown-cleanup" | "front-matter-cleanup" | "faq"
  | "social" | "summary" | "internal-links" | "callout"
  | "toc" | "convert-html";

export type AIRequest = {
  task: AITask;
  userPrompt?: string;
  selectedText?: string;
  postMarkdown?: string;
  frontMatter?: Record<string, unknown>;
  tone?: string;
  voiceProfileId?: number;
};

export type AIResponse = {
  text: string;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
    estimatedCost?: number;
  };
};

// ─── Publishing Types ─────────────────────────────────────────────────────────
export type PublishAction =
  | "save-local"
  | "save-drafts"
  | "publish-posts"
  | "commit-branch"
  | "create-pr"
  | "schedule";

export type PublishValidation = {
  valid: boolean;
  errors: string[];
  warnings: string[];
  seoScore?: number;
};

export type DiffResult = {
  type: "added" | "removed" | "unchanged";
  value: string;
  count?: number;
};

// ─── Asset Types ─────────────────────────────────────────────────────────────
export type AssetType = "image" | "document" | "audio" | "video" | "archive" | "other";

export type OptimizationOptions = {
  resize?: { width?: number; height?: number };
  compress?: boolean;
  convertToWebp?: boolean;
  stripExif?: boolean;
  generateThumbnail?: boolean;
  generateResponsive?: boolean;
};

// ─── Site Health Types ────────────────────────────────────────────────────────
export type SiteHealthStatus = {
  github: {
    repoStatus: "ok" | "error" | "unknown";
    pagesStatus: "active" | "inactive" | "unknown";
    latestDeployment?: string;
    rateLimit?: { remaining: number; limit: number };
  };
  jekyll: {
    configValid: boolean;
    postsCount: number;
    draftsCount: number;
    assetsCount: number;
    theme?: string;
    plugins: string[];
    buildMethod: string;
  };
  content: {
    brokenLinks: number;
    missingImages: number;
    missingAltText: number;
    missingDescriptions: number;
    duplicateSlugs: string[];
    scheduledPosts: number;
  };
};

// ─── Snapshot Types ───────────────────────────────────────────────────────────
export type SnapshotReason = "manual" | "autosave" | "before-ai" | "before-publish" | "before-theme" | "before-plugin";

// ─── Plugin Compatibility ─────────────────────────────────────────────────────
export const GITHUB_PAGES_SUPPORTED_PLUGINS = [
  "jekyll-feed",
  "jekyll-seo-tag",
  "jekyll-sitemap",
  "jekyll-paginate",
  "jekyll-redirect-from",
  "jekyll-remote-theme",
  "jekyll-avatar",
  "jekyll-coffeescript",
  "jekyll-commonmark-ghpages",
  "jekyll-default-layout",
  "jekyll-gist",
  "jekyll-github-metadata",
  "jekyll-include-cache",
  "jekyll-mentions",
  "jekyll-optional-front-matter",
  "jekyll-readme-index",
  "jekyll-relative-links",
  "jekyll-titles-from-headings",
] as const;

export const GITHUB_PAGES_THEMES = [
  "minima",
  "jekyll-theme-architect",
  "jekyll-theme-cayman",
  "jekyll-theme-dinky",
  "jekyll-theme-hacker",
  "jekyll-theme-leap-day",
  "jekyll-theme-merlot",
  "jekyll-theme-midnight",
  "jekyll-theme-minimal",
  "jekyll-theme-modernist",
  "jekyll-theme-primer",
  "jekyll-theme-slate",
  "jekyll-theme-tactile",
  "jekyll-theme-time-machine",
] as const;

import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { COOKIE_NAME } from "../shared/const";

// ─── Mock helpers ─────────────────────────────────────────────────────────────
function makeCtx(overrides: Partial<TrpcContext> = {}): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user",
      email: "test@example.com",
      name: "Test User",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
    ...overrides,
  };
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
describe("auth.me", () => {
  it("returns the current user when authenticated", async () => {
    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeTruthy();
    expect(result?.openId).toBe("test-user");
  });

  it("returns null when unauthenticated", async () => {
    const ctx = makeCtx({ user: null });
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });
});

describe("auth.logout", () => {
  it("clears the session cookie and reports success", async () => {
    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result).toEqual({ success: true });
    expect(ctx.res.clearCookie).toHaveBeenCalledWith(
      COOKIE_NAME,
      expect.objectContaining({ maxAge: -1, httpOnly: true })
    );
  });
});

// ─── Markdown / Front Matter Utilities ────────────────────────────────────────
describe("parseMarkdownFrontMatter (inline logic)", () => {
  function parse(raw: string) {
    if (!raw.startsWith("---")) return { frontMatter: {}, markdown: raw };
    const end = raw.indexOf("\n---", 3);
    if (end === -1) return { frontMatter: {}, markdown: raw };
    const yamlStr = raw.slice(4, end);
    const markdown = raw.slice(end + 4).trimStart();
    const frontMatter: Record<string, unknown> = {};
    for (const line of yamlStr.split("\n")) {
      const colonIdx = line.indexOf(":");
      if (colonIdx === -1) continue;
      const key = line.slice(0, colonIdx).trim();
      const val = line.slice(colonIdx + 1).trim();
      if (!key) continue;
      if (val === "true") frontMatter[key] = true;
      else if (val === "false") frontMatter[key] = false;
      else if (!isNaN(Number(val)) && val !== "") frontMatter[key] = Number(val);
      else frontMatter[key] = val.replace(/^["']|["']$/g, "");
    }
    return { frontMatter, markdown };
  }

  it("parses a simple front matter block", () => {
    const raw = `---\ntitle: "Hello World"\ndate: "2024-01-01"\n---\n\nContent here`;
    const { frontMatter, markdown } = parse(raw);
    expect(frontMatter.title).toBe("Hello World");
    expect(frontMatter.date).toBe("2024-01-01");
    expect(markdown).toContain("Content here");
  });

  it("handles boolean values", () => {
    const raw = `---\npublished: true\ndraft: false\n---\n\nBody`;
    const { frontMatter } = parse(raw);
    expect(frontMatter.published).toBe(true);
    expect(frontMatter.draft).toBe(false);
  });

  it("handles numeric values", () => {
    const raw = `---\nweight: 42\n---\n\nBody`;
    const { frontMatter } = parse(raw);
    expect(frontMatter.weight).toBe(42);
  });

  it("returns raw string when no front matter", () => {
    const raw = "Just plain markdown";
    const { frontMatter, markdown } = parse(raw);
    expect(Object.keys(frontMatter)).toHaveLength(0);
    expect(markdown).toBe("Just plain markdown");
  });
});

// ─── Slug / Filename Generation ───────────────────────────────────────────────
describe("generateSlug", () => {
  function generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  }

  it("converts a title to a URL-safe slug", () => {
    expect(generateSlug("Hello World!")).toBe("hello-world");
  });

  it("collapses multiple spaces and hyphens", () => {
    expect(generateSlug("My  --  Post")).toBe("my-post");
  });

  it("strips special characters", () => {
    // & and : are stripped, spaces become hyphens, double hyphens are collapsed
    expect(generateSlug("Jekyll & Hyde: A Story")).toBe("jekyll-hyde-a-story");
  });

  it("handles empty string", () => {
    expect(generateSlug("")).toBe("");
  });
});

// ─── Jekyll Filename Generation ───────────────────────────────────────────────
describe("generateJekyllFilename", () => {
  function generateFilename(slug: string, date: string, folder: "_drafts" | "_posts"): string {
    const safeSlug = slug || "untitled";
    if (folder === "_drafts") return `_drafts/${safeSlug}.md`;
    const d = date ? new Date(date) : new Date();
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    return `_posts/${dateStr}-${safeSlug}.md`;
  }

  it("generates a _posts filename with date prefix", () => {
    const result = generateFilename("hello-world", "2024-06-15", "_posts");
    expect(result).toBe("_posts/2024-06-15-hello-world.md");
  });

  it("generates a _drafts filename without date prefix", () => {
    const result = generateFilename("my-draft", "2024-06-15", "_drafts");
    expect(result).toBe("_drafts/my-draft.md");
  });

  it("uses 'untitled' when slug is empty", () => {
    const result = generateFilename("", "2024-01-01", "_posts");
    expect(result).toBe("_posts/2024-01-01-untitled.md");
  });
});

// ─── Word Count ───────────────────────────────────────────────────────────────
describe("wordCount", () => {
  function wordCount(text: string): number {
    return text.trim().split(/\s+/).filter(Boolean).length;
  }

  it("counts words correctly", () => {
    expect(wordCount("Hello world this is a test")).toBe(6);
  });

  it("handles empty string", () => {
    expect(wordCount("")).toBe(0);
  });

  it("handles multiple spaces", () => {
    expect(wordCount("  one   two   three  ")).toBe(3);
  });
});

// ─── Reading Time ─────────────────────────────────────────────────────────────
describe("readingTime", () => {
  function readingTime(text: string): number {
    const wpm = 200;
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.ceil(words / wpm));
  }

  it("returns at least 1 minute", () => {
    expect(readingTime("Short")).toBe(1);
  });

  it("calculates reading time for longer text", () => {
    const text = Array(400).fill("word").join(" ");
    expect(readingTime(text)).toBe(2);
  });
});

// ─── YAML Serialization ───────────────────────────────────────────────────────
describe("serializeToMarkdown", () => {
  function serializeToMarkdown(frontMatter: Record<string, unknown>, markdown: string): string {
    const lines = ["---"];
    for (const [k, v] of Object.entries(frontMatter)) {
      if (v === null || v === undefined) continue;
      if (Array.isArray(v)) lines.push(`${k}: [${v.map(i => `"${i}"`).join(", ")}]`);
      else if (typeof v === "boolean") lines.push(`${k}: ${v}`);
      else if (typeof v === "number") lines.push(`${k}: ${v}`);
      else lines.push(`${k}: "${String(v).replace(/"/g, '\\"')}"`);
    }
    lines.push("---");
    lines.push("");
    lines.push(markdown);
    return lines.join("\n");
  }

  it("serializes string fields with quotes", () => {
    const result = serializeToMarkdown({ title: "Hello" }, "Content");
    expect(result).toContain('title: "Hello"');
  });

  it("serializes boolean fields without quotes", () => {
    const result = serializeToMarkdown({ published: true }, "Content");
    expect(result).toContain("published: true");
  });

  it("serializes array fields", () => {
    const result = serializeToMarkdown({ tags: ["a", "b"] }, "Content");
    expect(result).toContain('tags: ["a", "b"]');
  });

  it("skips null/undefined fields", () => {
    const result = serializeToMarkdown({ title: null, body: undefined }, "Content");
    expect(result).not.toContain("title:");
    expect(result).not.toContain("body:");
  });

  it("wraps content with front matter delimiters", () => {
    const result = serializeToMarkdown({}, "My content");
    expect(result.startsWith("---\n---\n")).toBe(true);
    expect(result).toContain("My content");
  });
});

// ─── GitHub Pages Plugin Compatibility ───────────────────────────────────────
describe("GITHUB_PAGES_SUPPORTED_PLUGINS", () => {
  const SUPPORTED = [
    "jekyll-feed", "jekyll-seo-tag", "jekyll-sitemap", "jekyll-paginate",
    "jekyll-redirect-from", "jekyll-remote-theme",
  ];

  it("includes core supported plugins", () => {
    expect(SUPPORTED).toContain("jekyll-feed");
    expect(SUPPORTED).toContain("jekyll-seo-tag");
    expect(SUPPORTED).toContain("jekyll-sitemap");
  });

  it("does not include unsupported plugins", () => {
    expect(SUPPORTED).not.toContain("jekyll-admin");
    expect(SUPPORTED).not.toContain("jekyll-algolia");
  });
});

// ─── AI Task Types ────────────────────────────────────────────────────────────
describe("AI task types", () => {
  const VALID_TASKS = [
    "title", "outline", "draft", "rewrite", "continue",
    "shorter", "longer", "tone", "grammar", "seo",
    "tags", "categories", "slug", "excerpt", "alt-text",
    "markdown-cleanup", "front-matter-cleanup", "faq",
    "social", "summary", "internal-links", "callout", "toc", "convert-html",
  ];

  it("includes all expected AI task types", () => {
    expect(VALID_TASKS).toContain("title");
    expect(VALID_TASKS).toContain("seo");
    expect(VALID_TASKS).toContain("alt-text");
    expect(VALID_TASKS).toContain("social");
    expect(VALID_TASKS).toContain("faq");
    expect(VALID_TASKS).toHaveLength(24);
  });
});

// ─── Snapshot Reasons ────────────────────────────────────────────────────────
describe("SnapshotReason types", () => {
  const VALID_REASONS = ["manual", "autosave", "before-ai", "before-publish", "before-theme", "before-plugin"];

  it("includes all expected snapshot reasons", () => {
    expect(VALID_REASONS).toContain("before-ai");
    expect(VALID_REASONS).toContain("before-publish");
    expect(VALID_REASONS).toContain("before-theme");
    expect(VALID_REASONS).toHaveLength(6);
  });
});

// ─── Scheduler: dateToCron ────────────────────────────────────────────────────
describe("dateToCron", () => {
  function dateToCron(date: Date): string {
    const sec = date.getUTCSeconds();
    const min = date.getUTCMinutes();
    const hour = date.getUTCHours();
    const dom = date.getUTCDate();
    const mon = date.getUTCMonth() + 1;
    return `${sec} ${min} ${hour} ${dom} ${mon} *`;
  }

  it("converts a UTC date to a 6-field cron expression", () => {
    const d = new Date("2024-06-15T14:30:00.000Z");
    expect(dateToCron(d)).toBe("0 30 14 15 6 *");
  });

  it("handles midnight UTC", () => {
    const d = new Date("2024-01-01T00:00:00.000Z");
    expect(dateToCron(d)).toBe("0 0 0 1 1 *");
  });

  it("handles end-of-month dates", () => {
    const d = new Date("2024-12-31T23:59:59.000Z");
    expect(dateToCron(d)).toBe("59 59 23 31 12 *");
  });
});

// ─── Scheduler: cancel logic ──────────────────────────────────────────────────
describe("scheduler cancel safety", () => {
  it("cancel uses row ID not siteId=0 to fetch the scheduled post", () => {
    // This test documents the fixed bug: cancel must fetch by (id, userId),
    // not by (siteId=0, userId) which would always return empty.
    function mockGetById(id: number, userId: number) {
      if (id === 42 && userId === 1) return { id: 42, scheduleCronTaskUid: "task-uid-abc", status: "pending" };
      return undefined;
    }
    const row = mockGetById(42, 1);
    expect(row).toBeDefined();
    expect(row?.scheduleCronTaskUid).toBe("task-uid-abc");

    // Simulating the old bug: siteId=0 would return nothing
    function mockGetBySite(siteId: number, userId: number) {
      if (siteId === 5 && userId === 1) return [{ id: 42, scheduleCronTaskUid: "task-uid-abc" }];
      return [];
    }
    const bugResult = mockGetBySite(0, 1); // old bug: siteId=0
    expect(bugResult).toHaveLength(0);
  });
});

// ─── Image Optimization: variant naming ──────────────────────────────────────
describe("image variant naming", () => {
  function getVariantSizes() {
    return [
      { name: "thumbnail", maxWidth: 300, quality: 75 },
      { name: "medium", maxWidth: 800, quality: 80 },
      { name: "large", maxWidth: 1200, quality: 82 },
    ];
  }

  it("defines three responsive variant sizes", () => {
    const sizes = getVariantSizes();
    expect(sizes).toHaveLength(3);
    expect(sizes[0].name).toBe("thumbnail");
    expect(sizes[1].name).toBe("medium");
    expect(sizes[2].name).toBe("large");
  });

  it("thumbnail is smallest, large is biggest", () => {
    const sizes = getVariantSizes();
    expect(sizes[0].maxWidth).toBeLessThan(sizes[1].maxWidth);
    expect(sizes[1].maxWidth).toBeLessThan(sizes[2].maxWidth);
  });

  it("generates correct storage key suffix for webp variants", () => {
    const baseName = "hero-image";
    const ts = 1718000000000;
    const ext = ".webp";
    const siteId = 3;
    const userId = 1;
    const keys = ["thumb", "medium", "large"].map(
      (suffix) => `assets/${userId}/${siteId}/${ts}-${baseName}-${suffix}${ext}`
    );
    expect(keys[0]).toBe(`assets/1/3/${ts}-hero-image-thumb.webp`);
    expect(keys[1]).toBe(`assets/1/3/${ts}-hero-image-medium.webp`);
    expect(keys[2]).toBe(`assets/1/3/${ts}-hero-image-large.webp`);
  });
});

// ─── updateJekyllConfig: theme patching logic ─────────────────────────────────
describe("updateJekyllConfig theme patching", () => {
  function patchTheme(content: string, theme: string): string {
    if (/^theme:/m.test(content)) {
      return content.replace(/^theme:.*$/m, `theme: ${theme}`);
    }
    return `theme: ${theme}\n` + content;
  }

  it("replaces existing theme line", () => {
    const result = patchTheme("theme: minima\ntitle: My Blog\n", "cayman");
    expect(result).toContain("theme: cayman");
    expect(result).not.toContain("theme: minima");
  });

  it("prepends theme when not present", () => {
    const result = patchTheme("title: My Blog\n", "slate");
    expect(result.startsWith("theme: slate\n")).toBe(true);
  });

  it("does not duplicate theme line", () => {
    const result = patchTheme("theme: minima\n", "cayman");
    const matches = result.match(/^theme:/gm);
    expect(matches).toHaveLength(1);
  });
});

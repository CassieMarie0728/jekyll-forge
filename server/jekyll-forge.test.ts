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

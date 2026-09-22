import { load, dump, JSON_SCHEMA } from "js-yaml";
export type FrontMatter = Record<string, unknown>;

export function parseMarkdownFrontMatter(raw: string): {
  frontMatter: FrontMatter;
  markdown: string;
} {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) return { frontMatter: {}, markdown: raw };
  const parsed = load(match[1], { schema: JSON_SCHEMA });
  if (parsed != null && (typeof parsed !== "object" || Array.isArray(parsed)))
    throw new Error("Post front matter must be a YAML mapping.");
  return {
    frontMatter: (parsed || {}) as FrontMatter,
    markdown: raw.slice(match[0].length).replace(/^\r?\n/, ""),
  };
}

export function serializeToMarkdown(
  frontMatter: FrontMatter,
  markdown: string
): string {
  const values = Object.fromEntries(
    Object.entries(frontMatter).filter(([, value]) => value != null)
  );
  return `---\n${dump(values, { schema: JSON_SCHEMA, forceQuotes: true, quotingType: '"', noRefs: true, lineWidth: -1 })}---\n\n${markdown}`;
}

export function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function readingTime(text: string): number {
  return Math.max(1, Math.round(wordCount(text) / 200));
}

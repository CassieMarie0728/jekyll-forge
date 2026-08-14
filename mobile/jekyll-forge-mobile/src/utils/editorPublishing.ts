export function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "untitled-post"
  );
}

export function joinSitePath(
  rootPath: string | null | undefined,
  relativePath: string
) {
  const root = (rootPath || "").replace(/^\/+|\/+$/g, "");
  return root ? `${root}/${relativePath}` : relativePath;
}

export function serializeJekyllPost(
  frontMatter: Record<string, unknown>,
  markdown: string
) {
  const serializedFrontMatter = Object.entries(frontMatter)
    .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
    .join("\n");
  return `---\n${serializedFrontMatter}\n---\n\n${markdown.trim()}\n`;
}

export function getCommittedSha(result: unknown): string | undefined {
  if (!result || typeof result !== "object") return undefined;
  const content = (result as { content?: unknown }).content;
  if (!content || typeof content !== "object") return undefined;
  const sha = (content as { sha?: unknown }).sha;
  return typeof sha === "string" ? sha : undefined;
}

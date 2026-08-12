export type FrontMatter = Record<string, unknown>;

export function parseMarkdownFrontMatter(raw: string): {
  frontMatter: FrontMatter;
  markdown: string;
} {
  if (!raw.startsWith("---")) return { frontMatter: {}, markdown: raw };

  const end = raw.indexOf("\n---", 3);
  if (end === -1) return { frontMatter: {}, markdown: raw };

  const yamlStr = raw.slice(4, end);
  const markdown = raw.slice(end + 4).trimStart();
  const frontMatter: FrontMatter = {};

  for (const line of yamlStr.split("\n")) {
    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;

    const key = line.slice(0, colonIdx).trim();
    const value = line.slice(colonIdx + 1).trim();
    if (!key) continue;

    if (value === "true") frontMatter[key] = true;
    else if (value === "false") frontMatter[key] = false;
    else if (!Number.isNaN(Number(value)) && value !== "")
      frontMatter[key] = Number(value);
    else if (value.startsWith("[") && value.endsWith("]")) {
      try {
        frontMatter[key] = JSON.parse(value);
      } catch {
        frontMatter[key] = value;
      }
    } else {
      frontMatter[key] = value.replace(/^["']|["']$/g, "");
    }
  }

  return { frontMatter, markdown };
}

export function serializeToMarkdown(
  frontMatter: FrontMatter,
  markdown: string
): string {
  const lines = ["---"];

  for (const [key, value] of Object.entries(frontMatter)) {
    if (value === null || value === undefined) continue;
    if (Array.isArray(value))
      lines.push(`${key}: [${value.map(item => `"${item}"`).join(", ")}]`);
    else if (typeof value === "boolean" || typeof value === "number")
      lines.push(`${key}: ${value}`);
    else lines.push(`${key}: "${String(value).replace(/"/g, '\\"')}"`);
  }

  lines.push("---", "", markdown);
  return lines.join("\n");
}

export function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function readingTime(text: string): number {
  return Math.max(1, Math.round(wordCount(text) / 200));
}

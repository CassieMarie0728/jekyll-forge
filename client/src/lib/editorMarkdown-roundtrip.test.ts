import { expect, it } from "vitest";
import {
  parseMarkdownFrontMatter,
  serializeToMarkdown,
} from "./editorMarkdown";
it("round trips nested YAML, quotes, multiline values and backslashes", () => {
  const frontMatter = {
    title: 'A "quote"',
    image: { path: "C:\\images\\book.png", alt: "A cover" },
    tags: ["a, b", '"quoted"'],
    description: "First\nSecond",
    date: "2026-09-20",
  };
  expect(
    parseMarkdownFrontMatter(serializeToMarkdown(frontMatter, "Body\n"))
      .frontMatter
  ).toEqual(frontMatter);
  expect(
    parseMarkdownFrontMatter(serializeToMarkdown(frontMatter, "Body\n"))
      .markdown
  ).toBe("Body\n");
});
it("rejects malformed YAML instead of silently losing it", () => {
  expect(() =>
    parseMarkdownFrontMatter("---\ntags: [oops\n---\nBody")
  ).toThrow();
});

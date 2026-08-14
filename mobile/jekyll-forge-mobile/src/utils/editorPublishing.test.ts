import {
  getCommittedSha,
  joinSitePath,
  serializeJekyllPost,
  slugify,
} from "./editorPublishing";

describe("editor publishing helpers", () => {
  it("generates a stable Jekyll-safe slug with a non-empty fallback", () => {
    expect(slugify(" A guide to Jekyll & GitHub! ")).toBe(
      "a-guide-to-jekyll-github"
    );
    expect(slugify("!!!")).toBe("untitled-post");
  });

  it("joins normalized repository root paths without leading slashes", () => {
    expect(joinSitePath("/blog/", "_posts/example.md")).toBe(
      "blog/_posts/example.md"
    );
    expect(joinSitePath("/", "_drafts/example.md")).toBe(
      "_drafts/example.md"
    );
  });

  it("serializes front matter and markdown into a complete Jekyll document", () => {
    expect(
      serializeJekyllPost({ title: "Hello", tags: ["jekyll"] }, " Body ")
    ).toBe('---\ntitle: "Hello"\ntags: ["jekyll"]\n---\n\nBody\n');
  });

  it("extracts a repository content SHA only from valid commit responses", () => {
    expect(getCommittedSha({ content: { sha: "abc123" } })).toBe("abc123");
    expect(getCommittedSha({ content: {} })).toBeUndefined();
    expect(getCommittedSha(null)).toBeUndefined();
  });
});

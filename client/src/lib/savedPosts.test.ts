import { describe, expect, it } from "vitest";
import { mergePostFiles, restoreSavedPost } from "./savedPosts";
describe("saved post recovery", () => {
  it("includes Forge-only drafts and avoids duplicating files already on GitHub", () => {
    const remote = [
      {
        name: "existing.md",
        path: "_drafts/existing.md",
        sha: "abc",
        folder: "_drafts",
      },
    ];
    const files = mergePostFiles(remote, [
      { path: "_drafts/existing.md" },
      { path: "_drafts/new.md", title: "Forge smoke test" },
    ]);
    expect(files).toHaveLength(2);
    expect(files[1]).toMatchObject({
      name: "Forge smoke test",
      folder: "_drafts",
    });
  });
  it("restores an intentionally empty autosave instead of resurrecting older text", () => {
    expect(
      restoreSavedPost({
        markdown: "old",
        autosaveContent: "",
        frontMatter: { title: "Old" },
        autosaveFrontMatter: { title: "Latest" },
      })
    ).toEqual({ markdown: "", frontMatter: { title: "Latest" } });
  });
});

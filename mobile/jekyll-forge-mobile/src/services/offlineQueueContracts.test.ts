import {
  isPostDeleteInput,
  isPostUpdateInput,
  isPostUpsertInput,
  isRepositoryPublishQueueData,
  isSocialPublishQueueData,
} from "./offlineQueueContracts";

describe("offline publish queue contracts", () => {
  it("accepts a complete repository publishing payload", () => {
    expect(
      isRepositoryPublishQueueData({
        kind: "repository-post",
        commit: {
          owner: "owner",
          repo: "repo",
          path: "_posts/post.md",
          branch: "main",
          content: "post",
          message: "Publish post",
        },
        post: { siteId: 1, path: "_posts/post.md", status: "published" },
      })
    ).toBe(true);
  });

  it("accepts only valid social publish identifiers", () => {
    expect(
      isSocialPublishQueueData({
        kind: "social-content",
        repurposedContentId: 4,
        accountId: 8,
      })
    ).toBe(true);
    expect(
      isSocialPublishQueueData({
        kind: "social-content",
        repurposedContentId: "4",
        accountId: 8,
      })
    ).toBe(false);
  });

  it("rejects malformed CRUD payloads before they reach typed tRPC mutations", () => {
    expect(isPostUpsertInput({ siteId: 1, path: "_drafts/post.md" })).toBe(true);
    expect(isPostUpsertInput({ siteId: "1", path: "_drafts/post.md" })).toBe(false);
    expect(isPostUpdateInput({ id: 3, title: "Updated" })).toBe(true);
    expect(isPostDeleteInput({ id: 3 })).toBe(true);
    expect(isPostDeleteInput({ id: "3" })).toBe(false);
  });
});

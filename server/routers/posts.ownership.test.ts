import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getPostsBySiteId: vi.fn(),
  getSiteById: vi.fn(),
  getPostById: vi.fn(),
  upsertPost: vi.fn(),
  updatePost: vi.fn(),
  deletePost: vi.fn(),
  autosavePost: vi.fn(),
  getFrontMatterTemplates: vi.fn(),
}));

vi.mock("../db", () => mocks);

import { postsRouter } from "./posts";

function createCaller(userId = 7) {
  return postsRouter.createCaller({ user: { id: userId } } as never);
}

const postInput = { siteId: 9, path: "_drafts/new-post.md" };

describe("post upsert site ownership", () => {
  it("rejects an upsert for a site that is not owned by the caller", async () => {
    mocks.getSiteById.mockResolvedValueOnce(undefined);

    await expect(createCaller().upsert(postInput)).rejects.toThrow(
      "Site not found"
    );
    expect(mocks.upsertPost).not.toHaveBeenCalled();
  });

  it("persists an upsert only after caller-owned site verification", async () => {
    mocks.getSiteById.mockResolvedValueOnce({ id: 9, userId: 7 });
    mocks.upsertPost.mockResolvedValueOnce({ id: 15 });

    await expect(createCaller().upsert(postInput)).resolves.toEqual({ id: 15 });
    expect(mocks.getSiteById).toHaveBeenCalledWith(9, 7);
    expect(mocks.upsertPost).toHaveBeenCalledWith({ ...postInput, userId: 7 });
  });
});

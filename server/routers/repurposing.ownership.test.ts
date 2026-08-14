import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createRepurposedContent: vi.fn(),
  getRepurposedContentByPostId: vi.fn(),
  getRepurposedContentById: vi.fn(),
  updateRepurposedContent: vi.fn(),
  deleteRepurposedContent: vi.fn(),
  getPostById: vi.fn(),
  getAiSettings: vi.fn(),
  incrementAiUsage: vi.fn(),
  invokeLLM: vi.fn(),
  getRepurposingPrompt: vi.fn(),
  getFormatMetadata: vi.fn(),
}));

vi.mock("../db", () => ({
  createRepurposedContent: mocks.createRepurposedContent,
  getRepurposedContentByPostId: mocks.getRepurposedContentByPostId,
  getRepurposedContentById: mocks.getRepurposedContentById,
  updateRepurposedContent: mocks.updateRepurposedContent,
  deleteRepurposedContent: mocks.deleteRepurposedContent,
  getPostById: mocks.getPostById,
  getAiSettings: mocks.getAiSettings,
  incrementAiUsage: mocks.incrementAiUsage,
}));
vi.mock("../_core/llm", () => ({ invokeLLM: mocks.invokeLLM }));
vi.mock("../repurposingPrompts", () => ({
  getRepurposingPrompt: mocks.getRepurposingPrompt,
  getFormatMetadata: mocks.getFormatMetadata,
}));

import { repurposingRouter } from "./repurposing";

function createCaller(userId = 7) {
  return repurposingRouter.createCaller({ user: { id: userId } } as never);
}

describe("repurposing post-to-site ownership", () => {
  it("rejects generation when the caller-owned post is not in the requested site", async () => {
    mocks.getPostById.mockResolvedValueOnce({ id: 15, userId: 7, siteId: 10 });

    await expect(
      createCaller().generate({ postId: 15, siteId: 9, format: "twitter" })
    ).rejects.toThrow("Post not found");

    expect(mocks.invokeLLM).not.toHaveBeenCalled();
    expect(mocks.createRepurposedContent).not.toHaveBeenCalled();
  });

  it("does not delete existing content when regeneration has a mismatched post site", async () => {
    mocks.getRepurposedContentById.mockResolvedValueOnce({
      id: 12,
      userId: 7,
      siteId: 9,
      postId: 15,
      format: "twitter",
    });
    mocks.getPostById.mockResolvedValueOnce({ id: 15, userId: 7, siteId: 10 });

    await expect(
      createCaller().regenerate({ id: 12, postId: 15, siteId: 9 })
    ).rejects.toThrow("Post not found");

    expect(mocks.deleteRepurposedContent).not.toHaveBeenCalled();
  });
});

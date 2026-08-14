import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getPostById: vi.fn(),
  getContentVariations: vi.fn(),
  updateVariationStatus: vi.fn(),
  createContentVariation: vi.fn(),
  createAbTestResult: vi.fn(),
  updateAbTestMetrics: vi.fn(),
  getAbTestResults: vi.fn(),
  createAbTestSummary: vi.fn(),
  updateAbTestSummary: vi.fn(),
  getAbTestSummary: vi.fn(),
}));

vi.mock("../db", () => mocks);
vi.mock("../variationGenerator", () => ({
  generatePostVariations: vi.fn(),
  determineWinner: vi.fn(),
}));

import { abTestingRouter } from "./abTesting";

function createCaller(userId = 7) {
  return abTestingRouter.createCaller({ user: { id: userId } } as never);
}

describe("A/B testing ownership safeguards", () => {
  it("rejects reads for a post that is not owned by the caller", async () => {
    mocks.getPostById.mockResolvedValueOnce(undefined);

    await expect(createCaller().getVariations({ postId: 42 })).rejects.toThrow(
      "Post not found"
    );
    expect(mocks.getContentVariations).not.toHaveBeenCalled();
  });

  it("passes the caller identity to A/B variation reads after ownership is confirmed", async () => {
    mocks.getPostById.mockResolvedValueOnce({ id: 42, userId: 7 });
    mocks.getContentVariations.mockResolvedValueOnce([]);

    await expect(
      createCaller(7).getVariations({ postId: 42 })
    ).resolves.toEqual([]);
    expect(mocks.getPostById).toHaveBeenCalledWith(42, 7);
    expect(mocks.getContentVariations).toHaveBeenCalledWith(42, 7);
  });
});

import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createSnapshot: vi.fn(),
  getSnapshotsByPost: vi.fn(),
  getSnapshotById: vi.fn(),
  getSiteById: vi.fn(),
  getPostById: vi.fn(),
}));

vi.mock("../db", () => mocks);

import { snapshotsRouter } from "./snapshots";

function createCaller(userId = 7) {
  return snapshotsRouter.createCaller({ user: { id: userId } } as never);
}

const snapshotInput = {
  siteId: 9,
  postId: 15,
  label: "Before revision",
  reason: "manual" as const,
};

describe("snapshot reference ownership", () => {
  it("rejects snapshot creation for an unowned site", async () => {
    mocks.getSiteById.mockResolvedValueOnce(undefined);

    await expect(createCaller().create(snapshotInput)).rejects.toThrow(
      "Site not found"
    );
    expect(mocks.createSnapshot).not.toHaveBeenCalled();
  });

  it("rejects a post that does not belong to the caller-owned site", async () => {
    mocks.getSiteById.mockResolvedValueOnce({ id: 9, userId: 7 });
    mocks.getPostById.mockResolvedValueOnce({ id: 15, userId: 7, siteId: 10 });

    await expect(createCaller().create(snapshotInput)).rejects.toThrow(
      "Post not found"
    );
    expect(mocks.createSnapshot).not.toHaveBeenCalled();
  });

  it("creates a snapshot only after site and post ownership are confirmed", async () => {
    mocks.getSiteById.mockResolvedValueOnce({ id: 9, userId: 7 });
    mocks.getPostById.mockResolvedValueOnce({ id: 15, userId: 7, siteId: 9 });
    mocks.createSnapshot.mockResolvedValueOnce(22);

    await expect(createCaller().create(snapshotInput)).resolves.toBe(22);
    expect(mocks.getSiteById).toHaveBeenCalledWith(9, 7);
    expect(mocks.getPostById).toHaveBeenCalledWith(15, 7);
    expect(mocks.createSnapshot).toHaveBeenCalledWith({
      ...snapshotInput,
      userId: 7,
    });
  });
});

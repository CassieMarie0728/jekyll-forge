import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "../_core/context";

const dbMocks = vi.hoisted(() => ({
  createScheduledPost: vi.fn(),
  getSiteById: vi.fn(),
  getScheduledPostsBySite: vi.fn(),
  getScheduledPostById: vi.fn(),
  updateScheduledPost: vi.fn(),
}));

vi.mock("../db", () => dbMocks);
vi.mock("../_core/heartbeat", () => ({
  createHeartbeatJob: vi.fn(),
  deleteHeartbeatJob: vi.fn(),
  listHeartbeatJobs: vi.fn(),
}));
vi.mock("../_core/notification", () => ({ notifyOwner: vi.fn() }));

import { schedulerRouter } from "./scheduler";

function createContext(userId = 7): TrpcContext {
  return {
    user: {
      id: userId,
      openId: `user-${userId}`,
      name: "Audit User",
      email: "audit@example.com",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("scheduler ownership safeguards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects markPublished when the scheduled post is not owned by the caller", async () => {
    dbMocks.getScheduledPostById.mockResolvedValue(undefined);
    const caller = schedulerRouter.createCaller(createContext());

    await expect(caller.markPublished({ id: 42 })).rejects.toThrow(
      "Scheduled post not found"
    );
    expect(dbMocks.getScheduledPostById).toHaveBeenCalledWith(42, 7);
    expect(dbMocks.updateScheduledPost).not.toHaveBeenCalled();
  });

  it("updates only a caller-owned scheduled post when marking it published", async () => {
    dbMocks.getScheduledPostById.mockResolvedValue({ id: 42, userId: 7 });
    const caller = schedulerRouter.createCaller(createContext());

    await expect(caller.markPublished({ id: 42 })).resolves.toEqual({
      success: true,
    });
    expect(dbMocks.updateScheduledPost).toHaveBeenCalledWith(
      42,
      expect.objectContaining({
        status: "published",
        publishedAt: expect.any(Date),
      })
    );
  });

  it("rejects scheduling against a site that is not owned by the caller", async () => {
    dbMocks.getSiteById.mockResolvedValue(undefined);
    const caller = schedulerRouter.createCaller(createContext());

    await expect(
      caller.schedule({
        siteId: 99,
        draftPath: "_drafts/a.md",
        targetPath: "_posts/2026-08-12-a.md",
        scheduledAt: new Date(Date.now() + 60_000),
      })
    ).rejects.toThrow("Site not found");
    expect(dbMocks.createScheduledPost).not.toHaveBeenCalled();
  });

  it("rejects rescheduling a scheduled post that is not owned by the caller", async () => {
    dbMocks.getScheduledPostById.mockResolvedValue(undefined);
    const caller = schedulerRouter.createCaller(createContext());

    await expect(
      caller.reschedule({
        id: 42,
        scheduledAt: new Date(Date.now() + 60_000),
      })
    ).rejects.toThrow("Scheduled post not found");
    expect(dbMocks.getScheduledPostById).toHaveBeenCalledWith(42, 7);
    expect(dbMocks.updateScheduledPost).not.toHaveBeenCalled();
  });

  it("rejects rescheduling to a time in the past", async () => {
    dbMocks.getScheduledPostById.mockResolvedValue({
      id: 42,
      userId: 7,
      status: "pending",
      timezone: "UTC",
    });
    const caller = schedulerRouter.createCaller(createContext());

    await expect(
      caller.reschedule({
        id: 42,
        scheduledAt: new Date(Date.now() - 60_000),
      })
    ).rejects.toThrow("Scheduled publish time must be in the future");
    expect(dbMocks.updateScheduledPost).not.toHaveBeenCalled();
  });
});

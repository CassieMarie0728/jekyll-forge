jest.mock("./syncService", () => ({
  syncService: { queueAction: jest.fn().mockResolvedValue(undefined) },
}));

import { syncService } from "./syncService";
import {
  enqueuePostStatusUpdate,
  enqueueRepositoryPublish,
  enqueueAbVariationPublish,
  enqueueSchedulerCancel,
  enqueueSchedulerReschedule,
  enqueueSocialDisconnect,
  enqueueSocialPublish,
} from "./offlineQueueProducers";

describe("offline queue producers", () => {
  beforeEach(() => jest.clearAllMocks());

  it("queues repository publication with the publish action", async () => {
    const payload = {
      kind: "repository-post" as const,
      commit: {
        owner: "owner",
        repo: "repo",
        path: "_posts/post.md",
        branch: "main",
        content: "content",
        message: "Publish post",
      },
      post: { siteId: 1, path: "_posts/post.md", status: "published" as const },
    };
    await enqueueRepositoryPublish(payload);
    expect(syncService.queueAction).toHaveBeenCalledWith("publish", payload);
  });

  it("queues social publication and post-status updates with their typed actions", async () => {
    const socialPayload = {
      kind: "social-content" as const,
      repurposedContentId: 3,
      accountId: 8,
    };
    const updatePayload = { id: 5, status: "draft" as const };
    await enqueueSocialPublish(socialPayload);
    await enqueuePostStatusUpdate(updatePayload);
    expect(syncService.queueAction).toHaveBeenNthCalledWith(
      1,
      "publish",
      socialPayload
    );
    expect(syncService.queueAction).toHaveBeenNthCalledWith(
      2,
      "update",
      updatePayload
    );
  });

  it("queues scheduler cancellation and serializes a reschedule time for persistence", async () => {
    const scheduledAt = new Date("2026-09-01T12:00:00.000Z");
    await enqueueSchedulerCancel(14);
    await enqueueSchedulerReschedule(14, scheduledAt);
    expect(syncService.queueAction).toHaveBeenNthCalledWith(
      1,
      "scheduler-cancel",
      { id: 14 }
    );
    expect(syncService.queueAction).toHaveBeenNthCalledWith(
      2,
      "scheduler-reschedule",
      { id: 14, scheduledAt: "2026-09-01T12:00:00.000Z" }
    );
  });

  it("queues social disconnection and each A/B variation publication with typed actions", async () => {
    const variationPayload = {
      postId: 6,
      variationIndex: 2,
      platforms: ["twitter", "linkedin"] as const,
    };
    await enqueueSocialDisconnect({ id: 9 });
    await enqueueAbVariationPublish({
      ...variationPayload,
      platforms: [...variationPayload.platforms],
    });
    expect(syncService.queueAction).toHaveBeenNthCalledWith(
      1,
      "social-disconnect",
      { id: 9 }
    );
    expect(syncService.queueAction).toHaveBeenNthCalledWith(
      2,
      "ab-publish-variation",
      { ...variationPayload, platforms: [...variationPayload.platforms] }
    );
  });
});

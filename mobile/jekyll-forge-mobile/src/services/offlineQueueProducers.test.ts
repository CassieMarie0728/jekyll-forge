jest.mock("./syncService", () => ({
  syncService: { queueAction: jest.fn().mockResolvedValue(undefined) },
}));

import { syncService } from "./syncService";
import {
  enqueuePostStatusUpdate,
  enqueueRepositoryPublish,
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
});

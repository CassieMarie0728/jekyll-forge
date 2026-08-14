import type { getTrpcClient } from "../utils/trpc";
import type { SyncQueue } from "./offlineStorage";
import { replayOfflineQueueItem } from "./offlineReplayDispatcher";

const postUpsert = jest.fn().mockResolvedValue(undefined);
const postUpdate = jest.fn().mockResolvedValue(undefined);
const postDelete = jest.fn().mockResolvedValue(undefined);
const commitFile = jest.fn().mockResolvedValue({ content: { sha: "new-sha" } });
const deleteFile = jest.fn().mockResolvedValue(undefined);
const publishContent = jest.fn().mockResolvedValue(undefined);
const disconnectAccount = jest.fn().mockResolvedValue(undefined);
const cancelSchedule = jest.fn().mockResolvedValue(undefined);
const reschedule = jest.fn().mockResolvedValue(undefined);
const publishVariation = jest.fn().mockResolvedValue(undefined);

const client = {
  posts: {
    upsert: { mutate: postUpsert },
    update: { mutate: postUpdate },
    delete: { mutate: postDelete },
  },
  github: {
    commitFile: { mutate: commitFile },
    deleteFile: { mutate: deleteFile },
  },
  socialMedia: {
    publishContent: { mutate: publishContent },
    disconnectAccount: { mutate: disconnectAccount },
  },
  scheduler: {
    cancel: { mutate: cancelSchedule },
    reschedule: { mutate: reschedule },
  },
  abTesting: { publishVariation: { mutate: publishVariation } },
} as unknown as ReturnType<typeof getTrpcClient>;

function item(action: SyncQueue["action"], data: unknown): SyncQueue {
  return {
    id: "queue-item",
    action,
    data,
    timestamp: 0,
    retries: 0,
    status: "pending",
  };
}

describe("offline replay dispatcher", () => {
  beforeEach(() => jest.clearAllMocks());

  it("replays post create, update, and delete actions through their post mutations", async () => {
    await replayOfflineQueueItem(
      client,
      item("create", { siteId: 1, path: "_drafts/post.md" })
    );
    await replayOfflineQueueItem(client, item("update", { id: 3, title: "Updated" }));
    await replayOfflineQueueItem(client, item("delete", { id: 3 }));

    expect(postUpsert).toHaveBeenCalledWith({ siteId: 1, path: "_drafts/post.md" });
    expect(postUpdate).toHaveBeenCalledWith({ id: 3, title: "Updated" });
    expect(postDelete).toHaveBeenCalledWith({ id: 3 });
  });

  it("replays repository and social publish actions through their appropriate mutations", async () => {
    const commit = {
      owner: "owner",
      repo: "repo",
      path: "_posts/post.md",
      branch: "main",
      content: "post",
      message: "Publish post",
    };
    await replayOfflineQueueItem(
      client,
      item("publish", {
        kind: "repository-post",
        commit,
        post: { siteId: 1, path: "_posts/post.md", status: "published" },
      })
    );
    await replayOfflineQueueItem(
      client,
      item("publish", {
        kind: "social-content",
        repurposedContentId: 4,
        accountId: 9,
      })
    );

    expect(commitFile).toHaveBeenCalledWith(commit);
    expect(postUpsert).toHaveBeenCalledWith({
      siteId: 1,
      path: "_posts/post.md",
      status: "published",
      sha: "new-sha",
    });
    expect(publishContent).toHaveBeenCalledWith({ repurposedContentId: 4, accountId: 9 });
  });

  it("replays scheduler, account, and A/B operations with persisted payloads", async () => {
    await replayOfflineQueueItem(client, item("scheduler-cancel", { id: 12 }));
    await replayOfflineQueueItem(
      client,
      item("scheduler-reschedule", {
        id: 12,
        scheduledAt: "2026-09-01T12:00:00.000Z",
      })
    );
    await replayOfflineQueueItem(client, item("social-disconnect", { id: 8 }));
    await replayOfflineQueueItem(
      client,
      item("ab-publish-variation", {
        postId: 2,
        variationIndex: 1,
        platforms: ["twitter", "linkedin"],
      })
    );

    expect(cancelSchedule).toHaveBeenCalledWith({ id: 12 });
    expect(reschedule).toHaveBeenCalledWith({
      id: 12,
      scheduledAt: new Date("2026-09-01T12:00:00.000Z"),
    });
    expect(disconnectAccount).toHaveBeenCalledWith({ id: 8 });
    expect(publishVariation).toHaveBeenCalledWith({
      postId: 2,
      variationIndex: 1,
      platforms: ["twitter", "linkedin"],
    });
  });

  it("rejects malformed persisted data instead of dispatching an unintended mutation", async () => {
    await expect(
      replayOfflineQueueItem(client, item("scheduler-reschedule", { id: 12 }))
    ).rejects.toThrow("Offline scheduler reschedule payload is invalid.");
    expect(reschedule).not.toHaveBeenCalled();
  });
});

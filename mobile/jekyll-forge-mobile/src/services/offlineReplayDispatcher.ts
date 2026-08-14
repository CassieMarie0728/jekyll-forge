import type { getTrpcClient } from "../utils/trpc";
import type { SyncQueue } from "./offlineStorage";
import {
  isAbVariationPublishQueueData,
  isPostDeleteInput,
  isPostUpdateInput,
  isPostUpsertInput,
  isRepositoryPublishQueueData,
  isSchedulerCancelQueueData,
  isSchedulerRescheduleQueueData,
  isSocialDisconnectQueueData,
  isSocialPublishQueueData,
} from "./offlineQueueContracts";

type TrpcClient = ReturnType<typeof getTrpcClient>;

export async function replayOfflineQueueItem(
  trpcClient: TrpcClient,
  item: SyncQueue
) {
  switch (item.action) {
    case "create":
      if (!isPostUpsertInput(item.data)) {
        throw new Error("Offline create payload is invalid.");
      }
      await trpcClient.posts.upsert.mutate(item.data);
      return;
    case "update":
      if (!isPostUpdateInput(item.data)) {
        throw new Error("Offline update payload is invalid.");
      }
      await trpcClient.posts.update.mutate(item.data);
      return;
    case "publish": {
      if (isRepositoryPublishQueueData(item.data)) {
        const commit = await trpcClient.github.commitFile.mutate(item.data.commit);
        const sha =
          commit &&
          typeof commit === "object" &&
          "content" in commit &&
          commit.content &&
          typeof commit.content === "object" &&
          "sha" in commit.content &&
          typeof commit.content.sha === "string"
            ? commit.content.sha
            : item.data.post.sha;
        await trpcClient.posts.upsert.mutate({ ...item.data.post, sha });
        if (item.data.priorDraft?.sha) {
          await trpcClient.github.deleteFile.mutate({
            owner: item.data.commit.owner,
            repo: item.data.commit.repo,
            path: item.data.priorDraft.path,
            branch: item.data.commit.branch,
            sha: item.data.priorDraft.sha,
            message: `Remove draft after publishing ${item.data.post.title || "post"}`,
          });
          await trpcClient.posts.delete.mutate({ id: item.data.priorDraft.postId });
        }
        return;
      }
      if (isSocialPublishQueueData(item.data)) {
        await trpcClient.socialMedia.publishContent.mutate({
          repurposedContentId: item.data.repurposedContentId,
          accountId: item.data.accountId,
        });
        return;
      }
      throw new Error("Offline publish payload is invalid.");
    }
    case "delete":
      if (!isPostDeleteInput(item.data)) {
        throw new Error("Offline delete payload is invalid.");
      }
      await trpcClient.posts.delete.mutate(item.data);
      return;
    case "scheduler-cancel":
      if (!isSchedulerCancelQueueData(item.data)) {
        throw new Error("Offline scheduler cancellation payload is invalid.");
      }
      await trpcClient.scheduler.cancel.mutate(item.data);
      return;
    case "scheduler-reschedule":
      if (!isSchedulerRescheduleQueueData(item.data)) {
        throw new Error("Offline scheduler reschedule payload is invalid.");
      }
      await trpcClient.scheduler.reschedule.mutate({
        id: item.data.id,
        scheduledAt: new Date(item.data.scheduledAt),
      });
      return;
    case "social-disconnect":
      if (!isSocialDisconnectQueueData(item.data)) {
        throw new Error("Offline social disconnect payload is invalid.");
      }
      await trpcClient.socialMedia.disconnectAccount.mutate(item.data);
      return;
    case "ab-publish-variation":
      if (!isAbVariationPublishQueueData(item.data)) {
        throw new Error("Offline A/B publication payload is invalid.");
      }
      await trpcClient.abTesting.publishVariation.mutate(item.data);
      return;
    default:
      throw new Error(`Unsupported offline action: ${String(item.action)}`);
  }
}

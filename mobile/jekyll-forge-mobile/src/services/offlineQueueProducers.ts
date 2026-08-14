import type { MobilePostUpdateInput } from "../hooks/usePosts";
import type {
  RepositoryPublishQueueData,
  SocialPublishQueueData,
} from "./offlineQueueContracts";
import { syncService } from "./syncService";

export function enqueueRepositoryPublish(payload: RepositoryPublishQueueData) {
  return syncService.queueAction("publish", payload);
}

export function enqueueSocialPublish(payload: SocialPublishQueueData) {
  return syncService.queueAction("publish", payload);
}

export function enqueuePostStatusUpdate(payload: MobilePostUpdateInput) {
  return syncService.queueAction("update", payload);
}

import type { MobilePostUpdateInput } from "../hooks/usePosts";
import type {
  AbVariationPublishQueueData,
  RepositoryPublishQueueData,
  SocialDisconnectQueueData,
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

export function enqueueSchedulerCancel(id: number) {
  return syncService.queueAction("scheduler-cancel", { id });
}

export function enqueueSchedulerReschedule(id: number, scheduledAt: Date) {
  return syncService.queueAction("scheduler-reschedule", {
    id,
    scheduledAt: scheduledAt.toISOString(),
  });
}

export function enqueueSocialDisconnect(payload: SocialDisconnectQueueData) {
  return syncService.queueAction("social-disconnect", payload);
}

export function enqueueAbVariationPublish(payload: AbVariationPublishQueueData) {
  return syncService.queueAction("ab-publish-variation", payload);
}

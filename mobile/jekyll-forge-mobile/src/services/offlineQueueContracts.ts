import type {
  MobilePostUpdateInput,
  MobilePostUpsertInput,
} from "../hooks/usePosts";

export function isPostUpsertInput(value: unknown): value is MobilePostUpsertInput {
  if (!value || typeof value !== "object") return false;
  const payload = value as { siteId?: unknown; path?: unknown };
  return typeof payload.siteId === "number" && typeof payload.path === "string";
}

export function isPostUpdateInput(value: unknown): value is MobilePostUpdateInput {
  return (
    Boolean(value) &&
    typeof value === "object" &&
    typeof (value as { id?: unknown }).id === "number"
  );
}

export function isPostDeleteInput(value: unknown): value is { id: number } {
  return (
    Boolean(value) &&
    typeof value === "object" &&
    typeof (value as { id?: unknown }).id === "number"
  );
}

export type RepositoryPublishQueueData = {
  kind: "repository-post";
  commit: {
    owner: string;
    repo: string;
    path: string;
    branch: string;
    content: string;
    message: string;
    sha?: string;
  };
  post: MobilePostUpsertInput;
  priorDraft?: {
    postId: number;
    path: string;
    sha?: string;
  };
};

export type SocialPublishQueueData = {
  kind: "social-content";
  repurposedContentId: number;
  accountId: number;
};

export type OfflinePublishQueueData =
  | RepositoryPublishQueueData
  | SocialPublishQueueData;

export type SchedulerCancelQueueData = {
  id: number;
};

export type SchedulerRescheduleQueueData = {
  id: number;
  scheduledAt: string;
};

export function isRepositoryPublishQueueData(
  value: unknown
): value is RepositoryPublishQueueData {
  if (!value || typeof value !== "object") return false;
  const payload = value as { kind?: unknown; commit?: unknown; post?: unknown };
  return (
    payload.kind === "repository-post" &&
    Boolean(payload.commit && typeof payload.commit === "object") &&
    Boolean(payload.post && typeof payload.post === "object")
  );
}

export function isSocialPublishQueueData(
  value: unknown
): value is SocialPublishQueueData {
  if (!value || typeof value !== "object") return false;
  const payload = value as {
    kind?: unknown;
    repurposedContentId?: unknown;
    accountId?: unknown;
  };
  return (
    payload.kind === "social-content" &&
    typeof payload.repurposedContentId === "number" &&
    typeof payload.accountId === "number"
  );
}

export function isSchedulerCancelQueueData(
  value: unknown
): value is SchedulerCancelQueueData {
  return isPostDeleteInput(value);
}

export function isSchedulerRescheduleQueueData(
  value: unknown
): value is SchedulerRescheduleQueueData {
  if (!value || typeof value !== "object") return false;
  const payload = value as { id?: unknown; scheduledAt?: unknown };
  return (
    typeof payload.id === "number" &&
    typeof payload.scheduledAt === "string" &&
    !Number.isNaN(new Date(payload.scheduledAt).getTime())
  );
}

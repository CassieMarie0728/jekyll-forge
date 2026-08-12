import { trpc } from "../utils/trpc";

export type MobilePostStatus =
  | "draft"
  | "published"
  | "modified"
  | "new"
  | "scheduled"
  | "archived";

export type MobilePostUpsertInput = {
  siteId: number;
  path: string;
  filename?: string;
  slug?: string;
  title?: string;
  status?: MobilePostStatus;
  frontMatter?: Record<string, unknown>;
  markdown?: string;
  sha?: string;
  scheduledAt?: Date;
};

export type MobilePostUpdateInput = Omit<
  MobilePostUpsertInput,
  "siteId" | "path"
> & {
  id: number;
  scheduledAt?: Date | null;
};

export function usePosts(siteId: number | null | undefined) {
  return trpc.posts.list.useQuery(
    { siteId: siteId ?? 0 },
    { enabled: typeof siteId === "number" && siteId > 0 }
  );
}

export function usePost(postId: number | null | undefined) {
  return trpc.posts.get.useQuery(
    { id: postId ?? 0 },
    { enabled: typeof postId === "number" && postId > 0 }
  );
}

export function useCreatePost() {
  return trpc.posts.upsert.useMutation();
}

export function useUpdatePost() {
  return trpc.posts.update.useMutation();
}

export function useDeletePost() {
  return trpc.posts.delete.useMutation();
}

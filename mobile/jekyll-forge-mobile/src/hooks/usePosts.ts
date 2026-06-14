import { trpc } from '../utils/trpc';

export function usePosts(siteId: string) {
  return trpc.posts.list.useQuery({ siteId });
}

export function usePost(postId: string) {
  return trpc.posts.getById.useQuery({ id: postId });
}

export function useCreatePost() {
  return trpc.posts.create.useMutation();
}

export function useUpdatePost() {
  return trpc.posts.update.useMutation();
}

export function usePublishPost() {
  return trpc.posts.publish.useMutation();
}

export function useDeletePost() {
  return trpc.posts.delete.useMutation();
}

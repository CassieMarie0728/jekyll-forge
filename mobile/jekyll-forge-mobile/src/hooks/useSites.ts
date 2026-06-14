import { trpc } from '../utils/trpc';

export function useSites() {
  return trpc.sites.list.useQuery();
}

export function useSite(siteId: string) {
  return trpc.sites.getById.useQuery({ id: siteId });
}

export function useCreateSite() {
  return trpc.sites.create.useMutation();
}

export function useUpdateSite() {
  return trpc.sites.update.useMutation();
}

export function useDeleteSite() {
  return trpc.sites.delete.useMutation();
}

export function usePublishSite() {
  return trpc.sites.publish.useMutation();
}

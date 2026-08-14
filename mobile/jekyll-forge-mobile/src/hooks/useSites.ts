import { trpc } from "../utils/trpc";

export function useSites() {
  return trpc.sites.list.useQuery();
}

export function useSite(siteId: number | null | undefined) {
  return trpc.sites.get.useQuery(
    { id: siteId ?? 0 },
    { enabled: typeof siteId === "number" && siteId > 0 }
  );
}

export function useCreateSite() {
  return trpc.sites.upsert.useMutation();
}

export function useUpdateSite() {
  return trpc.sites.update.useMutation();
}

export function useDeleteSite() {
  return trpc.sites.delete.useMutation();
}

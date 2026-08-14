import { trpc } from "../utils/trpc";

export function useAssets(siteId: number | null | undefined) {
  return trpc.assets.list.useQuery(
    { siteId: siteId ?? 0 },
    { enabled: typeof siteId === "number" && siteId > 0 }
  );
}

export function useUploadAsset() {
  return trpc.assets.upload.useMutation();
}

export function useDeleteAsset() {
  return trpc.assets.delete.useMutation();
}

export function useReoptimizeAsset() {
  return trpc.assets.reoptimize.useMutation();
}

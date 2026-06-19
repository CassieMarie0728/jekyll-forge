import { trpc } from "../utils/trpc";

export function useAssets(siteId: string) {
  return trpc.assets.list.useQuery({ siteId });
}

export function useUploadAsset() {
  return trpc.assets.upload.useMutation();
}

export function useDeleteAsset() {
  return trpc.assets.delete.useMutation();
}

export function useOptimizeAsset() {
  return trpc.assets.optimize.useMutation();
}

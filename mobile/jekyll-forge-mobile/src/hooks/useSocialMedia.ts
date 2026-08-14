import { trpc } from "../utils/trpc";

export function useConnectedAccounts() {
  return trpc.socialMedia.getAccounts.useQuery();
}

export function useConnectAccount() {
  return trpc.socialMedia.connectAccount.useMutation();
}

export function useDisconnectAccount() {
  return trpc.socialMedia.disconnectAccount.useMutation();
}

export function usePublishContent() {
  return trpc.socialMedia.publishContent.useMutation();
}

export type SocialPlatform =
  | "twitter"
  | "linkedin"
  | "facebook"
  | "instagram";

export function useGetAnalytics(platform: SocialPlatform | null | undefined) {
  return trpc.socialMedia.getAnalyticsByPlatform.useQuery(
    { platform: platform ?? "twitter" },
    { enabled: Boolean(platform) }
  );
}

export function useSyncAnalytics() {
  return trpc.socialMedia.syncAnalytics.useMutation();
}

export function useGetAnalyticsSummary() {
  return trpc.socialMedia.getAnalyticsSummary.useQuery();
}

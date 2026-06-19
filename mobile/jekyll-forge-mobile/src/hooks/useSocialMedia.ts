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

export function useGetAnalytics(siteId: string) {
  return trpc.socialMedia.getAnalytics.useQuery({ siteId });
}

export function useSyncAnalytics() {
  return trpc.socialMedia.syncAnalytics.useMutation();
}

export function useGetAnalyticsSummary(siteId: string) {
  return trpc.socialMedia.getAnalyticsSummary.useQuery({ siteId });
}

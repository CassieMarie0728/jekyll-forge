export const DEFAULT_MOBILE_API_BASE_URL = "https://jekyllforge.manus.space";

export function getMobileApiBaseUrl(configuredUrl?: string): string {
  const source = configuredUrl?.trim() || DEFAULT_MOBILE_API_BASE_URL;
  return source.replace(/\/api\/trpc\/?$/, "").replace(/\/$/, "");
}

export function getMobileTrpcUrl(configuredUrl?: string): string {
  return `${getMobileApiBaseUrl(configuredUrl)}/api/trpc`;
}

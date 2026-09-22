export function getMobileApiBaseUrl(configuredUrl?: string): string {
  const source = configuredUrl?.trim();
  if (!source)
    throw new Error(
      "Set EXPO_PUBLIC_API_URL to your deployed Jekyll Forge app URL before building the mobile app."
    );
  const url = new URL(source);
  if (url.protocol !== "https:" && url.protocol !== "http:")
    throw new Error("Invalid app URL");
  return source.replace(/\/api\/trpc\/?$/, "").replace(/\/$/, "");
}
export function getMobileTrpcUrl(configuredUrl?: string): string {
  return `${getMobileApiBaseUrl(configuredUrl)}/api/trpc`;
}

import { sdk } from "./sdk";
import { getAssetById, getSiteById } from "../db";

// GitHub private download URLs expire. Read through the owner's credentials;
// never put those URLs or credentials into published Markdown.
export async function serveRepositoryAsset(request: Request, id: number) {
  if (request.method !== "GET") return new Response(null, { status: 405 });
  const user = await sdk
    .authenticateRequest({
      headers: {
        cookie: request.headers.get("cookie") ?? undefined,
        authorization: request.headers.get("authorization") ?? undefined,
      },
    })
    .catch(() => null);
  if (!user?.githubToken) return new Response(null, { status: 401 });
  const asset = await getAssetById(id, user.id);
  if (!asset?.storageKey) return new Response(null, { status: 404 });
  const site = await getSiteById(asset.siteId, user.id);
  if (!site) return new Response(null, { status: 404 });
  const path = asset.storageKey.split("/").map(encodeURIComponent).join("/");
  const branch =
    asset.branch || site.selectedBranch || site.defaultBranch || "main";
  const upstream = await fetch(
    `https://api.github.com/repos/${encodeURIComponent(site.owner)}/${encodeURIComponent(site.repo)}/contents/${path}?ref=${encodeURIComponent(branch)}`,
    {
      headers: {
        Authorization: `Bearer ${user.githubToken}`,
        Accept: "application/vnd.github.raw+json",
        "User-Agent": "Jekyll-Forge",
      },
      signal: AbortSignal.timeout(20000),
    }
  );
  if (!upstream.ok)
    return new Response(null, { status: upstream.status === 404 ? 404 : 502 });
  const mime = asset.mimeType || "application/octet-stream";
  return new Response(upstream.body, {
    headers: {
      "Content-Type": mime,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "sandbox; default-src 'none'",
      "Content-Disposition":
        /^(image\/(png|jpeg|gif|webp)|audio\/|video\/)/.test(mime)
          ? "inline"
          : "attachment",
    },
  });
}

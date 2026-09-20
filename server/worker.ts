import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { serialize } from "cookie";
import { appRouter } from "./routers";
import { createContext } from "./_core/context";
import { handleOAuthRequest } from "./_core/oauth";
import { withRuntime } from "./_core/runtime";
import { processScheduledPosts } from "./scheduledPublishHandler";
import { processPendingScheduledSocialPosts } from "./_core/scheduledSocialPostsHandler";
import { consumeLimit } from "./_core/limits";
import { serveRepositoryAsset } from "./_core/repositoryAsset";

export default {
  async fetch(request: Request, env) {
    return withRuntime(env, async () => {
      const url = new URL(request.url);
      if (url.pathname === "/api/health")
        return Response.json({ ok: true, platform: "cloudflare" });
      if (!url.pathname.startsWith("/api/")) return env.ASSETS.fetch(request);
      const origin = request.headers.get("origin");
      if (origin && origin !== url.origin)
        return Response.json({ error: "Origin not allowed" }, { status: 403 });
      if (
        request.method === "POST" &&
        !request.headers.get("content-type")?.startsWith("application/json")
      ) {
        return Response.json({ error: "JSON required" }, { status: 415 });
      }
      // Check the streamed body too: Content-Length is absent on chunked input.
      if (request.body) {
        const reader = request.body.getReader();
        const chunks: Uint8Array[] = [];
        let size = 0;
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          size += value.byteLength;
          if (size > 8 * 1024 * 1024) {
            await reader.cancel();
            return Response.json(
              { error: "Request body exceeds 8 MB" },
              { status: 413 }
            );
          }
          chunks.push(value);
        }
        const body = new Uint8Array(size);
        let offset = 0;
        for (const chunk of chunks) {
          body.set(chunk, offset);
          offset += chunk.byteLength;
        }
        request = new Request(request, { body });
      }
      const isAuth = url.pathname.startsWith("/api/oauth/");
      const ip = request.headers.get("CF-Connecting-IP") ?? "local";
      if (
        !(await consumeLimit(
          `http:${isAuth ? "auth" : "api"}:${ip}`,
          isAuth ? 20 : 200,
          60
        ))
      ) {
        return Response.json(
          { error: "Too many requests" },
          { status: 429, headers: { "Retry-After": "60" } }
        );
      }
      let response: Response;
      if (isAuth) {
        response = await handleOAuthRequest(request);
      } else if (/^\/api\/assets\/\d+$/.test(url.pathname)) {
        response = await serveRepositoryAsset(
          request,
          Number(url.pathname.split("/").pop())
        );
      } else if (url.pathname.startsWith("/api/trpc/")) {
        response = await fetchRequestHandler({
          endpoint: "/api/trpc",
          req: request,
          router: appRouter,
          createContext: ({ resHeaders }) =>
            createContext({
              req: {
                protocol: url.protocol.replace(":", ""),
                headers: {
                  authorization:
                    request.headers.get("authorization") ?? undefined,
                  cookie: request.headers.get("cookie") ?? undefined,
                },
              },
              res: {
                clearCookie: (name, options) =>
                  resHeaders.append(
                    "Set-Cookie",
                    serialize(name, "", {
                      ...options,
                      maxAge: 0,
                      expires: new Date(0),
                    })
                  ),
              },
            }),
        });
      } else
        response = Response.json(
          { error: "API route not found" },
          { status: 404 }
        );
      response.headers.set("Cache-Control", "no-store");
      response.headers.set("X-Content-Type-Options", "nosniff");
      return response;
    });
  },
  async scheduled(_controller, env, ctx) {
    ctx.waitUntil(
      withRuntime(env, async () => {
        await processScheduledPosts();
        await processPendingScheduledSocialPosts();
        await env.DB.prepare("DELETE FROM rate_windows WHERE expiresAt < ?")
          .bind(Math.floor(Date.now() / 1000))
          .run();
        await env.DB.prepare(
          "DELETE FROM mobile_auth_codes WHERE expiresAt < ?"
        )
          .bind(Math.floor(Date.now() / 1000))
          .run();
      })
    );
  },
} satisfies ExportedHandler<CloudflareBindings>;

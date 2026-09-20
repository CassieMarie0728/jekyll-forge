import { COOKIE_NAME } from "@shared/const";
import { randomBytes, timingSafeEqual } from "node:crypto";
import { parse, serialize } from "cookie";
import { SignJWT, jwtVerify } from "jose";
import * as db from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { getSessionCookieOptions } from "./cookies";
import { sdk, sessionKey } from "./sdk";
import { getRuntimeEnv } from "./runtime";

const STATE_COOKIE = "forge_oauth_state";
const CALLBACK = "/api/oauth/callback";
export function appOrigin(): string {
  const url = new URL(getRuntimeEnv().APP_URL);
  if (
    url.protocol !== "https:" &&
    !(
      url.protocol === "http:" &&
      ["localhost", "127.0.0.1"].includes(url.hostname)
    )
  ) {
    throw new Error("APP_URL must use HTTPS outside local development");
  }
  return url.origin;
}
const cookieOptions = (request: Request) =>
  getSessionCookieOptions({
    protocol: new URL(request.url).protocol.replace(":", ""),
  });
async function start(request: Request, mobile: boolean) {
  const env = getRuntimeEnv();
  if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) {
    return Response.json(
      { error: "GitHub sign-in is not configured yet" },
      { status: 503 }
    );
  }
  const nonce = randomBytes(32).toString("base64url");
  const state = await new SignJWT({ nonce, mobile })
    .setProtectedHeader({ alg: "HS256" })
    .setAudience("github-oauth")
    .setIssuedAt()
    .setExpirationTime("10m")
    .sign(sessionKey());
  const url = new URL("https://github.com/login/oauth/authorize");
  url.searchParams.set("client_id", env.GITHUB_CLIENT_ID);
  url.searchParams.set("redirect_uri", appOrigin() + CALLBACK);
  // Repository write access remains a separate, explicit PAT connection.
  url.searchParams.set("scope", "read:user");
  url.searchParams.set("state", state);
  return new Response(null, {
    status: 302,
    headers: {
      Location: url.toString(),
      "Set-Cookie": serialize(STATE_COOKIE, nonce, {
        ...cookieOptions(request),
        maxAge: 600,
      }),
    },
  });
}
export async function handleOAuthRequest(request: Request): Promise<Response> {
  if (request.method !== "GET")
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  const url = new URL(request.url);
  if (url.pathname === "/api/oauth/start") return start(request, false);
  if (url.pathname === "/api/oauth/start-mobile") return start(request, true);
  if (url.pathname === "/api/oauth/mobile/start")
    return Response.json({
      authorizationUrl: appOrigin() + "/api/oauth/start-mobile",
    });
  if (url.pathname !== CALLBACK)
    return Response.json({ error: "OAuth route not found" }, { status: 404 });
  const headers = new Headers({
    "Set-Cookie": serialize(STATE_COOKIE, "", {
      ...cookieOptions(request),
      maxAge: 0,
    }),
  });
  try {
    const code = url.searchParams.get("code"),
      state = url.searchParams.get("state");
    if (!code || !state) throw new Error("Invalid callback");
    const { payload } = await jwtVerify(state, sessionKey(), {
      algorithms: ["HS256"],
      audience: "github-oauth",
    });
    const nonce = parse(request.headers.get("cookie") ?? "")[STATE_COOKIE];
    if (!nonce || typeof payload.nonce !== "string")
      throw new Error("Invalid state");
    const a = Buffer.from(nonce),
      b = Buffer.from(payload.nonce);
    if (a.length !== b.length || !timingSafeEqual(a, b))
      throw new Error("Invalid state");
    const env = getRuntimeEnv();
    const tokenResponse = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_id: env.GITHUB_CLIENT_ID,
          client_secret: env.GITHUB_CLIENT_SECRET,
          code,
          redirect_uri: appOrigin() + CALLBACK,
        }),
        signal: AbortSignal.timeout(15000),
      }
    );
    const token = (await tokenResponse.json()) as { access_token?: string };
    if (!tokenResponse.ok || !token.access_token)
      throw new Error("GitHub token exchange failed");
    const profileResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${token.access_token}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "Jekyll-Forge",
      },
      signal: AbortSignal.timeout(15000),
    });
    const profile = (await profileResponse.json()) as {
      id?: number;
      login?: string;
      name?: string;
      email?: string;
      avatar_url?: string;
    };
    if (!profileResponse.ok || !profile.id || !profile.login)
      throw new Error("GitHub profile unavailable");
    const openId = `github:${profile.id}`;
    await db.upsertUser({
      openId,
      name: profile.name || profile.login,
      email: profile.email ?? null,
      loginMethod: "github",
      githubLogin: profile.login,
      githubId: String(profile.id),
      githubAvatarUrl: profile.avatar_url,
      lastSignedIn: new Date(),
    });
    const database = await db.getDb();
    await database
      .update(users)
      .set({
        role: String(profile.id) === env.OWNER_GITHUB_ID ? "admin" : "user",
      })
      .where(eq(users.openId, openId));
    const user = await db.getUserByOpenId(openId);
    if (!user) throw new Error("Account creation failed");
    if (payload.mobile === true) {
      const ticket = randomBytes(32).toString("base64url");
      await db.createMobileAuthCode(
        user.id,
        ticket,
        new Date(Date.now() + 300000)
      );
      headers.set(
        "Location",
        `jekyllforge://auth-callback?code=${encodeURIComponent(ticket)}`
      );
    } else {
      const session = await sdk.createSessionToken(openId, {
        name: user.name ?? "",
      });
      headers.append(
        "Set-Cookie",
        serialize(COOKIE_NAME, session, {
          ...cookieOptions(request),
          maxAge: 7 * 86400,
        })
      );
      headers.set("Location", "/repos");
    }
    return new Response(null, { status: 302, headers });
  } catch {
    return Response.json(
      { error: "Sign-in failed or expired. Start GitHub sign-in again." },
      { status: 400, headers }
    );
  }
}

import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { randomBytes } from "crypto";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

const MOBILE_DEEP_LINK = "jekyllforge://auth-callback";
const MOBILE_CALLBACK_PATH = "/api/oauth/mobile/callback";
const MOBILE_AUTH_CODE_TTL_MS = 5 * 60 * 1000;

function getRequestOrigin(req: Request): string {
  return `${req.protocol}://${req.get("host")}`;
}

export function buildMobileAuthorizationUrl(
  requestOrigin: string,
  portalUrl: string,
  appId: string
): string {
  const callbackUrl = `${requestOrigin}${MOBILE_CALLBACK_PATH}`;
  const authorizationUrl = new URL("/app-auth", portalUrl);
  authorizationUrl.searchParams.set("appId", appId);
  authorizationUrl.searchParams.set("redirectUri", callbackUrl);
  authorizationUrl.searchParams.set(
    "state",
    Buffer.from(callbackUrl).toString("base64")
  );
  authorizationUrl.searchParams.set("type", "signIn");
  return authorizationUrl.toString();
}

function hasTrustedMobileCallbackState(req: Request, state: string): boolean {
  const callbackUrl = `${getRequestOrigin(req)}${MOBILE_CALLBACK_PATH}`;
  return Buffer.from(state, "base64").toString("utf8") === callbackUrl;
}

export function registerOAuthRoutes(app: Express) {
  app.get("/api/oauth/mobile/start", (req: Request, res: Response) => {
    const portalUrl = process.env.VITE_OAUTH_PORTAL_URL;
    const appId = process.env.VITE_APP_ID;
    if (!portalUrl || !appId) {
      res.status(503).json({ error: "Mobile OAuth is not configured" });
      return;
    }

    res.json({
      authorizationUrl: buildMobileAuthorizationUrl(
        getRequestOrigin(req),
        portalUrl,
        appId
      ),
    });
  });

  app.get(MOBILE_CALLBACK_PATH, async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    if (!code || !state || !hasTrustedMobileCallbackState(req, state)) {
      res.status(400).json({ error: "Invalid mobile OAuth callback" });
      return;
    }

    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }

      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: new Date(),
      });

      const user = await db.getUserByOpenId(userInfo.openId);
      if (!user) {
        res.status(500).json({ error: "Mobile user record was not created" });
        return;
      }

      const mobileCode = randomBytes(32).toString("base64url");
      await db.createMobileAuthCode(
        user.id,
        mobileCode,
        new Date(Date.now() + MOBILE_AUTH_CODE_TTL_MS)
      );

      res.redirect(
        302,
        `${MOBILE_DEEP_LINK}?code=${encodeURIComponent(mobileCode)}`
      );
    } catch (error) {
      console.error("[OAuth] Mobile callback failed", error);
      res.status(500).json({ error: "Mobile OAuth callback failed" });
    }
  });

  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }

      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, {
        ...cookieOptions,
        maxAge: ONE_YEAR_MS,
      });

      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}

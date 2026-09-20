import { COOKIE_NAME } from "@shared/const";
import { ForbiddenError } from "@shared/_core/errors";
import { parse } from "cookie";
import type { Request } from "express";
import { SignJWT, jwtVerify } from "jose";
import type { User } from "../../drizzle/schema";
import { getUserByOpenId } from "../db";
import { getRuntimeEnv } from "./runtime";

export type SessionPayload = { openId: string; appId: string; name: string };
export type AuthenticatedUser = User;
const ISSUER = "jekyll-forge";

export function extractSessionToken(
  req: Pick<Request, "headers">
): string | undefined {
  const match = /^Bearer\s+(.+)$/i.exec(
    req.headers.authorization?.trim() ?? ""
  );
  return match?.[1] ?? parse(req.headers.cookie ?? "")[COOKIE_NAME];
}
export function sessionKey() {
  const secret = getRuntimeEnv().JWT_SECRET;
  if (!secret || secret.length < 32)
    throw new Error("A strong JWT_SECRET is required");
  return new TextEncoder().encode(secret);
}
export const sdk = {
  async createSessionToken(
    openId: string,
    options: { expiresInMs?: number; name?: string } = {}
  ) {
    return new SignJWT({ openId, appId: ISSUER, name: options.name ?? "" })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setIssuer(ISSUER)
      .setAudience(ISSUER)
      .setIssuedAt()
      .setExpirationTime(
        Math.floor((Date.now() + (options.expiresInMs ?? 7 * 86400000)) / 1000)
      )
      .sign(sessionKey());
  },
  async verifySession(
    token: string | null | undefined
  ): Promise<SessionPayload | null> {
    if (!token) return null;
    try {
      const { payload } = await jwtVerify(token, sessionKey(), {
        algorithms: ["HS256"],
        issuer: ISSUER,
        audience: ISSUER,
      });
      if (
        typeof payload.openId !== "string" ||
        !payload.openId.startsWith("github:")
      )
        return null;
      return {
        openId: payload.openId,
        appId: ISSUER,
        name: typeof payload.name === "string" ? payload.name : "",
      };
    } catch {
      return null;
    }
  },
  async authenticateRequest(req: Pick<Request, "headers">): Promise<User> {
    const session = await this.verifySession(extractSessionToken(req));
    if (!session) throw ForbiddenError("Invalid session");
    const user = await getUserByOpenId(session.openId);
    if (!user) throw ForbiddenError("User not found");
    return user;
  },
};
export function publicUser(user: User | null) {
  if (!user) return null;
  const { githubToken, ...safe } = user;
  return safe;
}

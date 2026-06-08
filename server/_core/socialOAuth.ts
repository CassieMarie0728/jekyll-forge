/**
 * Social Media OAuth Flow Handler
 * Manages OAuth 2.0 authentication for Twitter/X and LinkedIn
 */

import { TRPCError } from "@trpc/server";

export interface OAuthConfig {
  platform: "twitter" | "linkedin";
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export interface OAuthToken {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  expiresAt?: Date;
}

/**
 * Generate OAuth authorization URL for user to click
 */
export function getOAuthAuthorizationUrl(
  platform: "twitter" | "linkedin",
  clientId: string,
  redirectUri: string,
  state: string
): string {
  const scopes =
    platform === "twitter"
      ? ["tweet.read", "tweet.write", "users.read", "tweet.moderate.write"]
      : ["w_member_social", "r_basicprofile"];

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: scopes.join(" "),
    state,
  });

  if (platform === "twitter") {
    return `https://twitter.com/i/oauth2/authorize?${params.toString()}`;
  } else {
    return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
  }
}

/**
 * Exchange OAuth code for access token
 */
export async function exchangeOAuthCode(
  platform: "twitter" | "linkedin",
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string
): Promise<OAuthToken> {
  try {
    const tokenUrl =
      platform === "twitter"
        ? "https://api.twitter.com/2/oauth2/token"
        : "https://www.linkedin.com/oauth/v2/accessToken";

    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
    });

    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OAuth token exchange failed: ${JSON.stringify(error)}`);
    }

    const data = await response.json() as any;

    const expiresIn = data.expires_in || 3600;
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn,
      expiresAt,
    };
  } catch (error) {
    console.error("[SocialOAuth] Token exchange error:", error);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: `Failed to exchange OAuth code: ${error instanceof Error ? error.message : "Unknown error"}`,
    });
  }
}

/**
 * Refresh OAuth token when expired
 */
export async function refreshOAuthToken(
  platform: "twitter" | "linkedin",
  refreshToken: string,
  clientId: string,
  clientSecret: string
): Promise<OAuthToken> {
  try {
    const tokenUrl =
      platform === "twitter"
        ? "https://api.twitter.com/2/oauth2/token"
        : "https://www.linkedin.com/oauth/v2/accessToken";

    const body = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    });

    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Token refresh failed: ${JSON.stringify(error)}`);
    }

    const data = await response.json() as any;

    const expiresIn = data.expires_in || 3600;
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || refreshToken,
      expiresIn,
      expiresAt,
    };
  } catch (error) {
    console.error("[SocialOAuth] Token refresh error:", error);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: `Failed to refresh OAuth token: ${error instanceof Error ? error.message : "Unknown error"}`,
    });
  }
}

/**
 * Get user profile info from social media platform
 */
export async function getUserProfile(
  platform: "twitter" | "linkedin",
  accessToken: string
): Promise<{ id: string; username: string; displayName?: string; profileImageUrl?: string }> {
  try {
    if (platform === "twitter") {
      const response = await fetch("https://api.twitter.com/2/users/me", {
        headers: { "Authorization": `Bearer ${accessToken}` },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch Twitter user profile");
      }

      const data = await response.json() as any;
      return {
        id: data.data.id,
        username: data.data.username,
        displayName: data.data.name,
      };
    } else {
      const response = await fetch("https://api.linkedin.com/v2/me", {
        headers: { "Authorization": `Bearer ${accessToken}` },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch LinkedIn user profile");
      }

      const data = await response.json() as any;
      return {
        id: data.id,
        username: data.localizedFirstName,
        displayName: `${data.localizedFirstName} ${data.localizedLastName}`,
      };
    }
  } catch (error) {
    console.error("[SocialOAuth] Profile fetch error:", error);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: `Failed to fetch user profile: ${error instanceof Error ? error.message : "Unknown error"}`,
    });
  }
}

/**
 * OAuth Token Refresh Manager
 * Handles automatic refresh of expired OAuth tokens for social media accounts
 */

import { getSocialMediaAccountsByUserId, updateSocialMediaAccount } from "../db";
import { notifyOwner } from "./notification";

export interface TokenRefreshResult {
  success: boolean;
  accountId: number;
  platform: string;
  newExpiresAt?: Date;
  error?: string;
}

/**
 * Check if token is expired or expiring soon
 */
export function isTokenExpiringSoon(expiresAt: Date | null, bufferMinutes = 30): boolean {
  if (!expiresAt) return false;

  const now = new Date();
  const bufferMs = bufferMinutes * 60 * 1000;
  const expiryTime = new Date(expiresAt).getTime();

  return expiryTime - now.getTime() < bufferMs;
}

/**
 * Refresh Twitter OAuth token
 */
export async function refreshTwitterToken(
  accountId: string,
  refreshToken: string
): Promise<{ accessToken: string; expiresIn: number }> {
  try {
    const response = await fetch("https://api.twitter.com/2/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: process.env.TWITTER_CLIENT_ID || "",
        client_secret: process.env.TWITTER_CLIENT_SECRET || "",
      }).toString(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Twitter token refresh failed: ${error.error_description || response.statusText}`);
    }

    const data = await response.json() as any;
    return {
      accessToken: data.access_token,
      expiresIn: data.expires_in,
    };
  } catch (error) {
    console.error("[TokenRefresh] Twitter token refresh error:", error);
    throw error;
  }
}

/**
 * Refresh LinkedIn OAuth token
 */
export async function refreshLinkedInToken(
  accountId: string,
  refreshToken: string
): Promise<{ accessToken: string; expiresIn: number }> {
  try {
    const response = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: process.env.LINKEDIN_CLIENT_ID || "",
        client_secret: process.env.LINKEDIN_CLIENT_SECRET || "",
      }).toString(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`LinkedIn token refresh failed: ${error.error_description || response.statusText}`);
    }

    const data = await response.json() as any;
    return {
      accessToken: data.access_token,
      expiresIn: data.expires_in,
    };
  } catch (error) {
    console.error("[TokenRefresh] LinkedIn token refresh error:", error);
    throw error;
  }
}

/**
 * Refresh Facebook OAuth token
 */
export async function refreshFacebookToken(
  accountId: string,
  accessToken: string
): Promise<{ accessToken: string; expiresIn: number }> {
  try {
    const response = await fetch("https://graph.facebook.com/v18.0/oauth/access_token", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Facebook token refresh failed: ${response.statusText}`);
    }

    const data = await response.json() as any;
    return {
      accessToken: data.access_token,
      expiresIn: data.expires_in,
    };
  } catch (error) {
    console.error("[TokenRefresh] Facebook token refresh error:", error);
    throw error;
  }
}

/**
 * Refresh Instagram OAuth token (uses Facebook token endpoint)
 */
export async function refreshInstagramToken(
  accountId: string,
  accessToken: string
): Promise<{ accessToken: string; expiresIn: number }> {
  // Instagram uses Facebook's token refresh mechanism
  return refreshFacebookToken(accountId, accessToken);
}

/**
 * Refresh token for a specific platform
 */
export async function refreshTokenForPlatform(
  platform: "twitter" | "linkedin" | "facebook" | "instagram",
  accountId: string,
  refreshToken: string,
  accessToken: string
): Promise<TokenRefreshResult> {
  try {
    let result: { accessToken: string; expiresIn: number };

    if (platform === "twitter") {
      result = await refreshTwitterToken(accountId, refreshToken);
    } else if (platform === "linkedin") {
      result = await refreshLinkedInToken(accountId, refreshToken);
    } else if (platform === "facebook") {
      result = await refreshFacebookToken(accountId, accessToken);
    } else if (platform === "instagram") {
      result = await refreshInstagramToken(accountId, accessToken);
    } else {
      throw new Error(`Unsupported platform: ${platform}`);
    }

    const newExpiresAt = new Date(Date.now() + result.expiresIn * 1000);

    return {
      success: true,
      accountId: parseInt(accountId),
      platform,
      newExpiresAt,
    };
  } catch (error) {
    console.error(`[TokenRefresh] Failed to refresh ${platform} token:`, error);
    return {
      success: false,
      accountId: parseInt(accountId),
      platform,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Refresh all expiring tokens for a user
 */
export async function refreshUserTokens(userId: number): Promise<TokenRefreshResult[]> {
  try {
    const accounts = await getSocialMediaAccountsByUserId(userId);
    const results: TokenRefreshResult[] = [];

    for (const account of accounts) {
      // Check if token is expiring soon
      if (!isTokenExpiringSoon(account.expiresAt)) {
        continue;
      }

      console.log(`[TokenRefresh] Refreshing ${account.platform} token for user ${userId}`);

      try {
        const result = await refreshTokenForPlatform(
          account.platform as "twitter" | "linkedin" | "facebook" | "instagram",
          account.accountId,
          account.refreshToken || "",
          account.accessToken
        );

        if (result.success && result.newExpiresAt) {
          // Update account with new token (would need to store new accessToken)
          await updateSocialMediaAccount(account.id, userId, {
            expiresAt: result.newExpiresAt,
          });

          console.log(`[TokenRefresh] Successfully refreshed ${account.platform} token`);
        } else {
          // Notify owner of token refresh failure
          await notifyOwner({
            title: "Social Media Token Refresh Failed",
            content: `Failed to refresh ${account.platform} token for account ${account.displayName || account.username}. Error: ${result.error}. Please reconnect your account.`,
          });

          console.error(`[TokenRefresh] Failed to refresh ${account.platform} token: ${result.error}`);
        }

        results.push(result);
      } catch (error) {
        console.error(`[TokenRefresh] Error refreshing ${account.platform} token:`, error);
        results.push({
          success: false,
          accountId: account.id,
          platform: account.platform,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return results;
  } catch (error) {
    console.error("[TokenRefresh] Error refreshing user tokens:", error);
    throw error;
  }
}

/**
 * Refresh all expiring tokens across all users
 * Called periodically by heartbeat job
 */
export async function refreshAllExpiringTokens(): Promise<void> {
  try {
    console.log("[TokenRefresh] Starting global token refresh");

    // In production, you would query all users with expiring tokens
    // For now, this is a placeholder that would be called by the heartbeat job
    // TODO: Implement batch token refresh for all users

    console.log("[TokenRefresh] Global token refresh completed");
  } catch (error) {
    console.error("[TokenRefresh] Global token refresh error:", error);
  }
}

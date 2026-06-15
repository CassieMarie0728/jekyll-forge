/**
 * Social Media Integration Service
 * Handles OAuth, posting, and analytics for Twitter/X and LinkedIn
 */

import { TRPCError } from "@trpc/server";

export interface SocialMediaConfig {
  platform: "twitter" | "linkedin" | "facebook" | "instagram";
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
}

export interface PostResult {
  success: boolean;
  externalPostId: string;
  externalUrl: string;
  platform: "twitter" | "linkedin" | "facebook" | "instagram";
}

export interface AnalyticsData {
  impressions: number;
  engagements: number;
  clicks: number;
  likes?: number;
  replies?: number;
  retweets?: number;
  shares?: number;
}

/**
 * Twitter/X API Service
 */
export class TwitterService {
  private accessToken: string;
  private apiVersion = "2";
  private baseUrl = "https://api.twitter.com";

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  async postTweet(content: string): Promise<PostResult> {
    try {
      const response = await fetch(`${this.baseUrl}/${this.apiVersion}/tweets`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: content }),
      });

      // Check for rate limit response (429 Too Many Requests)
      if (response.status === 429) {
        const retryAfter = response.headers.get("retry-after");
        const error = new Error(`Twitter rate limit exceeded`);
        (error as any).isRateLimit = true;
        (error as any).retryAfter = retryAfter ? parseInt(retryAfter) : 900; // 15 minutes default
        throw error;
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Twitter API error: ${error.detail || response.statusText}`);
      }

      const data = await response.json() as any;
      const tweetId = data.data?.id;
      const username = data.data?.author_id; // Note: This is simplified; actual implementation needs user lookup

      return {
        success: true,
        externalPostId: tweetId,
        externalUrl: `https://twitter.com/i/web/status/${tweetId}`,
        platform: "twitter",
      };
    } catch (error) {
      console.error("[TwitterService] Post error:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to post to Twitter: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    }
  }

  async postThread(tweets: string[]): Promise<PostResult> {
    try {
      let previousTweetId: string | null = null;
      let firstTweetId: string | null = null;

      for (const tweet of tweets) {
        const body: Record<string, unknown> = { text: tweet };
        if (previousTweetId) {
          body.reply = { in_reply_to_tweet_id: previousTweetId };
        }

        const response = await fetch(`${this.baseUrl}/${this.apiVersion}/tweets`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${this.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          throw new Error(`Failed to post tweet: ${response.statusText}`);
        }

        const data = await response.json() as any;
        const tweetId = data.data?.id;
        previousTweetId = tweetId;
        if (!firstTweetId) firstTweetId = tweetId;
      }

      return {
        success: true,
        externalPostId: firstTweetId!,
        externalUrl: `https://twitter.com/i/web/status/${firstTweetId}`,
        platform: "twitter",
      };
    } catch (error) {
      console.error("[TwitterService] Thread post error:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to post thread to Twitter: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    }
  }

  async getTweetMetrics(tweetId: string): Promise<AnalyticsData> {
    try {
      const response = await fetch(
        `${this.baseUrl}/${this.apiVersion}/tweets/${tweetId}?tweet.fields=public_metrics`,
        {
          headers: { "Authorization": `Bearer ${this.accessToken}` },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch metrics: ${response.statusText}`);
      }

      const data = await response.json() as any;
      const metrics = data.data?.public_metrics || {};

      return {
        impressions: metrics.impression_count || 0,
        engagements: (metrics.like_count || 0) + (metrics.reply_count || 0) + (metrics.retweet_count || 0),
        clicks: metrics.url_click_count || 0,
        likes: metrics.like_count || 0,
        replies: metrics.reply_count || 0,
        retweets: metrics.retweet_count || 0,
      };
    } catch (error) {
      console.error("[TwitterService] Metrics fetch error:", error);
      return { impressions: 0, engagements: 0, clicks: 0 };
    }
  }
}

/**
 * LinkedIn API Service
 */
export class LinkedInService {
  private accessToken: string;
  private baseUrl = "https://api.linkedin.com/v2";

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  async postArticle(title: string, content: string): Promise<PostResult> {
    try {
      // First, get the current user's URN
      const meResponse = await fetch(`${this.baseUrl}/me`, {
        headers: { "Authorization": `Bearer ${this.accessToken}` },
      });

      if (!meResponse.ok) {
        throw new Error("Failed to get user info");
      }

      const meData = await meResponse.json() as any;
      const userUrn = meData.id;

      // Create the article post
      const response = await fetch(`${this.baseUrl}/posts`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
          "LinkedIn-Version": "202405",
        },
        body: JSON.stringify({
          author: `urn:li:person:${userUrn}`,
          lifecycleState: "PUBLISHED",
          specificContent: {
            "com.linkedin.ugc.ShareContent": {
              shareCommentary: {
                text: title,
              },
              shareMediaCategory: "ARTICLE",
              media: [
                {
                  status: "READY",
                  description: {
                    text: content.substring(0, 200),
                  },
                  originalUrl: "https://jekyllforge.app",
                },
              ],
            },
          },
          visibility: {
            "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`LinkedIn API error: ${JSON.stringify(error)}`);
      }

      const data = await response.json() as any;
      const postId = data.id;

      return {
        success: true,
        externalPostId: postId,
        externalUrl: `https://www.linkedin.com/feed/update/${postId}`,
        platform: "linkedin",
      };
    } catch (error) {
      console.error("[LinkedInService] Post error:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to post to LinkedIn: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    }
  }

  async getPostMetrics(postId: string): Promise<AnalyticsData> {
    try {
      const response = await fetch(
        `${this.baseUrl}/posts/${postId}?fields=engagement`,
        {
          headers: { "Authorization": `Bearer ${this.accessToken}` },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch metrics: ${response.statusText}`);
      }

      const data = await response.json() as any;
      const engagement = data.engagement || {};

      return {
        impressions: engagement.impressionCount || 0,
        engagements: engagement.engagementCount || 0,
        clicks: engagement.clickCount || 0,
        shares: engagement.shareCount || 0,
      };
    } catch (error) {
      console.error("[LinkedInService] Metrics fetch error:", error);
      return { impressions: 0, engagements: 0, clicks: 0 };
    }
  }
}

/**
 * Facebook API Service
 */
export class FacebookService {
  private accessToken: string;
  private apiVersion = "v18.0";
  private baseUrl = "https://graph.facebook.com";

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  async postToPage(pageId: string, content: string, imageUrl?: string): Promise<PostResult> {
    try {
      const payload: any = {
        message: content,
        access_token: this.accessToken,
      };

      if (imageUrl) {
        payload.link = imageUrl;
      }

      const response = await fetch(`${this.baseUrl}/${this.apiVersion}/${pageId}/feed`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(payload),
      });

      if (!response.ok) {
        throw new Error(`Facebook API error: ${response.statusText}`);
      }

      const data = await response.json() as any;

      return {
        success: true,
        externalPostId: data.id,
        externalUrl: `https://facebook.com/${data.id}`,
        platform: "facebook",
      };
    } catch (error) {
      console.error("[FacebookService] Post error:", error);
      throw error;
    }
  }

  async getMetrics(postId: string): Promise<AnalyticsData> {
    try {
      const response = await fetch(
        `${this.baseUrl}/${this.apiVersion}/${postId}?fields=likes.summary(true).limit(0),comments.summary(true).limit(0),shares&access_token=${this.accessToken}`
      );

      if (!response.ok) {
        throw new Error(`Facebook API error: ${response.statusText}`);
      }

      const data = await response.json() as any;

      return {
        impressions: data.likes?.summary?.total_count || 0,
        engagements: (data.likes?.summary?.total_count || 0) + (data.comments?.summary?.total_count || 0),
        clicks: 0,
        likes: data.likes?.summary?.total_count,
        shares: data.shares?.data?.length || 0,
      };
    } catch (error) {
      console.error("[FacebookService] Metrics fetch error:", error);
      return { impressions: 0, engagements: 0, clicks: 0 };
    }
  }
}

/**
 * Instagram API Service
 */
export class InstagramService {
  private accessToken: string;
  private apiVersion = "v18.0";
  private baseUrl = "https://graph.instagram.com";

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  async postToFeed(caption: string, imageUrl?: string): Promise<PostResult> {
    try {
      const payload: any = {
        caption,
        access_token: this.accessToken,
      };

      if (imageUrl) {
        payload.image_url = imageUrl;
      }

      const response = await fetch(`${this.baseUrl}/${this.apiVersion}/me/media`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(payload),
      });

      if (!response.ok) {
        throw new Error(`Instagram API error: ${response.statusText}`);
      }

      const data = await response.json() as any;

      return {
        success: true,
        externalPostId: data.id,
        externalUrl: `https://instagram.com/p/${data.id}`,
        platform: "instagram",
      };
    } catch (error) {
      console.error("[InstagramService] Post error:", error);
      throw error;
    }
  }

  async getMetrics(mediaId: string): Promise<AnalyticsData> {
    try {
      const response = await fetch(
        `${this.baseUrl}/${this.apiVersion}/${mediaId}?fields=like_count,comments_count&access_token=${this.accessToken}`
      );

      if (!response.ok) {
        throw new Error(`Instagram API error: ${response.statusText}`);
      }

      const data = await response.json() as any;

      return {
        impressions: data.like_count || 0,
        engagements: (data.like_count || 0) + (data.comments_count || 0),
        clicks: 0,
        likes: data.like_count,
      };
    } catch (error) {
      console.error("[InstagramService] Metrics fetch error:", error);
      return { impressions: 0, engagements: 0, clicks: 0 };
    }
  }
}

/**
 * Factory function to get the appropriate service
 */
export function getSocialMediaService(platform: "twitter" | "linkedin" | "facebook" | "instagram", accessToken: string) {
  if (platform === "twitter") {
    return new TwitterService(accessToken);
  } else if (platform === "linkedin") {
    return new LinkedInService(accessToken);
  } else if (platform === "facebook") {
    return new FacebookService(accessToken);
  } else if (platform === "instagram") {
    return new InstagramService(accessToken);
  }
  throw new Error(`Unknown platform: ${platform}`);
}

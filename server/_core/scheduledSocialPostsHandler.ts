/**
 * Scheduled Social Posts Handler
 * Processes pending scheduled social media posts and publishes them at the scheduled time
 * Handles retries, error logging, and status updates
 */

import {
  getPendingScheduledSocialPosts,
  updateScheduledSocialPost,
  getSocialMediaAccount,
  getRepurposedContentById,
} from "../db";
import { getSocialMediaService } from "./socialMediaService";
import { notifyOwner } from "./notification";
import {
  isRateLimited,
  getRetryWaitTime,
  calculateBackoffDelay,
  storeRateLimit,
  parseRateLimitHeaders,
} from "./rateLimitHandler";

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 5000; // 5 seconds between retries

export async function processPendingScheduledSocialPosts() {
  try {
    const now = new Date();
    const pendingPosts = await getPendingScheduledSocialPosts(now);

    if (pendingPosts.length === 0) {
      console.log("[ScheduledSocialPosts] No pending posts to process");
      return;
    }

    console.log(`[ScheduledSocialPosts] Processing ${pendingPosts.length} pending posts`);

    for (const post of pendingPosts) {
      try {
        // Check rate limit before publishing
        if (isRateLimited(post.userId, post.platform)) {
          const waitTime = getRetryWaitTime(post.userId, post.platform);
          console.log(
            `[ScheduledSocialPosts] Rate limited for ${post.platform}, waiting ${Math.round(waitTime / 1000)}s`
          );
          // Reschedule for later
          const nextAttempt = new Date(Date.now() + waitTime);
          await updateScheduledSocialPost(post.id, post.userId, {
            scheduledAt: nextAttempt,
          });
          continue;
        }

        await publishScheduledPost(post);
      } catch (error) {
        console.error(`[ScheduledSocialPosts] Error publishing post ${post.id}:`, error);
        await handlePostError(post, error);
      }
    }
  } catch (error) {
    console.error("[ScheduledSocialPosts] Handler error:", error);
    await notifyOwner({
      title: "Scheduled Social Posts Handler Error",
      content: `Failed to process scheduled social posts: ${error instanceof Error ? error.message : String(error)}`,
    });
  }
}

async function publishScheduledPost(post: any) {
  // Update status to processing
  await updateScheduledSocialPost(post.id, post.userId, {
    status: "processing",
  });

  // Get account and content
  const account = await getSocialMediaAccount(post.socialMediaAccountId, post.userId);
  if (!account) {
    throw new Error("Social media account not found");
  }

  const content = await getRepurposedContentById(post.repurposedContentId, post.userId);
  if (!content) {
    throw new Error("Repurposed content not found");
  }

  // Get social media service and publish
  const service = getSocialMediaService(account.platform, account.accessToken);
  let result: any;
  
  if (account.platform === "twitter") {
    result = await (service as any).postTweet(post.content);
  } else if (account.platform === "linkedin") {
    result = await (service as any).sharePost(post.content);
  } else if (account.platform === "facebook") {
    result = await (service as any).postToPage(post.content);
  } else if (account.platform === "instagram") {
    result = await (service as any).uploadPost(post.content);
  } else {
    throw new Error(`Unsupported platform: ${account.platform}`);
  }

  // Update post with success status and external ID
  await updateScheduledSocialPost(post.id, post.userId, {
    status: "published",
    externalPostId: result.postId,
    externalUrl: result.url,
    publishedAt: new Date(),
  });

  console.log(`[ScheduledSocialPosts] Successfully published post ${post.id} to ${account.platform}`);

  // Notify owner of successful publish
  await notifyOwner({
    title: "Social Post Published",
    content: `Your post has been published to ${account.platform}. View: ${result.url}`,
  });
}

async function handlePostError(post: any, error: unknown) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const retryCount = post.retryCount || 0;
  const maxRetries = post.maxRetries || MAX_RETRIES;
  const isRateLimitError = (error as any)?.isRateLimit === true;
  const retryAfter = (error as any)?.retryAfter || 0;

  if (retryCount < maxRetries) {
    // Calculate retry delay
    let delayMs = RETRY_DELAY_MS * (retryCount + 1);
    
    // If rate limited, use the server's suggested retry-after or calculate backoff
    if (isRateLimitError) {
      delayMs = (retryAfter || 900) * 1000; // Convert seconds to ms
      console.log(`[ScheduledSocialPosts] Rate limit detected, retrying after ${retryAfter}s`);
    } else {
      delayMs = calculateBackoffDelay(post.platform, retryCount + 1);
    }

    // Schedule retry
    const nextRetryAt = new Date(Date.now() + delayMs);
    await updateScheduledSocialPost(post.id, post.userId, {
      status: "pending",
      retryCount: retryCount + 1,
      lastRetryAt: nextRetryAt,
      errorMessage: `Retry ${retryCount + 1}/${maxRetries}: ${errorMessage}`,
    });

    console.log(
      `[ScheduledSocialPosts] Scheduled retry ${retryCount + 1}/${maxRetries} for post ${post.id}`
    );
  } else {
    // Mark as failed after max retries
    await updateScheduledSocialPost(post.id, post.userId, {
      status: "failed",
      errorMessage: `Failed after ${maxRetries} retries: ${errorMessage}`,
    });

    console.error(`[ScheduledSocialPosts] Post ${post.id} failed after ${maxRetries} retries`);

    // Notify owner of failure
    await notifyOwner({
      title: "Social Post Publishing Failed",
      content: `Failed to publish post ${post.id} after ${maxRetries} retries. Error: ${errorMessage}`,
    });
  }
}

/**
 * Refresh expired OAuth tokens for social media accounts
 * Called periodically to ensure tokens don't expire
 */
export async function refreshExpiredTokens() {
  try {
    console.log("[ScheduledSocialPosts] Refreshing expired OAuth tokens");
    // This would be implemented based on each platform's token refresh mechanism
    // For now, this is a placeholder for future implementation
  } catch (error) {
    console.error("[ScheduledSocialPosts] Token refresh error:", error);
  }
}

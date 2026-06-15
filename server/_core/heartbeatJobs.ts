/**
 * Heartbeat Jobs
 * Scheduled tasks that run periodically to process background work
 */

import { processPendingScheduledSocialPosts } from "./scheduledSocialPostsHandler";
import { refreshAllExpiringTokens } from "./tokenRefreshManager";

/**
 * Process scheduled social posts every 5 minutes
 * This job finds pending posts that are ready to publish and publishes them
 */
export async function scheduledSocialPostsJob() {
  try {
    await processPendingScheduledSocialPosts();
  } catch (error) {
    console.error("[HeartbeatJob] Scheduled social posts error:", error);
  }
}

/**
 * Refresh OAuth tokens every hour
 * This job ensures social media account tokens don't expire
 */
export async function tokenRefreshJob() {
  try {
    await refreshAllExpiringTokens();
  } catch (error) {
    console.error("[HeartbeatJob] Token refresh error:", error);
  }
}

/**
 * Register all heartbeat jobs
 * Call this during server initialization
 */
export function registerHeartbeatJobs() {
  // Schedule social posts job - every 5 minutes
  setInterval(scheduledSocialPostsJob, 5 * 60 * 1000);

  // Token refresh job - every hour
  setInterval(tokenRefreshJob, 60 * 60 * 1000);

  console.log("[HeartbeatJobs] Registered all periodic jobs");
}

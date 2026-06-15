/**
 * Rate Limit Handler
 * Manages API rate limits for social media platforms and implements backoff strategies
 */

export interface RateLimitInfo {
  platform: "twitter" | "linkedin" | "facebook" | "instagram";
  remaining: number;
  limit: number;
  resetAt: Date;
  retryAfter?: number; // seconds
}

export interface RateLimitConfig {
  twitter: {
    tweetsPerWindow: number;
    windowMinutes: number;
    backoffMultiplier: number;
  };
  linkedin: {
    postsPerDay: number;
    backoffMultiplier: number;
  };
  facebook: {
    postsPerDay: number;
    backoffMultiplier: number;
  };
  instagram: {
    postsPerDay: number;
    backoffMultiplier: number;
  };
}

const DEFAULT_RATE_LIMIT_CONFIG: RateLimitConfig = {
  twitter: {
    tweetsPerWindow: 300,
    windowMinutes: 15,
    backoffMultiplier: 1.5,
  },
  linkedin: {
    postsPerDay: 100,
    backoffMultiplier: 2,
  },
  facebook: {
    postsPerDay: 200,
    backoffMultiplier: 2,
  },
  instagram: {
    postsPerDay: 50,
    backoffMultiplier: 2,
  },
};

// In-memory rate limit tracking (in production, use Redis or database)
const rateLimitStore = new Map<string, RateLimitInfo>();

/**
 * Parse rate limit headers from API response
 */
export function parseRateLimitHeaders(
  platform: "twitter" | "linkedin" | "facebook" | "instagram",
  headers: Record<string, string | string[] | undefined>
): RateLimitInfo | null {
  const key = `${platform}-ratelimit`;

  if (platform === "twitter") {
    const remaining = parseInt(headers["x-rate-limit-remaining"] as string) || 0;
    const limit = parseInt(headers["x-rate-limit-limit"] as string) || 300;
    const reset = parseInt(headers["x-rate-limit-reset"] as string) || 0;

    return {
      platform,
      remaining,
      limit,
      resetAt: new Date(reset * 1000),
    };
  } else if (platform === "linkedin") {
    const retryAfter = parseInt(headers["retry-after"] as string);
    if (!isNaN(retryAfter)) {
      return {
        platform,
        remaining: 0,
        limit: DEFAULT_RATE_LIMIT_CONFIG.linkedin.postsPerDay,
        resetAt: new Date(Date.now() + retryAfter * 1000),
        retryAfter,
      };
    }
  } else if (platform === "facebook") {
    const retryAfter = parseInt(headers["retry-after"] as string);
    if (!isNaN(retryAfter)) {
      return {
        platform,
        remaining: 0,
        limit: DEFAULT_RATE_LIMIT_CONFIG.facebook.postsPerDay,
        resetAt: new Date(Date.now() + retryAfter * 1000),
        retryAfter,
      };
    }
  } else if (platform === "instagram") {
    const retryAfter = parseInt(headers["retry-after"] as string);
    if (!isNaN(retryAfter)) {
      return {
        platform,
        remaining: 0,
        limit: DEFAULT_RATE_LIMIT_CONFIG.instagram.postsPerDay,
        resetAt: new Date(Date.now() + retryAfter * 1000),
        retryAfter,
      };
    }
  }

  return null;
}

/**
 * Store rate limit information
 */
export function storeRateLimit(userId: number, rateLimit: RateLimitInfo): void {
  const key = `${userId}-${rateLimit.platform}`;
  rateLimitStore.set(key, rateLimit);
}

/**
 * Get stored rate limit information
 */
export function getRateLimit(userId: number, platform: string): RateLimitInfo | null {
  const key = `${userId}-${platform}`;
  return rateLimitStore.get(key) || null;
}

/**
 * Check if rate limit is exceeded
 */
export function isRateLimited(userId: number, platform: string): boolean {
  const rateLimit = getRateLimit(userId, platform);
  if (!rateLimit) return false;

  // If reset time has passed, rate limit is no longer active
  if (new Date() > rateLimit.resetAt) {
    rateLimitStore.delete(`${userId}-${platform}`);
    return false;
  }

  return rateLimit.remaining <= 0;
}

/**
 * Get wait time before retry (in milliseconds)
 */
export function getRetryWaitTime(userId: number, platform: string): number {
  const rateLimit = getRateLimit(userId, platform);
  if (!rateLimit) return 0;

  const now = new Date();
  const waitMs = Math.max(0, rateLimit.resetAt.getTime() - now.getTime());

  // Add jitter to prevent thundering herd
  const jitter = Math.random() * 1000;
  return waitMs + jitter;
}

/**
 * Calculate backoff delay for retry
 */
export function calculateBackoffDelay(
  platform: "twitter" | "linkedin" | "facebook" | "instagram",
  attemptNumber: number
): number {
  const config = DEFAULT_RATE_LIMIT_CONFIG[platform];
  const baseDelay = 1000; // 1 second
  const multiplier = config.backoffMultiplier;

  // Exponential backoff with jitter
  const exponentialDelay = baseDelay * Math.pow(multiplier, attemptNumber - 1);
  const jitter = Math.random() * exponentialDelay * 0.1; // 10% jitter
  const maxDelay = 60 * 60 * 1000; // 1 hour max

  return Math.min(exponentialDelay + jitter, maxDelay);
}

/**
 * Check if response indicates rate limiting
 */
export function isRateLimitError(
  statusCode: number,
  platform: "twitter" | "linkedin" | "facebook" | "instagram"
): boolean {
  if (platform === "twitter") {
    return statusCode === 429; // Too Many Requests
  } else if (platform === "linkedin" || platform === "facebook" || platform === "instagram") {
    return statusCode === 429 || statusCode === 403; // Too Many Requests or Forbidden
  }
  return false;
}

/**
 * Get rate limit status for display
 */
export function getRateLimitStatus(userId: number, platform: string): string {
  const rateLimit = getRateLimit(userId, platform);
  if (!rateLimit) {
    return "No rate limit info";
  }

  const remaining = rateLimit.remaining;
  const limit = rateLimit.limit;
  const percentage = Math.round((remaining / limit) * 100);

  if (percentage > 50) {
    return `${remaining}/${limit} requests available`;
  } else if (percentage > 20) {
    return `⚠️ ${remaining}/${limit} requests (${percentage}%)`;
  } else {
    return `🔴 ${remaining}/${limit} requests (${percentage}%) - Rate limit approaching`;
  }
}

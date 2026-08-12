import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { createClient, type RedisClientType } from "redis";
import { RedisStore, type RedisReply } from "rate-limit-redis";
import type { Request, Response } from "express";
import logger from "./logger";

declare global {
  namespace Express {
    interface Request {
      rateLimit?: {
        limit: number;
        current: number;
        remaining: number;
        resetTime?: Date;
      };
    }
  }
}

type AuthenticatedRequest = Request & {
  user?: {
    id?: string;
  };
};

function getIpRateLimitKey(req: Request): string {
  return ipKeyGenerator(req.ip || "unknown");
}

function getRetryAfterSeconds(req: Request): number | undefined {
  const resetTime = req.rateLimit?.resetTime;
  return resetTime
    ? Math.max(0, Math.ceil((resetTime.getTime() - Date.now()) / 1_000))
    : undefined;
}

// Redis is optional. Local development and deployments without REDIS_URL use
// the express-rate-limit in-memory store rather than attempting localhost.
let redisClient: RedisClientType | null = null;
let redisConnectionAttempted = false;

async function initializeRedisClient(): Promise<RedisClientType | null> {
  if (redisClient?.isOpen) return redisClient;

  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    logger.info(
      "REDIS_URL is not configured; rate limiting is using the in-memory store"
    );
    return null;
  }

  if (redisConnectionAttempted) return null;
  redisConnectionAttempted = true;

  try {
    const candidate = createClient({
      url: redisUrl,
      socket: {
        connectTimeout: 2_000,
        reconnectStrategy: false,
      },
    });

    candidate.on("error", error => {
      logger.error("Redis rate-limit client error", { error });
    });

    await candidate.connect();
    redisClient = candidate;
    logger.info("Redis client connected for rate limiting");
    return redisClient;
  } catch (error) {
    logger.warn(
      "Redis rate-limit connection failed; using the in-memory store for this process",
      {
        error,
      }
    );
    return null;
  }
}

function createRedisStore(client: RedisClientType, prefix: string): RedisStore {
  return new RedisStore({
    prefix,
    sendCommand: (...args: string[]) =>
      client.sendCommand(args) as Promise<RedisReply>,
  });
}

export const createApiRateLimiter = async (
  windowMs: number = 15 * 60 * 1_000,
  max: number = 100,
  keyGenerator?: (req: Request) => string
) => {
  const client = await initializeRedisClient();

  return rateLimit({
    store: client ? createRedisStore(client, "rate-limit:api:") : undefined,
    windowMs,
    max,
    message: "Too many requests from this IP, please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: keyGenerator || getIpRateLimitKey,
    skip: req => req.path === "/health" || req.path === "/api/health",
    handler: (req: Request, res: Response) => {
      logger.warn(`Rate limit exceeded for IP: ${req.ip}, path: ${req.path}`);
      res.status(429).json({
        error: "Too many requests",
        retryAfter: getRetryAfterSeconds(req),
      });
    },
  });
};

export const createAuthRateLimiter = async () => {
  const client = await initializeRedisClient();

  return rateLimit({
    store: client ? createRedisStore(client, "rate-limit:auth:") : undefined,
    windowMs: 15 * 60 * 1_000,
    max: 5,
    message: "Too many login attempts, please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: req => {
      const email =
        typeof req.body?.email === "string" ? req.body.email.trim() : "";
      return email ? email.toLowerCase() : getIpRateLimitKey(req);
    },
    handler: (req: Request, res: Response) => {
      logger.warn(
        `Auth rate limit exceeded for: ${req.body?.email || req.ip}, path: ${req.path}`
      );
      res.status(429).json({
        error: "Too many login attempts",
        retryAfter: getRetryAfterSeconds(req),
      });
    },
  });
};

export const createPublicRateLimiter = async () => {
  const client = await initializeRedisClient();

  return rateLimit({
    store: client ? createRedisStore(client, "rate-limit:public:") : undefined,
    windowMs: 60 * 60 * 1_000,
    max: 1_000,
    message: "Too many requests from this IP, please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: getIpRateLimitKey,
    handler: (req: Request, res: Response) => {
      logger.warn(
        `Public rate limit exceeded for IP: ${req.ip}, path: ${req.path}`
      );
      res.status(429).json({
        error: "Too many requests",
        retryAfter: getRetryAfterSeconds(req),
      });
    },
  });
};

export const createUserRateLimiter = async (
  windowMs: number = 60 * 1_000,
  max: number = 30
) => {
  const client = await initializeRedisClient();

  return rateLimit({
    store: client ? createRedisStore(client, "rate-limit:user:") : undefined,
    windowMs,
    max,
    message: "Too many requests, please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: req => {
      const userId = (req as AuthenticatedRequest).user?.id;
      return userId || getIpRateLimitKey(req);
    },
    skip: req => !(req as AuthenticatedRequest).user,
    handler: (req: Request, res: Response) => {
      logger.warn(
        `User rate limit exceeded for user: ${(req as AuthenticatedRequest).user?.id || req.ip}, path: ${req.path}`
      );
      res.status(429).json({
        error: "Too many requests",
        retryAfter: getRetryAfterSeconds(req),
      });
    },
  });
};

export async function closeRedisClient() {
  if (redisClient?.isOpen) {
    await redisClient.quit();
    logger.info("Redis client closed");
  }

  redisClient = null;
  redisConnectionAttempted = false;
}

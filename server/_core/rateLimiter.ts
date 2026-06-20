import rateLimit from 'express-rate-limit';
import { createClient } from 'redis';
import { RedisStore } from 'rate-limit-redis';
import type { Request, Response } from 'express';
import logger from './logger';

// Augment Express Request type to include rateLimit
declare global {
  namespace Express {
    interface Request {
      rateLimit?: {
        limit: number;
        current: number;
        remaining: number;
        resetTime?: number;
      };
    }
  }
}

// Create Redis client for rate limiting
let redisClient: ReturnType<typeof createClient> | null = null;

async function initializeRedisClient() {
  if (redisClient) return redisClient;

  try {
    redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    });

    redisClient.on('error', (err) => {
      logger.error('Redis client error:', err);
    });

    await redisClient.connect();
    logger.info('Redis client connected for rate limiting');
    return redisClient;
  } catch (error) {
    logger.warn('Failed to connect to Redis, using in-memory store:', error);
    return null;
  }
}

// Create rate limiters with different configurations
export const createApiRateLimiter = async (
  windowMs: number = 15 * 60 * 1000, // 15 minutes
  max: number = 100, // 100 requests per window
  keyGenerator?: (req: Request) => string
) => {
  const client = await initializeRedisClient();

  const limiter = rateLimit({
    store: client
      ? new (RedisStore as any)({
          client,
          prefix: 'rate-limit:api:',
          sendUnlimitedResponse: false,
        })
      : undefined,
    windowMs,
    max,
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: keyGenerator || ((req) => req.ip || 'unknown'),
    skip: (req) => {
      return req.path === '/health' || req.path === '/api/health';
    },
    handler: (req: Request, res: Response) => {
      logger.warn(`Rate limit exceeded for IP: ${req.ip}, path: ${req.path}`);
      res.status(429).json({
        error: 'Too many requests',
        retryAfter: (req as any).rateLimit?.resetTime,
      });
    },
  });

  return limiter;
};

// Strict limiter for authentication endpoints
export const createAuthRateLimiter = async () => {
  const client = await initializeRedisClient();

  return rateLimit({
    store: client
      ? new (RedisStore as any)({
          client,
          prefix: 'rate-limit:auth:',
          sendUnlimitedResponse: false,
        })
      : undefined,
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'Too many login attempts, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      return (req.body?.email || req.ip || 'unknown').toLowerCase();
    },
    handler: (req: Request, res: Response) => {
      logger.warn(
        `Auth rate limit exceeded for: ${req.body?.email || req.ip}, path: ${req.path}`
      );
      res.status(429).json({
        error: 'Too many login attempts',
        retryAfter: (req as any).rateLimit?.resetTime,
      });
    },
  });
};

// Lenient limiter for public endpoints
export const createPublicRateLimiter = async () => {
  const client = await initializeRedisClient();

  return rateLimit({
    store: client
      ? new (RedisStore as any)({
          client,
          prefix: 'rate-limit:public:',
          sendUnlimitedResponse: false,
        })
      : undefined,
    windowMs: 60 * 60 * 1000,
    max: 1000,
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.ip || 'unknown',
    handler: (req: Request, res: Response) => {
      logger.warn(`Public rate limit exceeded for IP: ${req.ip}, path: ${req.path}`);
      res.status(429).json({
        error: 'Too many requests',
        retryAfter: (req as any).rateLimit?.resetTime,
      });
    },
  });
};

// Per-user rate limiter (requires authentication)
export const createUserRateLimiter = async (
  windowMs: number = 60 * 1000,
  max: number = 30
) => {
  const client = await initializeRedisClient();

  return rateLimit({
    store: client
      ? new (RedisStore as any)({
          client,
          prefix: 'rate-limit:user:',
          sendUnlimitedResponse: false,
        })
      : undefined,
    windowMs,
    max,
    message: 'Too many requests, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      return (req as any).user?.id || req.ip || 'unknown';
    },
    skip: (req) => {
      return !(req as any).user;
    },
    handler: (req: Request, res: Response) => {
      logger.warn(
        `User rate limit exceeded for user: ${(req as any).user?.id || req.ip}, path: ${req.path}`
      );
      res.status(429).json({
        error: 'Too many requests',
        retryAfter: (req as any).rateLimit?.resetTime,
      });
    },
  });
};

// Cleanup function to close Redis connection
export async function closeRedisClient() {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    logger.info('Redis client closed');
  }
}

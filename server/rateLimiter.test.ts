import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock("redis", () => ({
  createClient: mocks.createClient,
}));

vi.mock("./_core/logger", () => ({
  default: mocks.logger,
}));

import {
  closeRedisClient,
  createApiRateLimiter,
  createAuthRateLimiter,
} from "./_core/rateLimiter";

describe("rate limiter Redis fallback", () => {
  const originalRedisUrl = process.env.REDIS_URL;

  beforeEach(async () => {
    await closeRedisClient();
    delete process.env.REDIS_URL;
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await closeRedisClient();

    if (originalRedisUrl === undefined) {
      delete process.env.REDIS_URL;
    } else {
      process.env.REDIS_URL = originalRedisUrl;
    }
  });

  it("uses the in-memory store without attempting localhost when REDIS_URL is absent", async () => {
    const limiter = await createApiRateLimiter();

    expect(typeof limiter).toBe("function");
    expect(mocks.createClient).not.toHaveBeenCalled();
    expect(mocks.logger.info).toHaveBeenCalledWith(
      "REDIS_URL is not configured; rate limiting is using the in-memory store"
    );
  });

  it("attempts an unavailable configured Redis endpoint only once before retaining its in-memory fallback", async () => {
    process.env.REDIS_URL = "redis://unreachable.example:6379";
    mocks.createClient.mockReturnValue({
      connect: vi.fn().mockRejectedValue(new Error("Connection refused")),
      isOpen: false,
      on: vi.fn(),
    });

    await createApiRateLimiter();
    await createAuthRateLimiter();

    expect(mocks.createClient).toHaveBeenCalledTimes(1);
    expect(mocks.logger.warn).toHaveBeenCalledWith(
      "Redis rate-limit connection failed; using the in-memory store for this process",
      expect.objectContaining({ error: expect.any(Error) })
    );
  });

  it("creates a compatible Redis-backed limiter when the configured client connects", async () => {
    process.env.REDIS_URL = "redis://reachable.example:6379";
    const quit = vi.fn().mockResolvedValue(undefined);
    mocks.createClient.mockReturnValue({
      connect: vi.fn().mockResolvedValue(undefined),
      isOpen: true,
      on: vi.fn(),
      quit,
      sendCommand: vi.fn().mockResolvedValue("ok"),
    });

    const limiter = await createApiRateLimiter();

    expect(typeof limiter).toBe("function");
    expect(mocks.createClient).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "redis://reachable.example:6379",
        socket: expect.objectContaining({ reconnectStrategy: false }),
      })
    );
    await closeRedisClient();
    expect(quit).toHaveBeenCalledOnce();
  });
});

import { describe, expect, it } from "vitest";
import {
  FreeAiProviderRateLimiter,
  assertFreeModelAllowed,
  decryptProviderApiKey,
  encryptProviderApiKey,
} from "./freeProvider";

// prettier-ignore
describe("free AI provider policy", () => {
  it("encrypts user-owned API keys with an authenticated envelope", () => {
    const originalSecret = process.env.JWT_SECRET;
    process.env.JWT_SECRET = "test-only-encryption-secret";
    const apiKey = "sk-user-owned-provider-key";

    const encrypted = encryptProviderApiKey(apiKey);

    expect(encrypted).toMatch(/^v1:[^:]+:[^:]+:[^:]+$/);
    expect(encrypted).not.toContain(apiKey);
    expect(decryptProviderApiKey(encrypted)).toBe(apiKey);
    process.env.JWT_SECRET = originalSecret;
  });

  it("rejects any paid or non-allowlisted model server-side", () => {
    expect(() => assertFreeModelAllowed("openrouter", "openai/gpt-4o")).toThrow(
      "not approved"
    );
    expect(() => assertFreeModelAllowed("gemini", "gemini-2.5-pro")).toThrow(
      "not approved"
    );
    expect(() => assertFreeModelAllowed("mistral", "mistral-small-latest")).toThrow(
      "temporarily unavailable"
    );
  });

  it("permits only the documented no-cost model paths", () => {
    expect(assertFreeModelAllowed("openrouter", "meta-llama/llama-3.3-70b-instruct:free")).toEqual({
      provider: "openrouter",
      model: "meta-llama/llama-3.3-70b-instruct:free",
    });
    expect(assertFreeModelAllowed("gemini", "gemini-2.5-flash-lite")).toEqual({
      provider: "gemini",
      model: "gemini-2.5-flash-lite",
    });
    expect(assertFreeModelAllowed("groq", "openai/gpt-oss-20b")).toEqual({
      provider: "groq",
      model: "openai/gpt-oss-20b",
    });
  });

  it("enforces conservative minute and daily safeguards before upstream use", () => {
    let currentTime = Date.UTC(2026, 7, 14, 12, 0, 0);
    const limiter = new FreeAiProviderRateLimiter(() => currentTime);

    for (let request = 0; request < 10; request += 1) {
      limiter.consume(14, "openrouter");
    }
    expect(() => limiter.consume(14, "openrouter")).toThrow("minute limit");

    currentTime += 61_000;
    const postReset = limiter.consume(14, "openrouter");
    expect(postReset.minuteRemaining).toBe(9);

    for (let request = 0; request < 29; request += 1) {
      currentTime += 61_000;
      limiter.consume(14, "openrouter");
    }
    expect(() => limiter.consume(14, "openrouter")).toThrow("daily free-tier safeguard");
  });
});

import { afterEach, describe, expect, it, vi } from "vitest";
import { withRuntime } from "../_core/runtime";
const mocks = vi.hoisted(() => ({
  providers: vi.fn(),
  usage: vi.fn(),
  limit: vi.fn(async () => true),
}));
vi.mock("../db", () => ({
  getUserAiProviders: mocks.providers,
  incrementAiUsage: mocks.usage,
}));
vi.mock("../_core/limits", () => ({ consumeLimit: mocks.limit }));
import {
  encryptProviderApiKey,
  invokeUserOwnedFreeAi,
  testProviderApiKey,
} from "./freeProvider";
afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});
describe("optional Mistral provider", () => {
  it("checks keys using model metadata without generating billable text", async () => {
    const fetcher = vi.fn(async () => new Response("{}"));
    vi.stubGlobal("fetch", fetcher);
    await testProviderApiKey("mistral", "test-key");
    expect(fetcher).toHaveBeenCalledWith(
      "https://api.mistral.ai/v1/models",
      expect.objectContaining({ headers: { Authorization: "Bearer test-key" } })
    );
  });
  it("uses the chosen Mistral model and does not fall back after a rejection", async () => {
    await withRuntime(
      {
        JWT_SECRET: "test-only-encryption-secret-at-least-32",
      } as CloudflareBindings,
      async () => {
        mocks.providers.mockResolvedValue([
          {
            enabled: true,
            provider: "mistral",
            selectedModel: "mistral-small-latest",
            encryptedApiKey: encryptProviderApiKey("test-key"),
          },
        ]);
        const fetcher = vi
          .fn()
          .mockResolvedValueOnce(
            new Response(
              JSON.stringify({
                choices: [{ message: { content: "A working draft" } }],
                usage: { prompt_tokens: 8, completion_tokens: 4 },
              })
            )
          )
          .mockResolvedValueOnce(
            new Response("test-key should never be echoed", { status: 401 })
          );
        vi.stubGlobal("fetch", fetcher);
        const input = {
          userId: 7,
          messages: [{ role: "user" as const, content: "Write a draft" }],
        };
        const result = await invokeUserOwnedFreeAi(input);
        expect(result).toMatchObject({
          provider: "mistral",
          model: "mistral-small-latest",
          text: "A working draft",
        });
        expect(fetcher.mock.calls[0][0]).toBe(
          "https://api.mistral.ai/v1/chat/completions"
        );
        expect(JSON.parse(fetcher.mock.calls[0][1].body)).toMatchObject({
          model: "mistral-small-latest",
          max_tokens: 1024,
          stream: false,
        });
        await expect(invokeUserOwnedFreeAi(input)).rejects.toThrow(
          "key was rejected"
        );
        expect(fetcher).toHaveBeenCalledTimes(2);
        expect(mocks.usage).toHaveBeenCalledTimes(1);
      }
    );
  });
});

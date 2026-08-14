import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUserAiProviders: vi.fn(),
  upsertUserAiProvider: vi.fn(),
  activateUserAiProvider: vi.fn(),
  deleteUserAiProvider: vi.fn(),
}));

vi.mock("../db", () => ({
  getUserAiProviders: mocks.getUserAiProviders,
  upsertUserAiProvider: mocks.upsertUserAiProvider,
  activateUserAiProvider: mocks.activateUserAiProvider,
  deleteUserAiProvider: mocks.deleteUserAiProvider,
}));

import { aiProvidersRouter } from "./aiProviders";

function createCaller(userId: number) {
  return aiProvidersRouter.createCaller({ user: { id: userId } } as never);
}

// prettier-ignore
describe("ai provider settings privacy", () => {
  it("uses the caller identity and never returns encrypted key material", async () => {
    mocks.getUserAiProviders.mockImplementation(async (userId: number) =>
      userId === 7
        ? [
            {
              id: 1,
              userId: 7,
              provider: "groq",
              encryptedApiKey: "v1:private:tag:ciphertext",
              selectedModel: "llama-3.1-8b-instant",
              enabled: true,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ]
        : []
    );

    const ownerSettings = await createCaller(7).getSettings();
    const otherUserSettings = await createCaller(8).getSettings();

    expect(mocks.getUserAiProviders).toHaveBeenNthCalledWith(1, 7);
    expect(mocks.getUserAiProviders).toHaveBeenNthCalledWith(2, 8);
    expect(ownerSettings.find(item => item.provider === "groq")).toMatchObject({
      configured: true,
      enabled: true,
      selectedModel: "llama-3.1-8b-instant",
    });
    expect(JSON.stringify(ownerSettings)).not.toContain("private:tag:ciphertext");
    expect(otherUserSettings.find(item => item.provider === "groq")).toMatchObject({
      configured: false,
      enabled: false,
      selectedModel: null,
    });
  });
});

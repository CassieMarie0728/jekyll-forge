import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  save: vi.fn(),
  generate: vi.fn(),
}));
vi.mock("../db", () => ({
  getAiSettings: mocks.get,
  upsertAiSettings: mocks.save,
}));
vi.mock("../ai/freeProvider", () => ({
  invokeUserOwnedFreeAi: mocks.generate,
}));
import { aiRouter } from "./ai";
const caller = aiRouter.createCaller({ user: { id: 7 } } as never);
beforeEach(() => {
  vi.clearAllMocks();
  mocks.get.mockResolvedValue({ enabled: true, defaultTone: "deadpool-cool" });
  mocks.generate.mockResolvedValue({
    text: "Draft",
    usage: {},
    provider: "mistral",
    model: "mistral-small-latest",
  });
});
describe("writing tone preferences", () => {
  it("persists the default tone for the authenticated user", async () => {
    await caller.updateSettings({ defaultTone: "deadpool-cool" });
    expect(mocks.save).toHaveBeenCalledWith({
      userId: 7,
      defaultTone: "deadpool-cool",
    });
  });
  it("expands the saved tone into instructions while preserving task formats", async () => {
    await caller.generate({ task: "draft" });
    const prompt = mocks.generate.mock.calls[0][0].messages[0].content;
    expect(prompt).toContain("fourth-wall-breaking");
    expect(prompt).toContain("Never invent facts");
    expect(prompt).toContain("output format take priority");
  });
  it("lets the editor override the default", async () => {
    await caller.generate({ task: "draft", tone: "formal" });
    const prompt = mocks.generate.mock.calls[0][0].messages[0].content;
    expect(prompt).toContain("Tone: formal");
    expect(prompt).not.toContain("fourth-wall-breaking");
  });
});

it("applies saved content language without translating structured keys", async () => {
  mocks.get.mockResolvedValue({ enabled: true, defaultLanguage: "Spanish" });
  await caller.generate({ task: "draft" });
  const prompt = mocks.generate.mock.calls[0][0].messages[0].content;
  expect(prompt).toContain("content in Spanish");
  expect(prompt).toContain("Preserve required JSON keys");
});

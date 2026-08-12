import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  exchangeCodeForToken: vi.fn(),
  getUserInfo: vi.fn(),
  upsertUser: vi.fn(),
  getUserByOpenId: vi.fn(),
  createMobileAuthCode: vi.fn(),
}));

vi.mock("../db", async importOriginal => ({
  ...(await importOriginal<typeof import("../db")>()),
  upsertUser: mocks.upsertUser,
  getUserByOpenId: mocks.getUserByOpenId,
  createMobileAuthCode: mocks.createMobileAuthCode,
}));

vi.mock("./sdk", () => ({
  sdk: {
    exchangeCodeForToken: mocks.exchangeCodeForToken,
    getUserInfo: mocks.getUserInfo,
  },
}));

import { registerOAuthRoutes } from "./oauth";

type GetHandler = (req: any, res: any) => Promise<void> | void;

function getMobileCallbackHandler(): GetHandler {
  const handlers = new Map<string, GetHandler>();
  registerOAuthRoutes({
    get(path: string, handler: GetHandler) {
      handlers.set(path, handler);
    },
  } as never);
  const handler = handlers.get("/api/oauth/mobile/callback");
  if (!handler) throw new Error("Mobile callback was not registered");
  return handler;
}

describe("mobile OAuth callback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.exchangeCodeForToken.mockResolvedValue({
      accessToken: "provider-token",
    });
    mocks.getUserInfo.mockResolvedValue({
      openId: "mobile-open-id",
      name: "Mobile User",
      email: "mobile@example.com",
      loginMethod: "manus",
    });
    mocks.getUserByOpenId.mockResolvedValue({ id: 42 });
  });

  it("issues a short-lived one-time ticket and redirects only to the registered app deep link", async () => {
    const redirect = vi.fn();
    const status = vi.fn().mockReturnThis();
    const json = vi.fn();
    const callbackUrl =
      "https://jekyllforge.manus.space/api/oauth/mobile/callback";

    await getMobileCallbackHandler()(
      {
        query: {
          code: "provider-code",
          state: Buffer.from(callbackUrl).toString("base64"),
        },
        protocol: "https",
        get: vi.fn().mockReturnValue("jekyllforge.manus.space"),
      },
      { redirect, status, json }
    );

    expect(mocks.createMobileAuthCode).toHaveBeenCalledWith(
      42,
      expect.stringMatching(/^[A-Za-z0-9_-]{43}$/),
      expect.any(Date)
    );
    expect(redirect).toHaveBeenCalledWith(
      302,
      expect.stringMatching(/^jekyllforge:\/\/auth-callback\?code=/)
    );
    expect(status).not.toHaveBeenCalled();
    expect(json).not.toHaveBeenCalled();
  });

  it("rejects callbacks whose encoded state does not bind to the mobile server callback", async () => {
    const status = vi.fn().mockReturnThis();
    const json = vi.fn();
    const redirect = vi.fn();

    await getMobileCallbackHandler()(
      {
        query: {
          code: "provider-code",
          state: Buffer.from("https://attacker.invalid/callback").toString(
            "base64"
          ),
        },
        protocol: "https",
        get: vi.fn().mockReturnValue("jekyllforge.manus.space"),
      },
      { redirect, status, json }
    );

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      error: "Invalid mobile OAuth callback",
    });
    expect(mocks.exchangeCodeForToken).not.toHaveBeenCalled();
  });
});

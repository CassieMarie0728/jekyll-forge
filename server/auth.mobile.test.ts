import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./db", async importOriginal => ({
  ...(await importOriginal<typeof import("./db")>()),
  consumeMobileAuthCode: vi.fn(),
}));

import * as db from "./db";
import { appRouter } from "./routers";
import { sdk } from "./_core/sdk";

const user = {
  id: 9,
  openId: "mobile-user",
  name: "Mobile User",
  email: "mobile@example.com",
  loginMethod: "manus",
  role: "user" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

function createCaller() {
  return appRouter.createCaller({
    user: null,
    req: { headers: {} } as never,
    res: {} as never,
  });
}

describe("auth.exchangeMobileCode", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns a signed mobile session only for a consumable one-time ticket", async () => {
    vi.mocked(db.consumeMobileAuthCode).mockResolvedValue(user);
    vi.spyOn(sdk, "createSessionToken").mockResolvedValue(
      "mobile-session-token"
    );

    const result = await createCaller().auth.exchangeMobileCode({
      code: "c".repeat(43),
    });

    expect(result).toMatchObject({
      token: "mobile-session-token",
      user: {
        id: user.id,
        openId: user.openId,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
    expect(db.consumeMobileAuthCode).toHaveBeenCalledWith("c".repeat(43));
  });

  it("rejects expired, invalid, or replayed tickets", async () => {
    vi.mocked(db.consumeMobileAuthCode).mockResolvedValue(null);

    await expect(
      createCaller().auth.exchangeMobileCode({ code: "c".repeat(43) })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});

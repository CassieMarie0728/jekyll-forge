import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { parse } from "cookie";
import { withRuntime } from "./runtime";
import { handleOAuthRequest } from "./oauth";
import { sdk, publicUser } from "./sdk";
import { testEnv, testDatabase } from "../test/d1";
import * as db from "../db";

describe("GitHub authentication lifecycle", () => {
  let database: ReturnType<typeof testDatabase>;
  beforeEach(() => {
    database = testDatabase();
  });
  afterEach(() => {
    database.sqlite.close();
    vi.unstubAllGlobals();
  });
  async function begin(mobile = false) {
    const r = await handleOAuthRequest(
      new Request(
        "https://forge.example.test/api/oauth/" +
          (mobile ? "start-mobile" : "start")
      )
    );
    expect(r.status).toBe(302);
    const location = new URL(r.headers.get("location")!);
    expect(location.origin).toBe("https://github.com");
    expect(location.searchParams.get("scope")).toBe("read:user");
    return {
      state: location.searchParams.get("state")!,
      cookie: r.headers.get("set-cookie")!.split(";")[0],
    };
  }
  function mockGitHub() {
    const mocked = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({ access_token: "login-only-token" })
      )
      .mockResolvedValueOnce(
        Response.json({ id: 7, login: "test-owner", name: "Test Owner" })
      );
    vi.stubGlobal("fetch", mocked);
    return mocked;
  }
  it("rejects a callback from another browser before contacting GitHub", async () => {
    await withRuntime(testEnv(database.binding), async () => {
      const { state } = await begin();
      const fetchMock = vi.fn();
      vi.stubGlobal("fetch", fetchMock);
      const response = await handleOAuthRequest(
        new Request(
          "https://forge.example.test/api/oauth/callback?code=test&state=" +
            state,
          { headers: { cookie: "forge_oauth_state=wrong" } }
        )
      );
      expect(response.status).toBe(400);
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });
  it("sets a secure session without persisting the GitHub login token", async () => {
    await withRuntime(testEnv(database.binding), async () => {
      const { state, cookie } = await begin();
      mockGitHub();
      const response = await handleOAuthRequest(
        new Request(
          "https://forge.example.test/api/oauth/callback?code=test&state=" +
            state,
          { headers: { cookie } }
        )
      );
      expect(response.status).toBe(302);
      expect(response.headers.get("location")).toBe("/repos");
      expect(response.headers.get("set-cookie")).toContain("HttpOnly");
      expect(response.headers.get("set-cookie")).toContain("Secure");
      const user = await db.getUserByOpenId("github:7");
      expect(user?.role).toBe("admin");
      expect(user?.githubToken).toBeNull();
      expect(
        publicUser({ ...user!, githubToken: "never-return-this" })
      ).not.toHaveProperty("githubToken");
      const token = await sdk.createSessionToken("github:7");
      expect((await sdk.verifySession(token))?.openId).toBe("github:7");
      expect(await sdk.verifySession(token + "tampered")).toBeNull();
      expect(
        await sdk.verifySession(
          await sdk.createSessionToken("github:7", { expiresInMs: -1000 })
        )
      ).toBeNull();
    });
  });
  it("issues a mobile ticket that can be consumed exactly once", async () => {
    await withRuntime(testEnv(database.binding), async () => {
      const { state, cookie } = await begin(true);
      mockGitHub();
      const response = await handleOAuthRequest(
        new Request(
          "https://forge.example.test/api/oauth/callback?code=test&state=" +
            state,
          { headers: { cookie } }
        )
      );
      const deepLink = new URL(response.headers.get("location")!);
      expect(deepLink.protocol).toBe("jekyllforge:");
      expect(deepLink.hostname).toBe("auth-callback");
      const code = deepLink.searchParams.get("code")!;
      const results = await Promise.all([
        db.consumeMobileAuthCode(code),
        db.consumeMobileAuthCode(code),
      ]);
      expect(results.filter(Boolean)).toHaveLength(1);
      expect(
        database.sqlite.prepare("SELECT codeHash FROM mobile_auth_codes").get()
          ?.codeHash
      ).not.toBe(code);
    });
  });
});

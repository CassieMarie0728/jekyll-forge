import { describe, expect, it } from "vitest";
import { withRuntime } from "./runtime";
import { handleOAuthRequest, appOrigin } from "./oauth";
import { testEnv, testDatabase } from "../test/d1";

describe("GitHub OAuth entry", () => {
  it("uses only the configured origin for mobile authentication", async () => {
    const database = testDatabase();
    await withRuntime(testEnv(database.binding), async () => {
      const response = await handleOAuthRequest(
        new Request("https://untrusted.test/api/oauth/mobile/start")
      );
      expect(await response.json()).toEqual({
        authorizationUrl: "https://forge.example.test/api/oauth/start-mobile",
      });
    });
    database.sqlite.close();
  });
  it("refuses insecure public origins", () => {
    const env = {
      ...testEnv({} as D1Database),
      APP_URL: "http://example.test",
    } as unknown as CloudflareBindings;
    expect(() => withRuntime(env, appOrigin)).toThrow("HTTPS");
  });
});

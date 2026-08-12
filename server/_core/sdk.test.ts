import { describe, expect, it } from "vitest";
import { COOKIE_NAME } from "@shared/const";
import { extractSessionToken } from "./sdk";

describe("extractSessionToken", () => {
  it("prefers a native bearer session token over a browser cookie", () => {
    const token = extractSessionToken({
      headers: {
        authorization: "Bearer native-session-token",
        cookie: `${COOKIE_NAME}=browser-session-token`,
      },
    } as never);

    expect(token).toBe("native-session-token");
  });

  it("uses the browser session cookie when no bearer token is supplied", () => {
    const token = extractSessionToken({
      headers: { cookie: `${COOKIE_NAME}=browser-session-token` },
    } as never);

    expect(token).toBe("browser-session-token");
  });

  it("rejects malformed authorization values", () => {
    const token = extractSessionToken({
      headers: { authorization: "Basic credentials" },
    } as never);

    expect(token).toBeUndefined();
  });
});

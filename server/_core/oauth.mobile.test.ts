import { describe, expect, it } from "vitest";
import { buildMobileAuthorizationUrl } from "./oauth";

describe("buildMobileAuthorizationUrl", () => {
  it("uses the server callback as both redirect URI and encoded exchange state", () => {
    const authorizationUrl = new URL(
      buildMobileAuthorizationUrl(
        "https://jekyllforge.manus.space",
        "https://manus.im",
        "forge-app-id"
      )
    );

    expect(authorizationUrl.pathname).toBe("/app-auth");
    expect(authorizationUrl.searchParams.get("appId")).toBe("forge-app-id");
    expect(authorizationUrl.searchParams.get("redirectUri")).toBe(
      "https://jekyllforge.manus.space/api/oauth/mobile/callback"
    );
    expect(
      Buffer.from(
        authorizationUrl.searchParams.get("state")!,
        "base64"
      ).toString()
    ).toBe("https://jekyllforge.manus.space/api/oauth/mobile/callback");
  });
});

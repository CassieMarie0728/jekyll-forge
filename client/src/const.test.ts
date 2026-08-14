import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getLoginUrl, getSignUpUrl } from "./const";

const oauthPortalUrl = "https://oauth.example.test";
const appId = "jekyll-forge-test-app";

function expectAuthUrl(urlValue: string, type: "signIn" | "signUp") {
  const url = new URL(urlValue);
  const redirectUri = `${window.location.origin}/api/oauth/callback`;

  expect(url.origin).toBe(oauthPortalUrl);
  expect(url.pathname).toBe("/app-auth");
  expect(url.searchParams.get("appId")).toBe(appId);
  expect(url.searchParams.get("redirectUri")).toBe(redirectUri);
  expect(url.searchParams.get("state")).toBe(btoa(redirectUri));
  expect(url.searchParams.get("type")).toBe(type);
}

describe("public authentication URL helpers", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_OAUTH_PORTAL_URL", oauthPortalUrl);
    vi.stubEnv("VITE_APP_ID", appId);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("creates a sign-in URL that returns to the current deployed origin", () => {
    expectAuthUrl(getLoginUrl(), "signIn");
  });

  it("creates a sign-up URL that returns to the current deployed origin", () => {
    expectAuthUrl(getSignUpUrl(), "signUp");
  });
});

import { describe, it, expect } from "vitest";
import { getLoginUrl, getSignUpUrl } from "./const";
describe("GitHub sign-in entry points", () => {
  it("starts server-bound OAuth on the current origin", () => {
    expect(getLoginUrl()).toBe("/api/oauth/start");
    expect(getSignUpUrl()).toBe("/api/oauth/start");
  });
});

import { describe, expect, it } from "vitest";
import { githubApiErrorForStatus } from "./github";

describe("GitHub API error redaction", () => {
  it.each([
    [401, "UNAUTHORIZED", "GitHub authorization failed"],
    [403, "FORBIDDEN", "GitHub denied this request"],
    [404, "NOT_FOUND", "GitHub resource was not found"],
    [500, "INTERNAL_SERVER_ERROR", "GitHub could not complete this request"],
  ])("maps status %i to safe %s guidance", (status, code, message) => {
    const error = githubApiErrorForStatus(status);

    expect(error.code).toBe(code);
    expect(error.message).toContain(message);
    expect(error.message).not.toContain("GitHub API error:");
    expect(error.message).not.toContain("token");
  });
});

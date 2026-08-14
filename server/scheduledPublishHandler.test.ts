import type { Request, Response } from "express";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  authenticateRequest: vi.fn(),
  notifyOwner: vi.fn(),
}));

vi.mock("./_core/sdk", () => ({
  sdk: { authenticateRequest: mocks.authenticateRequest },
}));

vi.mock("./_core/notification", () => ({ notifyOwner: mocks.notifyOwner }));

vi.mock("./db", () => ({
  getScheduledPostByTaskUid: vi.fn(),
  updateScheduledPost: vi.fn(),
  getSiteByIdAny: vi.fn(),
}));

import { scheduledPublishHandler } from "./scheduledPublishHandler";

const consoleError = vi
  .spyOn(console, "error")
  .mockImplementation(() => undefined);

function createResponse() {
  const json = vi.fn();
  const status = vi.fn().mockReturnValue({ json });
  return { response: { status } as unknown as Response, status, json };
}

describe("scheduledPublishHandler error response", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.notifyOwner.mockResolvedValue(true);
  });

  afterAll(() => {
    consoleError.mockRestore();
  });

  it("keeps unexpected internal details out of the HTTP response", async () => {
    mocks.authenticateRequest.mockRejectedValue(
      new Error("upstream secret: https://internal.example.test/token")
    );
    const { response, status, json } = createResponse();

    await scheduledPublishHandler(
      { url: "/api/scheduled/publish-post" } as Request,
      response
    );

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ error: "Scheduled publishing failed" })
    );

    const payload = JSON.stringify(json.mock.calls[0]?.[0]);
    expect(payload).not.toContain("internal.example.test");
    expect(payload).not.toContain("stack");
    expect(payload).not.toContain("context");
    expect(consoleError).toHaveBeenCalledWith(
      "[Scheduler] Unhandled error in publish handler:",
      expect.any(Error)
    );
    expect(mocks.notifyOwner).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Jekyll Forge: Scheduled publish error",
      })
    );
  });
});

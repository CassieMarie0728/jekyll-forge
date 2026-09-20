import { afterEach, describe, expect, it, vi } from "vitest";
import { githubRouter } from "./github";
import type { TrpcContext } from "../_core/context";
vi.mock("../db", () => ({
  getUserByOpenId: vi.fn(async () => ({ githubToken: "test-only-token" })),
  upsertUser: vi.fn(),
}));
const caller = githubRouter.createCaller({
  user: { id: 1, openId: "github:test" },
} as TrpcContext);
afterEach(() => vi.unstubAllGlobals());
describe("repository picker pagination", () => {
  it("reaches a repository beyond the first 100 and stops at the last page", async () => {
    const first = Array.from({ length: 100 }, (_, id) => ({
      id,
      full_name: `owner/repo-${id}`,
    }));
    const target = { id: 101, full_name: "CassieMarie0728/cassie-marie" };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json(first))
      .mockResolvedValueOnce(Response.json([target]));
    vi.stubGlobal("fetch", fetchMock);
    const page1 = await caller.repositories({});
    const page2 = await caller.repositories({ cursor: page1.nextCursor });
    expect(page1.nextCursor).toBe(2);
    expect(page2.items).toEqual([target]);
    expect(page2.nextCursor).toBeUndefined();
    expect(fetchMock.mock.calls[1][0]).toContain("page=2&");
    expect(fetchMock.mock.calls[0][0]).toContain("per_page=100");
  });
  it("reports a failed page rather than presenting an empty complete list", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 403 }))
    );
    await expect(caller.repositories({ cursor: 2 })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });
});

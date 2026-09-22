import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("../db", () => ({
  getUserByOpenId: vi.fn(async () => ({ githubToken: "test-token" })),
  upsertUser: vi.fn(),
}));
import { githubRouter } from "./github";
const caller = githubRouter.createCaller({
  user: { id: 1, openId: "test" },
} as never);
const response = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
const input = {
  owner: "owner",
  repo: "repo",
  branch: "feature/blog",
  path: "_drafts",
};
afterEach(() => vi.unstubAllGlobals());
describe("GitHub review and missing folders", () => {
  it("returns an empty missing folder only after confirming branch access", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(response({}, 404))
      .mockResolvedValueOnce(response({ name: "feature/blog" }));
    vi.stubGlobal("fetch", fetch);
    expect(await caller.listFiles(input)).toEqual([]);
    expect(fetch.mock.calls[1][0]).toContain("branches/feature%2Fblog");
  });
  it("does not hide lost repository access as an empty folder", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response({}, 404)));
    await expect(caller.listFiles(input)).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });
  it("does not turn permission failures into empty files", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response({}, 403)));
    await expect(caller.reviewFile(input)).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });
  it("returns the exact destination content and SHA for review", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        response({
          type: "file",
          sha: "destination-sha",
          content: Buffer.from("old content").toString("base64"),
        })
      )
    );
    expect(await caller.reviewFile(input)).toEqual({
      sha: "destination-sha",
      content: "old content",
    });
  });
  it("rejects invalid YAML without writing config", async () => {
    const fetch = vi.fn().mockResolvedValue(
      response({
        content: Buffer.from("plugins:\n  - seo\n- sitemap\n").toString(
          "base64"
        ),
        sha: "sha",
      })
    );
    vi.stubGlobal("fetch", fetch);
    await expect(
      caller.updateJekyllConfig({
        owner: "owner",
        repo: "repo",
        addPlugin: "jekyll-feed",
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it("preserves nested configuration while adding a plugin", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(
        response({
          content: Buffer.from(
            "collections:\n  books:\n    output: true\nplugins: [jekyll-seo-tag]\n"
          ).toString("base64"),
          sha: "sha",
        })
      )
      .mockResolvedValueOnce(response({}));
    vi.stubGlobal("fetch", fetch);
    const result = await caller.updateJekyllConfig({
      owner: "owner",
      repo: "repo",
      addPlugin: "jekyll-feed",
    });
    expect(result.updatedContent).toContain("output: true");
    expect(result.updatedContent).toContain("- jekyll-feed");
    expect(JSON.parse(fetch.mock.calls[1][1].body).sha).toBe("sha");
  });
});

it("reads the selected branch and nested Jekyll root", async () => {
  const fetch = vi
    .fn()
    .mockResolvedValue(
      response({
        content: Buffer.from("title: Blog\nplugins: [jekyll-feed]\n").toString(
          "base64"
        ),
      })
    );
  vi.stubGlobal("fetch", fetch);
  const config = await caller.getJekyllConfig({
    owner: "owner",
    repo: "repo",
    rootPath: "docs",
    branch: "feature/blog",
  });
  expect(config.plugins).toEqual(["jekyll-feed"]);
  expect(fetch.mock.calls[0][0]).toContain(
    "contents/docs/_config.yml?ref=feature%2Fblog"
  );
});

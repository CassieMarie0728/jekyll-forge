import { describe, expect, it, vi, afterEach } from "vitest";
const mocks = vi.hoisted(() => ({
  getSiteById: vi.fn(),
  getUserByOpenId: vi.fn(),
  findAssetByHash: vi.fn(),
  createAsset: vi.fn(),
  updateAsset: vi.fn(),
  getAssetById: vi.fn(),
}));
vi.mock("../db", () => mocks);
import { assetsRouter, repositoryAssetPath } from "./assets";
afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("GitHub repository assets", () => {
  it("rejects hidden and traversal paths", () => {
    for (const path of [
      "../secrets",
      ".github/workflows/run.yml",
      "assets/../x",
      "assets\\x",
      "assets/x?ref=main",
    ]) {
      expect(() => repositoryAssetPath(path)).toThrow("Invalid asset path");
    }
  });
  it("commits under the configured site root and returns an authenticated preview", async () => {
    mocks.getSiteById.mockResolvedValue({
      id: 9,
      owner: "owner",
      repo: "repo",
      rootPath: "blog",
      defaultAssetPath: "/assets/images",
      selectedBranch: "drafts",
    });
    mocks.getUserByOpenId.mockResolvedValue({ githubToken: "test-only-pat" });
    mocks.findAssetByHash.mockResolvedValue(undefined);
    mocks.createAsset.mockResolvedValue(42);
    mocks.getAssetById.mockResolvedValue({
      id: 42,
      storageUrl: "/api/assets/42",
    });
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        Response.json({
          content: {
            sha: "new-sha",
            download_url: "https://raw.example.test/temporary",
          },
        })
      );
    vi.stubGlobal("fetch", fetchMock);
    const result = await assetsRouter
      .createCaller({ user: { id: 7, openId: "github:7" } } as never)
      .upload({
        siteId: 9,
        name: "image.png",
        path: "ignored/unsafe.yml",
        mimeType: "image/png",
        size: 5,
        base64Content: Buffer.from("image").toString("base64"),
      });
    expect(fetchMock.mock.calls[0][0]).toMatch(
      /contents\/blog\/assets\/images\/[a-f0-9]{12}-image.png$/
    );
    const commit = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(commit.branch).toBe("drafts");
    expect(commit).not.toHaveProperty("sha");
    expect(mocks.createAsset).toHaveBeenCalledWith(
      expect.objectContaining({ branch: "drafts", userId: 7, storageUrl: null })
    );
    expect(mocks.updateAsset).toHaveBeenCalledWith(42, 7, {
      storageUrl: "/api/assets/42",
    });
    expect(result.storageUrl).toBe("/api/assets/42");
  });
});

import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getAssetsBySiteId: vi.fn(),
  getAssetById: vi.fn(),
  getSiteById: vi.fn(),
  createAsset: vi.fn(),
  updateAsset: vi.fn(),
  deleteAsset: vi.fn(),
  findAssetByHash: vi.fn(),
  storagePut: vi.fn(),
  invokeLLM: vi.fn(),
  optimizeImage: vi.fn(),
  optimizeImageSet: vi.fn(),
  getImageMetadata: vi.fn(),
  isImageBuffer: vi.fn(),
}));

vi.mock("../db", () => ({
  getAssetsBySiteId: mocks.getAssetsBySiteId,
  getAssetById: mocks.getAssetById,
  getSiteById: mocks.getSiteById,
  createAsset: mocks.createAsset,
  updateAsset: mocks.updateAsset,
  deleteAsset: mocks.deleteAsset,
  findAssetByHash: mocks.findAssetByHash,
}));
vi.mock("../storage", () => ({ storagePut: mocks.storagePut }));
vi.mock("../_core/llm", () => ({ invokeLLM: mocks.invokeLLM }));
vi.mock("../imageOptimizer", () => ({
  optimizeImage: mocks.optimizeImage,
  optimizeImageSet: mocks.optimizeImageSet,
  getImageMetadata: mocks.getImageMetadata,
  isImageBuffer: mocks.isImageBuffer,
}));

import { assetsRouter } from "./assets";

function createCaller(userId = 7) {
  return assetsRouter.createCaller({ user: { id: userId } } as never);
}

describe("asset re-optimization ownership", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("rejects an unowned asset before making a fetch request", async () => {
    mocks.getAssetById.mockResolvedValueOnce(undefined);
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      createCaller().reoptimize({ id: 42, outputFormat: "webp" })
    ).rejects.toThrow("Asset not found");

    expect(mocks.getAssetById).toHaveBeenCalledWith(42, 7);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects an unowned upload site before processing upload data", async () => {
    mocks.getSiteById.mockResolvedValueOnce(undefined);

    await expect(
      createCaller().upload({
        siteId: 9,
        name: "image.png",
        path: "assets/image.png",
        base64Content: Buffer.from("image").toString("base64"),
        mimeType: "image/png",
        size: 5,
      })
    ).rejects.toThrow("Site not found");

    expect(mocks.getSiteById).toHaveBeenCalledWith(9, 7);
    expect(mocks.storagePut).not.toHaveBeenCalled();
    expect(mocks.createAsset).not.toHaveBeenCalled();
  });

  it("preserves existing GitHub images and directs optimization to a new upload", async () => {
    mocks.getAssetById.mockResolvedValueOnce({ id: 42, userId: 7, siteId: 9 });
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(
      createCaller().reoptimize({ id: 42, outputFormat: "webp" })
    ).rejects.toThrow("Existing GitHub images are preserved");
    expect(fetchMock).not.toHaveBeenCalled();
    expect(mocks.updateAsset).not.toHaveBeenCalled();
  });
});

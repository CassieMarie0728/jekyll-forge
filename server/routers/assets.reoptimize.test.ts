import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getAssetsBySiteId: vi.fn(),
  getAssetById: vi.fn(),
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

  it("fetches only the caller-owned persisted storage URL", async () => {
    mocks.getAssetById.mockResolvedValueOnce({
      id: 42,
      userId: 7,
      siteId: 9,
      storageUrl: "https://storage.example.test/owned-image.png",
    });
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer,
    });
    vi.stubGlobal("fetch", fetchMock);
    mocks.optimizeImage.mockResolvedValueOnce({
      data: Buffer.from("optimized"),
      mimeType: "image/webp",
      size: 9,
      width: 100,
      height: 80,
    });
    mocks.storagePut.mockResolvedValueOnce({
      url: "/manus-storage/optimized.webp",
    });

    await createCaller().reoptimize({ id: 42, outputFormat: "webp" });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://storage.example.test/owned-image.png"
    );
    expect(mocks.storagePut).toHaveBeenCalledWith(
      expect.stringMatching(/^assets\/7\/9\//),
      expect.any(Buffer),
      "image/webp"
    );
  });
});

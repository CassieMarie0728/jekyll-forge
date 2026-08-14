import { describe, expect, it, vi } from "vitest";
import {
  SOCIAL_ANALYTICS_PLATFORMS,
  getUserAnalyticsForSupportedPlatforms,
} from "./socialMedia";

describe("social analytics platform coverage", () => {
  it("queries every supported platform using the caller identity", async () => {
    const getByPlatform = vi.fn().mockResolvedValue([]);

    await expect(
      getUserAnalyticsForSupportedPlatforms(7, getByPlatform)
    ).resolves.toEqual([]);

    expect(SOCIAL_ANALYTICS_PLATFORMS).toEqual([
      "twitter",
      "linkedin",
      "facebook",
      "instagram",
    ]);
    expect(getByPlatform).toHaveBeenCalledTimes(4);
    expect(getByPlatform).toHaveBeenNthCalledWith(1, 7, "twitter");
    expect(getByPlatform).toHaveBeenNthCalledWith(2, 7, "linkedin");
    expect(getByPlatform).toHaveBeenNthCalledWith(3, 7, "facebook");
    expect(getByPlatform).toHaveBeenNthCalledWith(4, 7, "instagram");
  });
});

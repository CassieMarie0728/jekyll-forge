import {
  DEFAULT_MOBILE_API_BASE_URL,
  getMobileApiBaseUrl,
  getMobileTrpcUrl,
} from "./apiBaseUrl";

describe("mobile API base URL", () => {
  it("uses the deployed HTTPS API when no explicit override is present", () => {
    expect(getMobileApiBaseUrl()).toBe(DEFAULT_MOBILE_API_BASE_URL);
    expect(getMobileTrpcUrl()).toBe(
      "https://jekyllforge.manus.space/api/trpc"
    );
  });

  it("normalizes explicit base and tRPC endpoint overrides", () => {
    expect(getMobileApiBaseUrl("https://preview.example.test/")).toBe(
      "https://preview.example.test"
    );
    expect(getMobileTrpcUrl("https://preview.example.test/api/trpc")).toBe(
      "https://preview.example.test/api/trpc"
    );
  });
});

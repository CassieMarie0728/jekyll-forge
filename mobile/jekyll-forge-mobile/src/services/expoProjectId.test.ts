jest.mock("expo-constants", () => ({
  __esModule: true,
  default: {
    expoConfig: {
      extra: {
        eas: {
          projectId: "configured-project-id",
        },
      },
    },
  },
}));

import { getExpoProjectId } from "./expoProjectId";

describe("getExpoProjectId", () => {
  const originalProjectId = process.env.EXPO_PUBLIC_EAS_PROJECT_ID;

  afterEach(() => {
    if (originalProjectId === undefined) {
      delete process.env.EXPO_PUBLIC_EAS_PROJECT_ID;
      return;
    }

    process.env.EXPO_PUBLIC_EAS_PROJECT_ID = originalProjectId;
  });

  it("uses the configured Expo project ID when no environment override is present", () => {
    delete process.env.EXPO_PUBLIC_EAS_PROJECT_ID;

    expect(getExpoProjectId()).toBe("configured-project-id");
  });

  it("allows an explicit environment override for alternate build profiles", () => {
    process.env.EXPO_PUBLIC_EAS_PROJECT_ID = "environment-project-id";

    expect(getExpoProjectId()).toBe("environment-project-id");
  });
});

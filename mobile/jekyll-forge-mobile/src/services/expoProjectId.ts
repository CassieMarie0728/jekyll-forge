import Constants from "expo-constants";

export function getExpoProjectId(): string | undefined {
  const configuredProjectId = Constants.expoConfig?.extra?.eas?.projectId;

  if (typeof process.env.EXPO_PUBLIC_EAS_PROJECT_ID === "string") {
    return process.env.EXPO_PUBLIC_EAS_PROJECT_ID;
  }

  return typeof configuredProjectId === "string"
    ? configuredProjectId
    : undefined;
}

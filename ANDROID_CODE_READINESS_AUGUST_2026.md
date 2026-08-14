# Android Code Readiness — August 2026

## Scope

This pass verified the Android companion's code-verifiable offline recovery, notification configuration, and release packaging contracts. It did not replace the separate owner-run device, Play Console, or production-distribution gates.

| Area | Verified behavior | Result |
| --- | --- | --- |
| Offline queue durability | The queue is persisted through `offlineStorage`; queued actions include create, update, delete, publish, scheduler, social-disconnect, and A/B variation publishing contracts. | **Pass** |
| Network recovery | `NetInfo` triggers online status changes and pending work is replayed through the configured processor. | **Pass** |
| Conflict/failure preservation | Failed work increments retries; after three attempts it remains in the durable queue with `failed` status and a human-readable `lastError` for recovery. | **Pass** |
| Expo project identity | Push-token registration reads the configured `extra.eas.projectId` and permits an explicit environment override for alternate build profiles. | **Pass** |
| Android notification permission | The resolved Expo configuration contains `android.permission.POST_NOTIFICATIONS`; the notification plugin and branded notification icon remain configured. | **Pass** |
| Play submission safety | The EAS submission profile no longer points `serviceAccountKeyPath` at Firebase `google-services.json`. | **Pass** |
| Android packaging profiles | Development and preview profiles emit internal APKs; production is configured for an Android App Bundle. | **Pass** |

## Corrections Applied

The push-registration service previously required `EXPO_PUBLIC_EAS_PROJECT_ID`, even though the approved project ID exists in the Expo configuration. The service now uses the configuration value by default and retains the environment variable only as an explicit override. Regression coverage verifies both paths.

The manifest now explicitly declares Android's notification permission. In addition, the incorrect EAS submission mapping from `google-services.json` was removed: Firebase configuration is not a Google Play service-account credential and must never be passed to the Play submission command.

## Validation

The companion app passes TypeScript compilation, all seven Jest suites with 20 tests, and the configured ESLint command with zero errors and warnings (apart from the established TypeScript-version compatibility notice emitted by the parser). Expo's resolved public configuration confirms the package identifier, EAS project ID, notification icon, and notification permission.

## Remaining Owner-Controlled Gates

The following acceptance steps remain intentionally open: real-device OAuth and offline-network transition testing, user permission acceptance/denial behavior for notifications, Google Play Console enrollment, a real Play service-account key, and a signed production App Bundle submission. These checks require an owner-controlled physical device or credentials and are listed in `OWNER_RELEASE_ACCEPTANCE_CHECKLIST.md`.

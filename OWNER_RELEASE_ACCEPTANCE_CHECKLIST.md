# Owner Release Acceptance Checklist

## Purpose

The application code, security hardening, configuration, and automated validation are complete to the extent that they can be verified in the managed development environment. The remaining items require an account you control, a physical Android device, Google Play Console access, or a less resource-constrained production build environment. This checklist records the exact evidence required to close those gates without treating them as code defects.

> Do not enter personal credentials, access tokens, service-account JSON, or Play Console payment information into source control, screenshots, or issue text.

## Current Verified Baseline

| Area | Verified state |
|---|---|
| Web test suite | 26 files passed; 151 tests passed; 7 intentional skips |
| Web static checks | TypeScript and Drizzle migration checks pass; lint has zero errors and 224 tracked legacy warnings |
| Android code checks | TypeScript, Jest, lint, Expo configuration, and SDK compatibility checks passed in the prior release validation |
| Android identity | Package: `com.cassandracrossno.jekyllforge`; deep link: `jekyllforge://auth-callback`; configured Expo project: `1921924b-7b89-4e88-92f5-0df9717315e9` |
| Android release assets | Application, adaptive, splash, and notification assets are configured; Firebase `google-services.json` matches the Android package |
| Production site | Published at `https://jekyllforge.manus.space` |

## 1. Web OAuth and Authenticated-Flow Acceptance

Use a real account and a repository you are willing to connect for this test. This validates the external identity and GitHub steps that automated tests cannot safely complete.

| Step | Action | Passing evidence |
|---|---|---|
| 1 | Open `https://jekyllforge.manus.space` in a normal browser session. | Landing page loads with labeled Sign In and Sign Up controls. |
| 2 | Open a fresh private browser window and visit an authenticated route directly. | The route denies unauthenticated access or redirects to the supported sign-in flow; no protected data is displayed. |
| 3 | Complete the supported sign-in flow. | You return to Jekyll Forge with an authenticated session. |
| 4 | Select a repository in the repository picker. | The chosen repository appears in the workspace and its common Jekyll structure is readable. |
| 5 | Open the dashboard, create a harmless draft, save it, then discard it or use a disposable repository. | Dashboard loads, the draft state persists, and no unrelated site data is visible. |
| 6 | Sign out and revisit the protected route. | The session is cleared and access is denied again. |

Record the browser/device, date, test repository, and pass/fail result in the audit evidence log after completing the run.

## 2. Android Real-Device OAuth and Offline-Recovery Acceptance

Run this only on a physical Android device. Emulator success does not substitute for deep-link, device storage, notification permission, and background-network behavior.

| Step | Action | Passing evidence |
|---|---|---|
| 1 | Install a development or internal Android build configured with the production package and Firebase file. | App opens under the expected package identity. |
| 2 | Start mobile sign-in and complete it in the system browser. | The `jekyllforge://auth-callback` deep link returns to the app; no bearer token is displayed in the browser URL. |
| 3 | Restart the app after sign-in. | The authenticated session restores without re-entering credentials. |
| 4 | Create or edit a draft while online. | The draft is saved and appears after reopening the app. |
| 5 | Disable network access, make one change in each supported queued mutation flow, then restore network access. | Each action reports a queued retry while offline and synchronizes once connectivity returns without duplicating records. |
| 6 | Exercise scheduled-post cancellation and rescheduling. | The native Android modal accepts a future time, and the updated state appears after refresh. |
| 7 | Grant notification permission and register the device. | Registration succeeds; revocation or sign-out removes the device registration. |

Capture a short test log containing device model, Android version, build identifier, network transition result, and any failure messages. Do not include tokens.

## 3. Google Play Console and Signed Release Gate

Google Play enrollment and service-account access are prerequisites for this gate. The application should not be represented as publicly available in Google Play until this is complete.

| Step | Action | Passing evidence |
|---|---|---|
| 1 | Complete Google Play Console enrollment for the publisher account. | The Play Console project is accessible under the owner-controlled account. |
| 2 | Create or select the app using package `com.cassandracrossno.jekyllforge`. | Package name matches the configured Android app identity exactly. |
| 3 | Configure the Android signing and distribution credentials through the approved secure channel. | Credentials are available to the build service but are not committed to the repository. |
| 4 | Produce a signed Android App Bundle through the configured EAS/Expo release workflow. | The build completes successfully and reports the expected package name and version. |
| 5 | Upload the bundle to an internal testing track before any broader distribution. | Play Console accepts the bundle and an internal tester can install it. |
| 6 | Repeat the Android acceptance run from Section 2 using that signed build. | OAuth, local persistence, offline replay, scheduling, and notification checks pass. |

## 4. Managed-Environment Vite Build Gate

The local managed sandbox terminates `pnpm build` with `SIGTERM` during Rollup chunk rendering after all 6,597 modules transform. This is documented as a managed resource/watchdog limitation; it is not accompanied by TypeScript, lint, test, or migration failures, and the production site is already deployed.

| Decision | Required evidence |
|---|---|
| Preserve current runtime behavior | Confirm the production site remains available and the normal release validation gates pass. This is the currently approved disposition. |
| Attempt later bundle optimization | Perform the editor/diagram lazy-loading work in a dedicated branch or checkpoint, then verify authenticated editor and diagram flows before replacing the deployed build configuration. |
| Validate in a higher-capacity build environment | Run `pnpm build` there and archive the successful output/log; do not change application behavior solely to satisfy the constrained sandbox. |

## Completion Record

| Gate | Owner | Date | Result | Evidence location |
|---|---|---|---|---|
| Web OAuth and authenticated workspace |  |  |  |  |
| Android real-device OAuth and offline recovery |  |  |  |  |
| Google Play internal release |  |  |  |  |
| Production/higher-capacity Vite build confirmation |  |  |  |  |

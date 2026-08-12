# Independent Audit Evidence — August 2026

## Baseline Validation

| Check | Result | Evidence |
|---|---:|---|
| Web unit and integration tests | Pass | 12 test files: 117 passed, 7 skipped |
| TypeScript | Pass | `pnpm check` completed with no errors |
| Production build | Pass with findings | Vite build completed; CSS import-order warning and chunks above 500 kB remain |
| Drizzle metadata | Pass | `drizzle-kit check` reported no schema-metadata drift |

## Public Route Inspection

On 12 August 2026, `https://jekyllforge.manus.space/` hydrated successfully. The public route exposed the expected Sign In, Sign Up, Start Forging Free, See Workflow, FAQ, and Get Started Free controls. The earlier broken hero target now resolves to the rendered Workflow overview section.

The deployed copy accurately labels Android functionality as undergoing release validation; however, the public route still makes capability claims that require evidence from the authenticated workspace and connected third-party services before they can be considered independently verified.

The public `See Workflow` button was activated on the deployed route and scrolled to the `workflow-overview` section as intended. DOM inspection confirmed one H1 followed by section-level H2 headings and descriptive text-bearing buttons for all 11 focusable controls. A visual review also found that the target section includes a prominent decorative play icon without a playable asset or button behavior. This is a misleading affordance and is logged for remediation rather than treated as a working demo.

Unauthenticated navigation to `/dashboard/1` did not expose dashboard content. It redirected to the configured Manus sign-in endpoint with the deployed callback URL. Completing OAuth and entering a user account would require account credentials and user confirmation, so the authenticated repository-picker and dashboard portions remain explicitly unverified in this independent browser pass.

## API Authorization and Contract Review

The tRPC `protectedProcedure` middleware correctly rejects requests without `ctx.user`, and the reviewed post, site, social-account, analytics, and scheduled-social-post helpers include user-ID predicates for direct record access. The review found two reproducible authorization/contract gaps:

1. `scheduler.markPublished` and `scheduler.markFailed` invoke the unscoped scheduled-post update helper without verifying that the scheduled-post ID belongs to the caller. The scheduler create path also accepts a `siteId` without first confirming the site belongs to that user.
2. `socialMedia.syncAnalytics` always calls `getTweetMetrics`, including for LinkedIn analytics records, while publishing and metric dispatch rely on `any` casts despite each platform exposing different service methods. Analytics queries are also limited to Twitter and LinkedIn though the account model includes Facebook and Instagram.

These findings are queued for code remediation and regression coverage; social access/refresh tokens remain redacted from account query responses.

## Android Companion Audit

The Android TypeScript check and two SecureStore-focused Jest tests pass. The mobile lint command fails before linting because the ESLint 8 flat-config interface rejects its `--ext` option. The installed project is Expo SDK 50 / React Native 0.73 rather than the newer SDK versions mentioned in prior working notes; its local Expo CLI does not include an executable doctor command.

The current mobile authentication implementation cannot complete against the deployed web backend: `LoginScreen` requests an unimplemented `/api/oauth/authorize` endpoint, uses a hard-coded `jekyllforge://auth-callback`, and expects a POST callback that returns `{ token, user }`; the web backend only supplies the browser session-cookie callback endpoint. In addition, `App.tsx` reads the request token from AsyncStorage despite the credential having been moved to SecureStore, leaving authenticated mobile tRPC calls without the stored credential.

NetInfo and a sync processor are configured, but no screen calls `queueAction`, so offline writes are not produced. Failed queued items are removed after the fourth failure, which can discard unsynchronized user work. Android release configuration is blocked by missing icon, splash, adaptive-icon, notification-icon, and Firebase files, plus placeholder EAS project and update URLs. These are external release inputs, not safely inventable values.

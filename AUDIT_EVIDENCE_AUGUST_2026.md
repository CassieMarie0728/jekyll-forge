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

On 14 August 2026, the deployed landing page again hydrated successfully and exposed the expected Sign In, Sign Up, Start Forging Free, See Workflow, six FAQ disclosure controls, and Get Started Free. The visual viewport showed a discernible focus ring around the active Sign Up control, and the public copy accurately described the Android companion as being in release validation rather than generally available. The page retains one H1 and organized H2/H3 section headings in its rendered content. The authenticated call-to-action targets remain intentionally unverified because completing them requires a user-controlled identity-provider session.

The live DOM inspection found 11 clearly named public buttons and no unlabeled interactive control in the landing route. A keyboard Tab step placed a visible focus ring on the Sign In control. The rendered heading sequence begins with one H1, then moves through H2 sections and subordinate H3 feature, workflow, integration, and FAQ headings without an unexpected level jump. These controls start authentication or in-page workflow behavior via client-side buttons, so a non-authenticated inspection does not expose an external `href` target to verify.

The public copy was refined after this inspection to remove unsupported exclusivity, instant-connection, and performance-impact claims, and to describe Android offline synchronization as pending real-device acceptance rather than an incomplete feature claim. Separately, the scheduled publishing handler was hardened so unexpected errors are retained in trusted server-side diagnostics and owner notifications but return only a generic `Scheduled publishing failed` response plus timestamp. The focused regression test and the final web suite passed after this change (19 files, 133 tests, 7 intentional skips).

Direct metadata inspection on 14 August 2026 confirmed the deployed document has a specific title and description plus `og:title`, `og:description`, `og:type`, `og:url`, `twitter:card`, `twitter:title`, and `twitter:description` values. The non-interactive authentication helper tests independently verify that Sign In and Sign Up produce an `/app-auth` URL with the current-origin callback, encoded state, application identifier, and the correct `signIn` or `signUp` intent; no external identity-provider interaction was started. The deployed stylesheet exposes a `prefers-reduced-motion: reduce` media rule that reduces animation and transition durations, limits animation iteration, and changes scrolling to `auto`.

The shared GitHub client was also hardened after the protected-procedure inventory found that it surfaced a raw upstream response message. It now maps 401, 403, 404, and unexpected GitHub responses to generic, status-appropriate tRPC messages without exposing the upstream body. The complete web gate then passed with 20 files, 137 tests, and 7 intentional skips; lint retained its established 229 warnings with zero errors, TypeScript passed, and Drizzle reported no metadata drift.

On 14 August 2026, the current deployed landing page hydrated successfully after the latest checkpoint. Its public controls, workflow target, FAQ disclosures, and corrected Android availability language were present. The new accountable hero, social, analytics, and Android-offline copy also appeared in the live response. No public link was activated and no external authentication session was initiated during this QA pass.

The live QA pass also identified and removed the remaining unsupported instant-result and optimization wording from the workflow section. The public copy now describes the supported GitHub connection flow, platform-specific content formatting, and user-chosen scheduling time without promising immediate connection, optimal timing, or performance impact. The focused landing regression test and TypeScript check passed after the revision.

The continuing protected-procedure review identified a high-severity A/B testing ownership gap: its procedures accepted a post ID while querying or mutating variation, result, and summary records through helpers that only filtered by post or row ID. The remediation now checks the caller-owned post before every A/B operation, adds `userId` to A/B helper predicates, and scopes variation-status updates by post, user, and variation index. The added ownership regression test rejects an unowned post and proves owned reads receive the caller ID. The full web gate passed afterward with 21 files, 139 tests, 7 intentional skips, zero lint errors, and clean TypeScript and Drizzle validation.

The social-path review additionally found that analytics synchronization searched only Twitter and LinkedIn records despite supporting Facebook and Instagram. A centralized supported-platform list now queries all four platforms using the caller ID before locating the requested record. Focused regression coverage proves the complete user-scoped platform set is queried. The full web gate then passed with 22 files, 140 tests, 7 intentional skips, zero lint errors, and clean TypeScript and Drizzle validation.

The asset-path review found that re-optimization trusted a caller-supplied storage URL and fetched it before verifying the asset record. The endpoint now loads the caller-owned asset first and uses only its persisted storage URL and site ID; an unowned or missing asset returns before a network fetch. Focused regression coverage proves both the rejection-before-fetch behavior and persisted-URL use. The full web gate then passed with 23 files, 142 tests, 7 intentional skips, zero lint errors, and clean TypeScript and Drizzle validation.

The snapshot-path review found that creation accepted a site ID and optional post ID without validating their ownership relationship. Snapshot creation now confirms the caller-owned site and, when supplied, a caller-owned post associated with that same site. The regression test covers an unowned site, a cross-site post, and a valid snapshot reference. The full web gate then passed with 24 files, 145 tests, 7 intentional skips, zero lint errors, and clean TypeScript and Drizzle validation.

The continuing asset review found that upload accepted a site ID without checking caller ownership before decoding, optimizing, storing, and persisting the file. Asset upload now resolves the referenced site under the caller identity before any upload processing. The focused regression test proves an unowned site is rejected before storage or asset persistence. The full web gate then passed with 24 files, 146 tests, 7 intentional skips, zero lint errors, and clean TypeScript and Drizzle validation.

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

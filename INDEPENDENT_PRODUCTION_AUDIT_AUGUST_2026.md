# Independent Production-Readiness Audit

**Project:** Jekyll Forge  
**Audit period:** August 12, 2026  
**Scope:** Web application, landing experience, API and data boundary, database migration state, and Android companion source  
**Method:** Fresh source review, deployed public-route inspection, unauthenticated protected-route inspection, static contract review, type checking, automated tests, production builds, and migration validation.

## Executive Assessment

The web platform is in a substantially stronger state following this independent pass. Public navigation, the protected-route boundary, metadata and reduced-motion behavior, authorization checks, social-token redaction, scheduler, A/B testing, snapshot, repurposing, and post site-ownership controls, supported-platform analytics synchronization, asset-fetch and upload-site controls, upstream-error redaction, and migration parity were independently examined. The web test suite now completes deterministically with **151 passing tests and 7 intentional skips**, and TypeScript and Drizzle migration validation pass. A managed-sandbox production build now reaches all 6,597 transformed modules but receives an external `SIGTERM` during Vite chunk rendering; the already deployed application remains available, and the owner-approved disposition is to preserve current runtime behavior and defer a deeper editor/diagram bundle refactor to a separately controlled optimization pass.

The Android companion is **not release-ready**. The native sign-in contract has now been remediated in source: it starts server-backed OAuth, receives a short-lived one-time deep-link ticket, exchanges that ticket through tRPC, and stores the resulting session in SecureStore. The mobile client compiles every referenced procedure against the shared `AppRouter` type contract, and its scheduling, social, AI, A/B testing, post-status, and repurposing screens use verified server procedures. The editor now commits drafts and published posts through authenticated GitHub and post mutations, while failure paths preserve a local draft and enqueue typed retry payloads. A real-device acceptance run through the external identity provider and network transition is still required. The owner has supplied the Expo project ID, Firebase Android configuration, and approved branded release artwork for `com.cassandracrossno.jekyllforge`; the remaining distribution blocker is future Google Play enrollment and credentials.

> **Release conclusion:** The web application is suitable for continued deployed use subject to normal authenticated-flow testing with a real account. The Android app should remain in internal development until real-device OAuth and offline recovery acceptance, plus the Play release input, are completed.

| Area | Assessment | Release decision |
|---|---|---|
| Web application and server | Verified source health; managed-sandbox build rendering is externally terminated after module transformation | Deployable with routine monitoring; track build-environment constraint |
| Public landing experience | Public controls, workflow target, metadata, and motion safeguards inspected | Deployable |
| API and database | User-scoped access reviewed; scheduler authorization gap remediated; schema checks pass | Deployable |
| Android companion | Compiles, tests, uses the shared server contract, and persists editor/social failures for authenticated retry; device acceptance remains | **Do not release** |
| Android distribution | Branded asset configuration is installed and validated; Play enrollment and credentials remain unavailable | **Externally blocked** |

## Validation Evidence

| Verification | Result | Evidence |
|---|---:|---|
| Web automated suite | **26 files passed; 151 tests passed; 7 skipped** | Final `pnpm test` after post upsert site-ownership coverage |
| Web type safety | **Pass** | `pnpm check` (`tsc --noEmit`) |
| Web lint | **Pass with 229 warnings, 0 errors** | Root ESLint was aligned to ESLint 9 / TypeScript-ESLint 8, automatic formatting fixes were applied, and mobile owns its separate lint configuration |
| Production web/server build | **Managed-environment constraint** | Three isolated `pnpm build` attempts reached 6,597 transformed modules and then received external `SIGTERM` (exit 143) during Vite chunk rendering; explicit source-map/minifier/reporting settings and a detached process did not change the termination. The deployed site remains available. |
| Migration consistency | **Pass** | `pnpm exec drizzle-kit check` reported “Everything's fine” |
| Mobile TypeScript | **Pass** | `pnpm exec tsc --noEmit` in `mobile/jekyll-forge-mobile` |
| Mobile Jest | **Pass** | 6 files and 18 tests passed |
| Mobile lint | **Pass with 0 warnings, 0 errors** | Local ESLint flat config now resolves correctly; safe screen-level route typing, unused-prop cleanup, image-picker typing, explicit haptics/notification contracts, draft-cache/storage typing, narrowed tRPC/alert error handling, component typing, and final asset/settings storage contracts removed the tracked warning baseline |
| Resolved Expo configuration | **Pass** | `pnpm exec expo config --json --type public` resolves the Expo configuration with all four Android asset paths present |
| Expo/Firebase identity | **Pass** | Resolved Expo config, EAS project ID, update URL, and Firebase package all match `com.cassandracrossno.jekyllforge` |
| Deployed public landing | **Pass with scope limit** | Landing loaded; public controls and workflow anchor inspected |
| Protected web route without session | **Pass** | `/dashboard/1` redirected to configured sign-in; dashboard content was not exposed |

## Verified Remediations Completed in This Pass

| Severity | Finding | Remediation | Regression coverage / verification |
|---|---|---|---|
| High | Scheduler recovery mutations could update a scheduled post by ID without confirming ownership. New schedules did not validate site ownership. | `markPublished`, `markFailed`, and schedule creation now resolve caller-owned records/site first. | New `server/routers/scheduler.test.ts` covers cross-user denial, owned completion, and unowned-site scheduling denial. |
| High | Social analytics synchronization always attempted the Twitter metrics method, including for LinkedIn records. | Metrics now dispatch by platform through typed Twitter, LinkedIn, Facebook, and Instagram service methods. | Web type check and social-router suite pass. |
| High | Android request headers used stale AsyncStorage token lookup after credentials moved to SecureStore. | Android tRPC client initialization in `App.tsx` now reads `authToken` from SecureStore. | Mobile TypeScript and auth tests pass. |
| High | Android login requested nonexistent server endpoints and expected a JSON token from a browser-only callback. | Added mobile OAuth start/callback routes, durable hashed single-use mobile tickets, a protected tRPC ticket exchange, and bearer-session extraction. Session tokens are never placed in deep-link URLs. | Eight focused mobile OAuth/auth tests cover URL construction, callback state binding, ticket issuance, replay denial, bearer extraction, and ticket exchange. |
| High | App-level and screen-level tRPC clients normalized API URLs differently. | Reused a normalized API URL factory across the provider and login exchange. | Android TypeScript and Jest pass. |
| High | Android screens referred to unsupported tRPC procedure names and untyped payloads. | Replaced the temporary adapter with the shared type-only `AppRouter` contract and aligned AI, post status, repurposing, scheduler, social analytics/publishing, and A/B testing calls. Added the missing ownership-protected `scheduler.reschedule` mutation. | Android TypeScript passes; focused scheduler suite passes 5/5. |
| High | Android editor reported publication success without an authenticated repository write, and offline queue infrastructure had no producers. | Editor now selects a connected site, commits Jekyll drafts/posts through `github.commitFile`, persists post metadata, and preserves local drafts. Typed queue payloads retry repository commits, social publishing, post-status updates, scheduler changes, social disconnects, and A/B variation publishing when online. | Android TypeScript passes; editor helper, queue contract, producer, and replay-dispatcher tests cover payload serialization, validation, enqueue calls, and dispatch to every supported typed server mutation. |
| Medium | AI assistant attempted to return generated text through an undefined `Editor` route, leaving generated content unavailable in the editor tab. | The assistant now targets the nested `AppStack` → `EditorTab` route, and the editor accepts the generated content as unsaved draft input. | Android TypeScript, Jest, and lint pass after the route correction. |
| High | Android’s scheduled-post rescheduling relied on `Alert.prompt`, which is not available on Android. | Replaced the prompt with a native modal input dialog, explicit future-date validation, typed route parameters, and the existing authenticated/offline retry mutation flow. | Android TypeScript, Jest, and lint pass; no lint warnings remain. |
| Medium | Offline `publish` work was dispatched to social publishing despite being a different domain action. | The processor now retains that work as an explicit unsupported failure until a server-backed GitHub publishing contract exists. | Android sync regression tests pass. |
| High | Android offline failures were removed after retry exhaustion, risking silent loss of user changes. | Queue items now transition to retained `failed` state with a retry count and error text. | New `syncService.test.ts` verifies retention of a terminally failed operation. |
| Medium | Android lint script used an obsolete `--ext` flag and inherited incompatible root configuration. | Added a local mobile flat ESLint configuration and corrected the lint command. | Lint now completes with zero errors. |
| Medium | Custom icon-only AppLayout controls lacked accessible names and explicit keyboard-focus treatment. | Added labels and `focus-visible` ring styles for user menu, sidebar, and mobile-menu controls. | Web type check and dashboard/public-shell tests pass. |
| Medium | Protected-route redirect logic was executed during render. | Redirect responsibility moved to the existing `useAuth` effect-driven path. | Type check and protected-route browser inspection pass. |
| Medium | Workflow card presented a nonfunctional play affordance. | Replaced it with noninteractive workflow artwork; the separate hero CTA retains the truthful “See Workflow” destination. | Landing test and browser inspection pass. |
| Low | Production CSS emitted a Google-Fonts import-order warning. | Moved font loading to document-head links and removed stylesheet import. | Clean production build after the change. |
| Low | A/B tests depended on live LLM latency and intermittently timed out. | Converted the unit-test dependency to a deterministic LLM mock. | A/B suite completes in approximately 1.6 seconds; complete suite passes. |
| Medium | The scheduled publishing endpoint returned unexpected upstream error messages and stack traces in its HTTP 500 response. | Retained detailed server-side diagnostics and owner notifications, while returning only a generic failure message and timestamp to the caller. | `server/scheduledPublishHandler.test.ts` proves an injected internal URL and stack/context details are absent from the response while diagnostic logging still occurs. |
| Medium | The shared GitHub client returned the raw upstream `body.message` through protected tRPC procedures. | Replaced raw upstream messages with safe status-specific guidance for authorization, access, missing-resource, and unexpected GitHub failures. | `server/routers/github.error.test.ts` verifies the response code and safe message for 401, 403, 404, and 500 mappings. |
| High | A/B testing procedures accepted a post ID and used unscoped variation, result, and summary helpers, allowing reads or mutations across user-owned records. | Every protected A/B procedure now first verifies the caller owns the post; helper reads and updates accept and enforce `userId`, while variation-status updates use post ID plus variation index rather than an unscoped row identifier. | `server/routers/abTesting.ownership.test.ts` proves an unowned post is rejected and owned reads receive the caller identity; full suite passes. |
| Medium | Social analytics synchronization searched only Twitter and LinkedIn records even though Facebook and Instagram are supported platforms. | Centralized the supported analytics platform list and query each platform using the caller ID before locating the requested analytics record. | `server/routers/socialMedia.analytics.test.ts` proves all four supported platforms are queried with the caller identity; full suite passes. |
| High | Asset re-optimization accepted an arbitrary request-supplied storage URL and fetched it before verifying asset ownership, creating an arbitrary-fetch path and permitting asset/site mismatch. | The procedure now resolves the asset by ID plus caller ID, rejects missing records before fetch, and uses only the persisted storage URL and site ID from that record. | `server/routers/assets.reoptimize.test.ts` proves an unowned asset triggers no fetch and owned re-optimization fetches only the persisted storage URL. |
| Medium | Snapshot creation accepted a site ID and optional post ID without validating that their relationship belonged to the caller. | Snapshot creation now verifies the caller-owned site, then verifies any supplied post is caller-owned and belongs to that site. | `server/routers/snapshots.ownership.test.ts` covers an unowned site, a cross-site post, and a valid caller-owned snapshot reference. |
| High | Asset upload accepted a site ID without verifying the caller owned the site before decoding, optimizing, storing, and persisting the asset. | Asset upload now resolves the site by ID plus caller ID before processing data or storage operations. | `server/routers/assets.reoptimize.test.ts` proves an unowned upload site is rejected before storage or persistence calls. |
| Medium | Repurposing generation and regeneration accepted post and site IDs without validating they formed a caller-owned relationship; regeneration also deleted the old item before validating the replacement context. | Both mutations now require the post to belong to the requested site, and regeneration validates the existing record context before deleting it. | `server/routers/repurposing.ownership.test.ts` proves cross-site generation is rejected and mismatched regeneration does not delete existing content. |
| Medium | Scheduled publishing accepted an optional caller-owned post ID without confirming that post belonged to the caller-owned scheduled site. | Scheduling now validates the optional post under the caller identity and requires it to match the resolved site before row or heartbeat creation. | `server/routers/scheduler.test.ts` proves a cross-site post is rejected before a schedule is created. |
| High | Post upsert accepted a site ID without confirming the caller owned that site before persistence. | Post upsert now resolves the site under the caller identity before delegating to the persistence helper. | `server/routers/posts.ownership.test.ts` covers rejection of an unowned site and a valid caller-owned upsert. |

## Remaining Findings and Release Blockers

### Android Functional Blockers

| Priority | Finding | Evidence | Required next action |
|---|---|---|---|
| P1 | **A real-device mobile sign-in acceptance run is still required.** The exported Expo scheme is `jekyllforge`, and code-level callback/ticket tests pass, but no user-controlled Android/identity-provider run was performed. | `app.json`; mobile auth regression suite | Run sign-in on an Android device or emulator against the deployed app before release. |
| P1 | **Real-device offline recovery acceptance is still required.** Code now queues repository publishing, social publishing, post-status updates, scheduler cancel/reschedule actions, social disconnects, and A/B variation publishing; the replay dispatcher is unit-tested for every supported action, but no Android network-loss/reconnect run has been completed. | Mobile editor, social, scheduler, A/B, offline queue, and replay-dispatcher source/tests | On a device or emulator, disconnect the network during each supported mutation, restore it, and confirm each queued item completes or remains visible with recovery details. |
| Resolved | Mobile type/lint debt. | Mobile lint now completes with zero warnings and zero errors after removing unused values and replacing legacy `any` boundaries with typed contracts. | None; continue monitoring toolchain compatibility notices during dependency upgrades. |

### Android Distribution Blockers

| Priority | Finding | Evidence | Required owner input |
|---|---|---|---|
| Resolved | Expo project identity is configured. | `app.json` now contains EAS project ID `1921924b-7b89-4e88-92f5-0df9717315e9` and its matching Expo Updates URL. | None. |
| Resolved | Referenced Android assets did not exist. | Owner-supplied artwork now provides the 512×512 app icon, 1024×1024 adaptive foreground, 96×96 monochrome notification icon, and a checkpoint-safe 2048×2048 optimized splash derivative (504 KB). | None. |
| Resolved | Firebase Android configuration is present and package-aligned. | Supplied `google-services.json` is installed with package name `com.cassandracrossno.jekyllforge`. | None for Firebase configuration. |
| P1 | Google Play submission credentials are unavailable. | Owner is deferring Play Console enrollment and service-account creation. | Create the Play Console account when ready, link its Cloud project, and upload the service-account key securely. |

### Web Follow-up Items

| Priority | Finding | Recommended follow-up |
|---|---|---|
| P1 | The complete authenticated repository-picker and dashboard workflow could not be browser-tested because it requires a user-controlled Manus account session. | Run a controlled authenticated acceptance test covering sign-in, repository selection, dashboard, editor save, publish, logout, and session expiry. |
| P1 | The managed sandbox externally terminates `pnpm build` after all 6,597 modules transform and while Vite renders chunks. This occurs in direct, memory-capped, detached, and lower-overhead configuration runs, without a JavaScript error. | Preserve the existing deployed runtime; treat editor/diagram bundle refactoring as a separate, regression-tested performance effort instead of changing late-release loading boundaries solely for this sandbox constraint. |
| P2 | Several syntax-highlight and diagram bundles remain above 500 kB; the diagram chunk is approximately 2.19 MB. | Lazy-load uncommon language grammars and diagram tooling only after explicit user interaction. |
| P2 | The repaired root lint pipeline has 229 warnings, primarily legacy unused variables and `any` boundaries. | Burn down warnings by feature area and restore error severity for unused variables once the legacy inventory is cleared. |
| P2 | Development status probes may trigger public rate-limit warnings from the shared preview address. The server remained healthy and TypeScript reported no errors. | Observe whether the same policy affects normal browser behavior; exempt internal development diagnostics only if justified without weakening public protection. |

## Security and Data Notes

The authentication boundary consistently uses `protectedProcedure`, and reviewed direct record helpers apply a user-ID predicate. Connected social account query responses continue to pass through a public projection that excludes access and refresh tokens. The new scheduler checks close the direct-object-reference gap found during review. Migration validation remains clean; no destructive schema action was required.

The audit did not fabricate third-party account credentials, publishing credentials, test user data, testimonials, or results from authenticated external systems. The owner supplied Firebase configuration and release artwork; the remaining omissions are intentional and remain visible as explicit blockers.

## Recommended Completion Order

1. Run the mobile OAuth/deep-link session and offline recovery paths on a real Android device or emulator against the deployed service.
2. Create Google Play credentials when enrollment is available.
3. Execute a consented, authenticated end-to-end web acceptance run using a real GitHub-connected account.
4. Complete a controlled, regression-tested editor/diagram bundle optimization only when performance work can be separately accepted; do not conflate it with the verified Android hardening release.

## Audit Artifacts

| Artifact | Purpose |
|---|---|
| `AUDIT_EVIDENCE_AUGUST_2026.md` | Working evidence log with public-route, API, and Android observations |
| `MIGRATION_AUDIT.md` | Earlier detailed Drizzle migration/schema parity audit |
| `LANDING_ACCESSIBILITY_AUDIT.md` | Earlier landing accessibility review and notes |
| `todo.md` | Persistent remediation and release-blocker tracker |

**Prepared by:** Manus AI  
**Status:** Audit complete; web source remediations and mobile hardening verified; a managed-sandbox build constraint and Android external acceptance/distribution blockers remain explicitly tracked.

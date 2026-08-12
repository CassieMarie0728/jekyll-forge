# Jekyll Forge: Live Comprehensive Audit & Remediation Report

> **Status:** Active remediation. This file is intentionally kept in the project root and linked from `README.md`; `todo.md` is the source of truth for item-by-item completion.

## How to Read This Report

This is an evidence-led engineering audit, not a product claim sheet. A finding is marked **confirmed** only when it was observed in source code, configuration, verification output, or runtime logs. A finding is marked **needs validation** when it requires a real external account, production credential, device, or hosted service.

| Severity | Meaning |
|---|---|
| **P0** | Release blocker, security exposure, data-integrity risk, or misleading customer-facing claim that must be removed or fixed before release. |
| **P1** | Important reliability, usability, accessibility, or operational risk that should be resolved in the current hardening cycle. |
| **P2** | Material improvement that can follow the hardening cycle after a clear owner and acceptance test are defined. |

## Current Verification Baseline

| Check | Evidence | Result |
|---|---|---|
| Web TypeScript | `./node_modules/.bin/tsc --noEmit` | Passing after the web/API remediations. |
| Android TypeScript | `mobile/jekyll-forge-mobile/./node_modules/.bin/tsc --noEmit` | Passing after the mobile auth, sync, and push-boundary remediations. |
| Targeted rate-limit tests | `server/rateLimiter.test.ts` | 3/3 passing. |
| Targeted landing-page integrity tests | `client/src/pages/Home.test.tsx` | 1/1 passing. |
| Android auth persistence tests | `mobile/src/stores/authStore.test.ts` | 2/2 passing. |
| Database migration | `drizzle/0008_curved_la_nuit.sql` | Mobile device-token table applied successfully; unrelated destructive generated statements were excluded. |
| Development server | Managed server restart and health check | Running after the Redis fallback change. |

## Confirmed Findings and Disposition

| ID | Severity | Area | Evidence | Disposition |
|---|---|---|---|---|
| AUD-001 | **P0** | Backend operations | The server attempted `redis://localhost:6379` when no `REDIS_URL` was configured, causing repeated `ECONNREFUSED` log events. | **Fixed and regression-tested.** Redis is now opt-in, the fallback is in-memory, retry reconnect is disabled, and the supported `rate-limit-redis` adapter is used when Redis is available. |
| AUD-002 | **P0** | API security | `express-rate-limit` flagged custom IP key generators that did not use its IPv6-aware helper, allowing IPv6 addresses to bypass expected grouping. | **Fixed and regression-tested.** All IP fallbacks now use `ipKeyGenerator`; rate-limit responses report a seconds-based retry interval. |
| AUD-003 | **P0** | Landing-page integrity | The page contained hardcoded fictional named testimonials, duplicate testimonial sections, placeholder avatar requests, unsupported paid-plan offers, an asserted Play Store release, and an embedded "Demo video would play here" placeholder. | **Fixed for the audited claims.** Fictional testimonials, paid-plan sections, unsupported availability/security language, and the inert demo interaction were removed or rewritten. A real demo can be added later only when a real asset exists. |
| AUD-004 | **P1** | Android release configuration | App configuration referenced absent assets, a placeholder Expo project ID, Firebase configuration, and a Play submission key as though they were interchangeable. | **Partially fixed.** Invalid references were removed, Expo config validates, and the build guide now separates app assets, Expo project configuration, Firebase configuration, and Play service-account credentials. Real branded assets and account credentials remain external prerequisites. |
| AUD-005 | **P1** | Android authentication | The mobile login flow and stored-token model required validation against the web OAuth/session contract. | **Partially fixed.** Token persistence is now centralized in SecureStore, user state persists in AsyncStorage, logout clears both, API headers use the secure token, and 2/2 regression tests pass. The hardcoded mobile OAuth redirect and end-to-end hosted OAuth exchange still require a real account/device validation. |
| AUD-006 | **P1** | Offline and notifications | Offline sync and push notification services contained simulated or local-only behavior. | **Partially fixed.** NetInfo connectivity, persisted queue metrics, explicit sync processors, real post/social/delete mutations, Expo permission requests, durable device-token registration, and protected token revocation now exist. Screen-level queue producers, real EAS/Firebase configuration, device delivery, and conflict-resolution validation remain open. |
| AUD-007 | **P1** | Web regression coverage | The editor test was excluded because its CSS import chain was not configured for the test environment. | **Fixed.** CSS-heavy child modules are isolated and the real Editor component plus CSS-free markdown helpers have regression coverage. |
| AUD-008 | **P1** | Deployed landing-page consistency | Production verification at `https://jekyllforge.manus.space/` previously found statements that overstated Android availability, live synchronization, offline support, analytics freshness, and the demo video. | **Fixed for the audited copy.** The landing page now uses qualified availability and capability language and no longer presents an inert demo as playable. |
| AUD-009 | **P1** | Mobile API contract | The mobile package could not import the server router directly without pulling Node-only dependencies into the Android compiler. | **Contained, not complete.** A build-safe transitional adapter is in place and Android TypeScript is clean, but a generated shared API contract should replace the temporary untyped adapter before claiming full mobile type safety. |

## Remediation Sequence

The active sequence is deliberately narrow: resolve release-blocking correctness and integrity issues first, then external-service configuration, then experience polish and optimization. Each completed item must have an implementation diff plus a relevant automated verification step; production-account and device dependent items will be explicitly reported as requiring user-controlled credentials or a real device.

## Evidence References

1. `server/_core/rateLimiter.ts` and `server/rateLimiter.test.ts`.
2. `client/src/pages/Home.tsx` and `client/src/pages/Home.test.tsx`.
3. `mobile/jekyll-forge-mobile/app.json`, `eas.json`, `src/screens/LoginScreen.tsx`, `src/services/syncService.ts`, and `src/services/pushNotifications.ts`.
4. `todo.md` under **Active Audit Remediation — Priority Order**.
5. Deployed landing-page verification at `https://jekyllforge.manus.space/`, reviewed 2026-08-11.

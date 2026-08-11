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
| TypeScript | `npx tsc --noEmit` | Passing after the first remediation batch. |
| Targeted rate-limit tests | `server/rateLimiter.test.ts` | 3/3 passing. |
| Targeted landing-page integrity tests | `client/src/pages/Home.test.tsx` | 1/1 passing. |
| Development server | Managed server restart and health check | Running after the Redis fallback change. |

## Confirmed Findings and Disposition

| ID | Severity | Area | Evidence | Disposition |
|---|---|---|---|---|
| AUD-001 | **P0** | Backend operations | The server attempted `redis://localhost:6379` when no `REDIS_URL` was configured, causing repeated `ECONNREFUSED` log events. | **Fixed and regression-tested.** Redis is now opt-in, the fallback is in-memory, retry reconnect is disabled, and the supported `rate-limit-redis` adapter is used when Redis is available. |
| AUD-002 | **P0** | API security | `express-rate-limit` flagged custom IP key generators that did not use its IPv6-aware helper, allowing IPv6 addresses to bypass expected grouping. | **Fixed and regression-tested.** All IP fallbacks now use `ipKeyGenerator`; rate-limit responses report a seconds-based retry interval. |
| AUD-003 | **P0** | Landing-page integrity | The page contained hardcoded fictional named testimonials, duplicate testimonial sections, placeholder avatar requests, unsupported paid-plan offers, an asserted Play Store release, and an embedded "Demo video would play here" placeholder. | **Partially fixed.** Fictional testimonials and paid-plan sections were removed; Android availability, pricing, trust, and credential copy were corrected. The demo remains a visible placeholder and is tracked for replacement or removal. |
| AUD-004 | **P1** | Android release configuration | App configuration contains placeholder Expo identifiers, references release assets/files not verified in the project, and EAS submission configuration is not aligned with Play submission credentials. | Open; next mobile hardening item. |
| AUD-005 | **P1** | Android authentication | The mobile login flow and stored-token model require validation against the web OAuth/session contract before a production claim can be made. | Open; needs contract review and end-to-end verification. |
| AUD-006 | **P1** | Offline and notifications | Offline sync and push notification services include simulated or local-only behavior that must not be marketed as production synchronization or remote push delivery until wired to real services. | Open; implementation and device validation required. |
| AUD-007 | **P1** | Web regression coverage | The editor test remains excluded because its CSS import chain is not configured for the test environment. | Open; replace the exclusion with a reliable test setup or test seam. |

## Remediation Sequence

The active sequence is deliberately narrow: resolve release-blocking correctness and integrity issues first, then external-service configuration, then experience polish and optimization. Each completed item must have an implementation diff plus a relevant automated verification step; production-account and device dependent items will be explicitly reported as requiring user-controlled credentials or a real device.

## Evidence References

1. `server/_core/rateLimiter.ts` and `server/rateLimiter.test.ts`.
2. `client/src/pages/Home.tsx` and `client/src/pages/Home.test.tsx`.
3. `mobile/jekyll-forge-mobile/app.json`, `eas.json`, `src/screens/LoginScreen.tsx`, `src/services/syncService.ts`, and `src/services/pushNotifications.ts`.
4. `todo.md` under **Active Audit Remediation — Priority Order**.

# Jekyll Forge: independent hosting migration

Status: locally validated migration, pending production configuration and acceptance. Source baseline: `21a4501dbb2295c66abb4f6ef0bd709e992acb7c`.

## Verification record — 2026-09-19/20

- TypeScript check passed.
- Vitest: 164 passed, zero failed, seven existing skipped tests.
- Vite production build passed. Cloudflare dry-run packaging passed; compressed Worker bundle approximately 176 KiB. Existing large UI chunk warnings remain.
- All three SQLite migrations applied to a fresh local D1 database.
- Local Worker smoke test passed for authenticated session/redaction, site creation, draft creation/autosave, schedule/cancellation, logout, origin checks, request content-type checks, and private-asset authorization. No GitHub writes occurred.
- The local scheduled-handler endpoint returned an `ok` outcome.
- Real SQLite tests cover one-use mobile tickets, browser-bound OAuth, expired/tampered sessions, overlapping scheduled claims, GitHub write failures, and persistent concurrent rate limits. GitHub responses in these tests are mocked.
- Landing preview inspected at desktop and 390 px mobile widths. Mobile had no horizontal overflow, no broken images, and no missing anchor targets. Broken third-party image dependencies were replaced with clearly labeled local workflow illustrations.
- The production configuration guard rejected the development placeholders as intended.
- Cloudflare CLI authentication was expired. GitHub OAuth registration, production deployment, external provider generation, live GitHub publishing, and physical-device acceptance remain unverified.
- GitHub rejected pushing workflow changes because the saved OAuth connection lacks the `workflow` scope. The Pages workflow fix is preserved on a local backup branch; the review branch leaves the existing workflows unchanged. Resolve their competing deployment triggers before merging landing changes.

See [deployment instructions and remaining acceptance gates](./CLOUDFLARE_SETUP.md).

## Agreed scope

- Keep the app online when the owner's computer is off.
- Start with a fresh application database; preserve all existing GitHub content.
- Use free services and do not enable paid fallbacks or subscriptions.
- Replace Manus before building the exhaustive Mintlify site.
- Replace the landing page's blue/purple palette with the owner's black, blood red, ash, and white palette.

## Proposed deployment

Cloudflare Workers serves the React application and tRPC API. D1 stores application state. GitHub login replaces Manus login. Blog images belong in the selected GitHub repository, alongside the content. Cron triggers process durable scheduled-post rows. AI continues through user-owned, free-only providers. No R2 subscription is necessary for this design.

This is a platform migration, not a change to an environment variable. MySQL-specific schema/query behavior, native image processing, and long-running timers must be adapted and tested.

## Dependency inventory

| Area                 | Current dependency                                                        | Required replacement                                                     |
| -------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Web login            | `client/src/const.ts`, `server/_core/oauth.ts`, `sdk.ts` call Manus OAuth | GitHub OAuth with expiring, browser-bound state and secure app sessions  |
| Mobile login         | Manus authorization portal and one-use exchange codes                     | Preserve one-use mobile exchange; authorize against GitHub               |
| Application database | MySQL tables and mysql2 Drizzle client                                    | D1 SQLite schema, migrations, insertion results, atomic updates          |
| Files                | `server/storage.ts` and `/manus-storage/*` use Forge presigning           | GitHub repository assets with explicit destination and ownership         |
| Image optimization   | Native Sharp                                                              | Browser-side conversion; preserve unsupported originals with accurate UI |
| Blog scheduler       | Manus Heartbeat registration and cron authentication                      | Durable D1 schedule claims and Cloudflare scheduled handler              |
| Social scheduler     | Process-local `setInterval`                                               | Scheduled handler with atomic claims and visible failure state           |
| Owner alerts         | Manus notification service                                                | Durable app notifications; optional independently configured delivery    |
| AI                   | Most routes use free providers; A/B generator still calls Manus LLM       | Route A/B through the same user-owned provider policy                    |
| Build                | Manus Vite runtime, debug collector, allowed hosts                        | Standard Vite build and Worker assets                                    |
| Mobile URLs          | Hard-coded Manus defaults and links                                       | Explicit app base URL and rebuilt native app                             |
| Landing              | Manus launch links, external screenshot assets, unwanted colors           | New verified URL and requested brand styling                             |
| GitHub Pages         | Two workflows publish different artifacts to the same site                | One authoritative landing deployment                                     |

## Free-tier constraints checked against primary sources

Checked 2026-09-19. Limits may change; account-wide usage must be checked before deployment.

- [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/): Free requests have daily and CPU limits. Native server-side image processing cannot simply be moved unchanged.
- [D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/): Free-plan query/storage limits stop operations when exhausted rather than automatically enabling the paid plan.
- [R2 pricing](https://developers.cloudflare.com/r2/pricing/): Includes a free allowance but usage above it can be billed. Omitted from the proposed strict-free architecture.
- [Render Free](https://render.com/docs/free): Free web services sleep after inactivity; existing process-local timers cannot provide reliable publishing there.
- [Supabase project pausing](https://supabase.com/docs/guides/platform/free-project-pausing): Free projects can pause for inactivity. Not the primary recommendation for unattended schedules.

## Data and security boundaries

Fresh database authorization does not authorize deletion of the old database or GitHub content. Do not delete either. Existing Manus sessions will not carry over. Create new app identities through GitHub. A login must not automatically modify repositories. Keep provider keys server-side, redact user/session responses, verify user ownership on all data writes, and scope OAuth redirects to the configured app origin.

GitHub-backed asset uploads are repository writes. The UI must show the selected repository, branch, and asset path before submission. Existing published references must not be rewritten implicitly.

## Acceptance gates

1. Install and build reproducibly without Manus runtime packages.
2. Apply new migrations to an empty local D1 database without touching remote databases.
3. Verify sign-in, sign-out, session redaction, expired/invalid OAuth state, and mobile ticket single-use behavior.
4. Verify repository selection, draft editing/autosave, snapshots, asset upload, and publishing on a dedicated test repository with explicit publishing authorization.
5. Verify schedules use database claims, avoid duplicate publication, and expose upstream failures accurately.
6. Verify AI functions never silently route to Manus or paid model fallbacks.
7. Verify landing and app in desktop/mobile layouts, navigation, and internal links.
8. Verify Cloudflare account plan and configure GitHub OAuth secrets locally; deploy only after the build and configuration are reviewable.
9. Rebuild mobile against the new origin; report physical-device verification separately.
10. Write the Mintlify documentation against the migrated implementation and link evidence/current limitations.

## Not yet verified

Cloudflare account availability/remaining quota, final application hostname, GitHub OAuth app registration, real provider generation, production deployment, native-device acceptance, and third-party social platform access. Hosting on a free plan does not prove every third-party social API is free or available.

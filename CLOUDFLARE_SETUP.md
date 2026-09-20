# Independent hosting: Cloudflare Workers + D1

This migration is prepared for review. It is **not deployed**. The old Manus
app and all existing GitHub content are untouched. The database starts empty.
The landing page continues to show a migration notice until a live app URL is verified.

## Local development

Use Node 24 and the repository's pinned pnpm 10.4.1:

```sh
npx pnpm@10.4.1 install --frozen-lockfile
```

Copy `.dev.vars.example` to `.dev.vars`. Replace the example JWT secret with a
cryptographically random secret of at least 32 characters. Configure a separate
development GitHub OAuth app if testing real login locally. Keep secrets out of
Git and chat messages. Local database/API testing does not require GitHub credentials.

```sh
npx pnpm@10.4.1 db:local
npx pnpm@10.4.1 dev
```

The application is available at `http://localhost:8787`. For faster UI editing,
run `pnpm dev:ui` in another terminal; its API requests proxy to port 8787.
Use port 8787 for OAuth callback testing so login cookies and redirects stay on
the configured origin. `/api/oauth/start` returns 503 until login is configured.

## Production setup

1. Reconnect the Cloudflare CLI with `pnpm exec wrangler login`. The previously
   available CLI login was expired when this migration was prepared.
2. Verify the chosen account uses **Workers Free**, including its current usage.
   Do not enable Workers Paid, R2, or paid AI fallbacks. Free quotas are finite;
   live CPU consumption still needs measurement on the deployed application.
3. Create a fresh D1 database with `pnpm exec wrangler d1 create jekyll-forge`.
   Put its returned ID into `wrangler.jsonc`. Never reuse an unrelated database.
4. Determine the account's Workers subdomain. Set `APP_URL` to the final HTTPS
   origin, typically `https://jekyll-forge.<account-subdomain>.workers.dev`.
5. Register a GitHub OAuth app with that homepage and callback
   `<APP_URL>/api/oauth/callback`. Put its public client ID in `GITHUB_CLIENT_ID`.
   Set `OWNER_GITHUB_ID` to the owner's numeric GitHub account ID.
6. Store the OAuth app's secret with `pnpm exec wrangler secret put
GITHUB_CLIENT_SECRET`. Store a new production secret with `pnpm exec wrangler
secret put JWT_SECRET`. Use the interactive prompts; never put secrets into
   command arguments. The JWT secret also encrypts saved AI keys, so preserve
   it securely. Changing it invalidates sessions and existing encrypted AI keys.
7. Run `pnpm cf:types`, `pnpm check`, `pnpm test`, and `pnpm cf:check`.
8. Verify the database target, then run `pnpm db:remote` to apply only the new
   SQLite migrations in `drizzle/d1`. Historical MySQL migrations are retained
   for reference and are not executed by this runtime.
9. Run `pnpm cf:deploy`. Its configuration check rejects the placeholder database,
   missing GitHub IDs, and non-HTTPS application origins.
10. Verify live GitHub sign-in/sign-out, draft editing, an explicitly selected
    disposable test repository, image upload, immediate publishing, and scheduled
    publishing. Only then replace the landing page's status links with the app URL.

The deployment command does not automatically prove the account plan or secrets.
Do not present a successful upload as successful application acceptance.

### GitHub Pages workflow follow-up

The saved GitHub connection cannot push changes under `.github/workflows`
because it lacks the `workflow` scope. This branch therefore preserves both
existing Pages workflows. Before merging landing changes, use GitHub's authorized
workflow editor to disable the automatic trigger in `static.yml` and change its
artifact path from `.` to `landing`, or retire that duplicate workflow.
`deploy-landing-page.yml` should be the authoritative landing deployment.
Until this is resolved, the two workflows can race to publish different artifacts.
The proposed fix is preserved locally on
`codex/manus-free-cloudflare-with-pages-fix` and in the task's private
`.wrangler/pages-workflow.patch` file.

## Behavior changes

- **Login:** GitHub OAuth with browser-bound, expiring state. Repository write
  access remains a separate Personal Access Token connection. Login tokens are
  not stored as repository credentials. Browser and mobile sessions last seven days.
- **Storage:** D1 stores application state. Uploaded files create commits in the
  selected GitHub repository/branch and configured asset directory, under the site
  root. Uploads have a 5 MB limit. The web browser optimizes supported still images.
  Existing files are not overwritten; removing an item from the asset library
  preserves its GitHub file. Re-optimization of an existing file requires a new
  upload. Private image previews go through an authenticated endpoint.
- **Asset links:** Published Markdown uses the site-relative repository asset path,
  not the private preview URL. For Jekyll sites with `baseurl`, apply your theme's
  `relative_url` convention when embedding root-relative asset paths.
- **Scheduling:** Cron scans every five minutes, at most two blog and two social
  jobs per run. This is approximate scheduling; a backlog can delay publication.
  Atomic database claims prevent concurrent workers from publishing the same job.
  Existing target files are not overwritten. Ambiguous or interrupted writes
  require checking the remote service before retrying.
- **Notifications:** Operator notices are stored in D1 and available through the
  admin `system.notifications` procedure. They are not email or push delivery.
- **AI:** User-owned provider settings and the server's free-model policy are used
  for writing and variations. Limits persist across server instances. Account
  billing settings and upstream model availability still matter; live generation
  with production keys has not been verified.
- **Social integrations:** External platform credentials/access and live publishing
  are not validated. Scheduled Facebook/Instagram publishing has no verified
  media/page integration and returns failure rather than a false success receipt.
  Twitter/LinkedIn access is not guaranteed to be free by this hosting migration.
- **Mobile:** Set `EXPO_PUBLIC_API_URL` to the new HTTPS origin and rebuild. No
  physical-device acceptance has been performed; the existing distributed build
  will not automatically switch away from Manus.

## Verification and boundaries

Local D1 migrations, the native Worker request handler, login security tests,
single-use mobile tickets, concurrent scheduler claims, protected repository asset
paths, and the local authenticated draft/schedule workflow are covered by tests.
Test GitHub responses are mocked; they do not establish real GitHub OAuth or
publishing acceptance. The local smoke test used a disposable identity and did not
make repository commits. A dry-run checks packaging, not production CPU limits.

Some unused historical Manus utility files remain in the repository. The active
Worker uses `server/worker.ts`; the removed Manus Vite plugin and old Express
startup are no longer on its serving path. Historical setup and audit documents
remain intact and may describe the previous platform.

Mintlify documentation should follow successful migration acceptance so its
instructions describe the deployed app. The Mintlify connector was unavailable
during preparation; no docs site has been published by this migration.

## Rollback

Before switching the public app link, preserve the previous deployment identifier
and export D1 with `wrangler d1 export DB --remote --output <private-backup.sql>`.
Treat that export as sensitive: it contains account and integration data. Revert
the Worker deployment and public link if acceptance fails. Do not erase either
the original Manus data or GitHub repository content as part of rollback.

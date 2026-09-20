# Front-end audit — September 20, 2026

Scope: authenticated Jekyll Forge app at https://jekyll-forge.c728.workers.dev, main blog workspace 2. Desktop and 390px responsive inspection, source review, and targeted component tests. This is a top-level product audit, not a security audit or proof that every publishing integration works.

## Fixes from this pass

- Heading buttons format the current line, replace existing heading markers, and do not insert sample prose. Lists preserve selected content; empty inline formatting positions the caret inside its markers.
- Mobile editor gains post details, preview/write switching, AI, snapshots, and a working post-browser drawer. Save/publish and post-browser controls receive accessible names.
- New Post works when already editing, with confirmation before discarding unsaved work. Refresh/close also warns about unsaved work.
- Workspace navigation and command search derive the workspace from the current route, avoiding stale or missing context on direct entry. Mobile navigation closes after navigation.
- Mobile dashboard, scheduler, theme and health headers wrap instead of crowding controls.
- Manually edited asset alt text has an explicit Save action. AI-generated alt text updates the open detail panel. The UI explains that suggestions are based on filenames, not image recognition.
- AI Settings initially selects the active provider. Clearing the custom prompt saves the empty value. The ineffective auto-snapshot switch is replaced with an honest Always on indicator.
- Theme configuration does not invent Minima as the current theme when absent; remote_theme is recognized. Applying a theme is disabled while configuration is unavailable.
- Health metrics are identified as setup checks on Forge-tracked content, not a comprehensive SEO score. Dashboard counts explain their limited scope.
- Command palette gains accessible dialog title/description. Mobile account tabs gain accessible names.

## Walkthrough coverage

| Surface | Checked | Limits |
| --- | --- | --- |
| Repository picker | Main-blog search, recent sites, entry navigation | Token replacement not exercised |
| Dashboard | Counts, links, desktop and mobile layout | Counts reflect Forge storage, not entire repository |
| Editor | Toolbar transformations, selection preservation, mobile controls, draft warning | No real post was published or overwritten |
| AI Settings | Provider selection, controls, tone/settings semantics | No provider generation or credential changes during audit |
| Assets | Empty state; component test for manual description save | No production upload/deletion; no populated production asset library |
| Scheduler | Empty state and Refresh | Due-post delivery belongs to backend acceptance |
| Themes | Configuration display, catalog, search/source review | No theme/plugin/workflow changes committed to blog |
| Site Health | Status reporting and scope of claims | GitHub Pages reports errored for the main blog; root cause not diagnosed here |
| Account settings | Profile, display controls, security tab | No logout, social connection, or account removal |
| Command palette | Search and navigation | No destructive actions |

## Remaining defects / backend follow-up

1. The main blog reports a GitHub Pages build error. Inspect the actual workflow/build logs before changing content or configuration.
2. New unsaved drafts do not autosave until they have a Forge post ID. Autosave failures are currently silent, and navigating through app routes can still abandon unsaved work. A durable recovery draft and explicit saving/saved/failed state are the highest-value next improvement.
3. Content language is stored but the generation prompt does not currently apply it. Wire this preference into generation and test with a configured provider.
4. Existing GitHub content/assets are not fully represented by Forge dashboard counts. A read-only repository inventory/import flow would prevent confusing zero counts.
5. Theme application and workflow generation need backend validation for gem names, remote themes, dependencies, branch targeting, and GitHub permissions. Catalog popularity counts are static, not live GitHub data.
6. Missing GitHub draft folders can produce a handled API error in the console while Forge drafts still display. Normalize missing-folder responses in the backend.
7. Paid-model billing remains provider-account controlled; app rate limits are not spending caps. No billing settings were changed.
8. Production bundling still reports large chunks; lazy editor/preview dependencies deserve a separate measured performance pass.

## Most useful additions

- Recovery drafts with visible save state, retry, and restore after a reset.
- A publishing review showing exact repository, branch, path, and before/after content diff.
- A searchable GitHub content/asset inventory with clear Forge-only versus repository-wide counts.

These are recommendations, not features claimed as shipped in this pass. The public GitHub Pages landing site and Mintlify documentation remain separate work.

## Final validation

- 16 targeted component checks passed: editor 11, assets 1, dashboard 3, account settings 1.
- TypeScript check and production build passed. Existing large-chunk warning remains.
- Deployed Worker version: `cf58d2cb-2188-4ff4-b763-6b2a13fb9b07`.
- Live 390px check: post details opens editable metadata; post drawer lists both saved drafts and the GitHub post; preview and AI panels open. Dashboard controls fit with no document horizontal overflow.
- Direct entry to `/assets/2` preserves workspace 2 in dashboard/editor navigation. AI Settings selects the active provider and shows the fixed snapshot behavior.
- Browser viewport restored. No production posts, repository files, keys, social connections, or provider preferences changed by this audit.


## Follow-up implementation: recovery, publishing review, and backend repairs

- Added browser-local recovery copies for new and existing drafts, separated by signed-in user and workspace. Restore, download, and explicit deletion are available; storage failures surface an emergency download. Recovery copies remain on the originating browser, while Save stores drafts in Forge.
- Existing draft autosaves show waiting, saving, saved, and failed states with retry. Saves are serialized within the editor; responses from an old selection cannot replace another selected post. New drafts receive distinct paths to avoid overwriting same-title drafts.
- Publishing displays repository, branch, path, and a real destination diff. Review must succeed and be acknowledged; changing the content/destination invalidates acknowledgement. Commits use the reviewed destination SHA. Existing post paths are preserved when titles change. Feature-branch commits no longer misidentify the base-branch editor as published.
- Scheduling checks future dates and unused published destinations. The existing scheduler remains creation-only and refuses to overwrite published files.
- Added a searchable read-only Repository files page with post/draft and media filters, editor links, and GitHub source links. GitHub tree truncation is disclosed; counts are separate from Forge database counts.
- Replaced the partial front-matter parser/serializer with the existing YAML library. Nested values, quoted text, backslashes, and multiline values round-trip; malformed YAML is rejected.
- Applied saved AI language while preserving structured output keys and code.
- Missing folders become empty only after branch/repository access verification. Permission failures stay visible. GitHub file paths and branch references are encoded.
- Theme/plugin config reads respect the selected branch and root path, parse YAML, and reject malformed existing config. Plugin edits preserve nested values and normalize YAML formatting (comments are not retained by the serializer). Theme identifiers are validated and stale remote_theme is removed when selecting a gem theme. Custom theme dependencies and setup still require theme-specific installation; config editing does not install gems.
- Recording published content clears stale autosave fields, preventing old working copies from hiding the published text.

### Blog build repair

The failing cassie-marie build log identified invalid YAML in _config.yml. Commit ff421856ea545a48c1929030048a2e733a8a6ba7 fixes only the indentation of jekyll-sitemap. The configuration parses and the build stage now passes. A subsequent external Updated Config commit retained a valid YAML list. Both latest GitHub workflows subsequently completed successfully: runs 35512091548 and 35512090965. The public HTTPS homepage returned 200. The earlier repair run was superseded during deployment by the newer valid configuration commit.

### Follow-up verification

50 tests passed across 11 targeted suites (49 in the combined run plus the added save-ordering regression; the publishing suite was rerun successfully) covering recovery, publishing review, editor behavior, YAML round trips, GitHub authorization/error handling and pagination, post ownership, language preferences, and scheduler behavior. Final TypeScript/build/deployment and browser results are recorded below when complete.


- Final TypeScript check, production build, and deployment configuration check passed. Existing large-chunk warning remains.
- Deployed Worker version: 4f1913c0-98eb-4e8e-bb67-2acbce3d597e.
- Live inventory loaded 79 files, including one Jekyll Markdown post and four media files. Searching amen returned the expected post and the editor link navigated correctly. This is a repository inventory, not a claim that HTML pages are editable Markdown posts.

- Live editor opened the existing GitHub post with parsed metadata and recovery controls. Publish review loaded its exact repository, main branch, existing path, and before/after content; Publish remained disabled until review acknowledgement. No post was published or overwritten during UI verification.
- Browser automation subsequently timed out before entering the recovery smoke draft, and a fresh test tab could not attach. Recovery after remount, workspace isolation, distinct new drafts, and storage failure reporting were covered by component tests; a final live recovery/navigation check was not completed. No user-entered keys or provider preferences changed.

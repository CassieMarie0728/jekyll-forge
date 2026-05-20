# Jekyll Forge — Project TODO

## Phase 2: Database Schema & Dependencies
- [x] Install pnpm dependencies: @tiptap/react, @tiptap/starter-kit, @tiptap/extension-*, monaco-editor, @monaco-editor/react, js-yaml, diff, jszip, idb, marked, dompurify, gray-matter, slugify, date-fns-tz
- [x] Define DB schema: sites, posts, snapshots, assets, ai_settings, scheduled_posts, reusable_blocks, ai_voice_profiles, ai_prompt_templates, front_matter_templates
- [x] Run DB migration
- [x] Create server-side DB helpers

## Phase 3: App Shell, Design System & Auth
- [x] Design system: dark-mode-first, slate/zinc palette, Inter + JetBrains Mono + Space Grotesk fonts
- [x] Global CSS variables and Tailwind theme (forge-* custom properties, glass effects, gradient accents)
- [x] App layout with sidebar navigation, site switcher, branch selector
- [x] Landing/login page with GitHub OAuth CTA and feature grid
- [x] GitHub PAT connect flow (store GitHub token per user)
- [x] Toast notifications system (sonner)
- [x] Command palette (Cmd+K) global overlay
- [x] WorkspaceContext: activeSite, activeBranch, commandPaletteOpen

## Phase 4: Repository Picker & File Browser
- [x] Repository picker page: list GitHub repos, search, filter
- [x] Jekyll structure auto-detection (_config.yml, _posts, etc.)
- [x] Branch selector
- [x] Multi-site workspace switcher
- [x] File browser: tree view of Jekyll repo structure (_drafts, _posts, assets)
- [x] File browser: search, filter by type, status coloring
- [x] Per-site settings storage in DB

## Phase 5: Post Editor
- [x] Three-mode editor: Visual (toolbar-assisted), Markdown (textarea), Split Preview
- [x] Editor mode switcher tabs
- [x] Visual editor toolbar: text formatting (bold, italic, underline, strikethrough, code, headings)
- [x] Visual editor toolbar: structure (lists, blockquote, code block, table, HR)
- [x] Visual editor toolbar: media (image URL, YouTube embed)
- [x] Markdown editor with syntax-highlighted textarea
- [x] Split-preview mode (editor left, rendered preview right)
- [x] Front matter manager panel (right sidebar)
- [x] Front matter: all standard Jekyll fields (layout, title, date, categories, tags, slug, description, image)
- [x] Front matter: custom fields with type selector
- [x] Front matter: raw YAML editor with validation
- [x] Filename convention: YYYY-MM-DD-slug.md auto-generation
- [x] Word count, reading time, heading outline in status bar
- [x] Autosave to IndexedDB every 30s
- [x] Crash recovery: restore draft prompt on page load
- [x] Last autosave time indicator

## Phase 6: Asset Manager
- [x] Asset manager page with grid/list view
- [x] Drag-and-drop upload to S3 (base64 → server → S3)
- [x] Search, filter by type, sort by date/name/size
- [x] Duplicate detection (SHA-256 hash check)
- [x] AI-assisted alt text generation (server-side LLM)
- [x] Asset detail dialog: preview, alt text edit, URL copy, markdown embed copy, delete
- [x] Page-speed warning for large images (>500KB)

## Phase 7: Publishing Workflow
- [x] Publishing checklist: validate title, date, slug, front matter, content
- [x] Publish actions: save to _drafts, publish to _posts, commit to branch, create PR, schedule
- [x] GitHub API commit (create/update file with SHA)
- [x] Branch/PR creation from editor
- [x] GitHub Actions workflow generator (.github/workflows/jekyll.yml)
- [x] Scheduled publishing: set future date, store in DB

## Phase 8: AI Writing Assistant
- [x] AI settings page: provider, model, temperature, max tokens, system prompt, brand voice
- [x] Server-side LLM integration (all AI calls via server, no client-side keys)
- [x] AI features: generate title, subtitle, outline, draft, continue writing
- [x] AI features: rewrite selection, make shorter/longer, change tone, fix grammar
- [x] AI features: generate excerpt, SEO title, meta description, tags, categories, slug
- [x] AI features: generate social posts, FAQ, callout boxes, table of contents
- [x] AI features: suggest alt text, internal links, image prompt
- [x] AI features: clean front matter, convert HTML to Markdown, summarize
- [x] AI output panel: insert below, replace selection, copy, regenerate, discard
- [x] Snapshot before AI rewrite (named "Before AI Rewrite")
- [x] Revision snapshots: named (Before AI, Before Publish, Before Theme Change, Manual)
- [x] Snapshot timeline and restore

## Phase 9: Theme/Plugin Manager, SEO, Health Dashboard, Scheduler
- [x] Theme manager: detect active theme from _config.yml, show GitHub Pages themes, set remote_theme
- [x] Plugin manager: detect plugins, add/remove with compatibility warnings
- [x] Plugin manager: GitHub Pages compatibility badge, offer GitHub Actions if unsupported
- [x] SEO audit panel: title length, meta description, slug quality, heading structure, alt text, word count
- [x] Site health dashboard: GitHub status, Jekyll config validity, posts/drafts/assets count, theme, plugins
- [x] Scheduler page: scheduled posts list, cancel, manual run, timezone display
- [x] AI Settings page: enable/disable, voice profile, system prompt, live test

## Phase 10: Tests & Delivery
- [x] Vitest tests: auth.me, auth.logout, parseMarkdownFrontMatter, generateSlug, generateJekyllFilename, wordCount, readingTime, serializeToMarkdown, GITHUB_PAGES_SUPPORTED_PLUGINS, AI task types, SnapshotReason types
- [x] All 29 tests passing
- [x] TypeScript: zero errors (pnpm check clean)
- [x] Final checkpoint and delivery

## Known Limitations / Future Work
- [ ] TipTap rich-text visual editor (currently uses toolbar-assisted textarea; full TipTap integration deferred)
- [ ] Monaco editor integration (currently uses textarea; Monaco deferred to avoid bundle size impact)
- [ ] Real-time conflict detection against GitHub (polling-based; WebSocket upgrade deferred)
- [ ] Offline mode with background sync (service worker deferred)
- [ ] Cron heartbeat for scheduled posts (periodic-updates integration deferred)
- [ ] Image optimization pipeline (sharp server-side; currently stores original; optimization deferred)

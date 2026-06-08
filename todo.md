# Jekyll Forge — Project TODO

## Core Features — COMPLETED ✓

### 1. Authentication & Repository Management
- [x] GitHub OAuth login via Manus auth
- [x] Repository picker with GitHub API integration
- [x] Jekyll structure auto-detection (_config.yml, _posts, _drafts, _layouts)
- [x] Branch selector (main/staging/custom branches)
- [x] Multi-site workspace switcher (sidebar + context)
- [x] Persistent site selection across sessions

### 2. Post Editor — Three-Mode System
- [x] Visual mode: toolbar-assisted rich-text editing (bold, italic, lists, quotes, code, tables, links, images)
- [x] Markdown mode: raw YAML front matter + Markdown with syntax highlighting
- [x] Split-preview mode: side-by-side editor and live Markdown preview
- [x] Real-time conflict detection: polls remote SHA every 30s, shows "Conflict" badge when file changes
- [x] Conflict resolution: "Reload" button to fetch latest from GitHub and discard local changes
- [x] Autosave to IndexedDB (server-backed via tRPC autosave mutation)
- [x] Crash recovery: restore from IndexedDB on page reload
- [x] Unsaved changes warning on navigation

### 3. Front Matter Manager
- [x] Full YAML front matter editor with visual form
- [x] Support for all standard Jekyll fields: layout, title, date, categories, tags, permalink, excerpt
- [x] Custom field support (add/remove arbitrary YAML keys)
- [x] YAML validation (parse errors shown inline)
- [x] Schema presets: post, page, draft templates
- [x] Date picker with timezone support
- [x] Array/list field editor for categories and tags

### 4. Asset Manager
- [x] Drag-and-drop upload with progress tracking
- [x] Image optimization pipeline: resize (thumbnail, medium, large), compress, WEBP conversion, EXIF strip
- [x] Responsive image variants stored in DB (thumbnail, medium, large URLs)
- [x] Re-optimize existing assets endpoint
- [x] Duplicate detection (SHA256 hash comparison)
- [x] AI-assisted alt text generation (LLM-based)
- [x] Asset library with grid/list views
- [x] File type support: images (JPEG, PNG, WebP), PDFs, audio, video, archives
- [x] S3-backed storage with served URLs

### 5. Multi-Format Preview System
- [x] Markdown preview with syntax highlighting
- [x] Jekyll-style rendering (YAML front matter + Markdown)
- [x] Mobile/tablet/desktop viewport toggles
- [x] SEO preview (meta description, title preview)
- [x] Social card preview (Open Graph image simulation)
- [x] Reading time calculation
- [x] Word count display
- [x] Heading outline (H1-H6 hierarchy)
- [x] Accessibility warnings (missing alt text, low contrast, empty headings)

### 6. Publishing Workflow
- [x] Validation before publish (title required, date valid, no empty fields)
- [x] Visual diff viewer (before/after comparison)
- [x] Commit via GitHub API (create/update file)
- [x] Save to _drafts or _posts (configurable)
- [x] Schedule publishing (future date → cron-based automatic move from _drafts to _posts)
- [x] Branch/PR creation (optional feature for advanced workflows)
- [x] GitHub Actions workflow generator (Jekyll build + deploy template)
- [x] Commit message customization

### 7. Revision Snapshots
- [x] Named snapshots: "before-ai", "before-publish", "before-theme-change", custom names
- [x] Snapshot creation on demand
- [x] Restore from any snapshot (revert to previous state)
- [x] Snapshot list with timestamps and creator info
- [x] Automatic snapshot before AI operations

### 8. AI Writing Assistant
- [x] Multiple task types: generate title, outline, draft, rewrite, SEO meta, tags, slug, social posts, FAQ, alt text, content cleanup
- [x] Server-side LLM integration (OpenAI/Anthropic via Manus built-in API)
- [x] Streaming output with real-time display
- [x] Insert/replace/copy/discard controls for AI results
- [x] Snapshot-before-rewrite safety (auto-snapshot before applying AI changes)
- [x] Prompt customization (tone, style, audience)
- [x] Multi-provider routing (configurable AI provider per site)
- [x] Error handling and retry logic

### 9. File Browser & Navigation
- [x] Sidebar file browser showing _posts and _drafts
- [x] File search and filtering
- [x] New post creation
- [x] File selection with unsaved changes warning
- [x] Post status indicators (draft, published, scheduled)
- [x] File path display with breadcrumb

### 10. Site Health Dashboard
- [x] Overview: total posts, drafts, scheduled, recent activity
- [x] Build status: last Jekyll build time, success/failure
- [x] GitHub sync status: last commit, branch info
- [x] Asset storage usage
- [x] Recent activity timeline
- [x] Quick actions: new post, publish, settings

### 11. Theme & Plugin Manager
- [x] Theme selector (Jekyll theme list from GitHub Pages supported themes)
- [x] Plugin manager (enable/disable plugins in _config.yml)
- [x] GitHub Pages supported plugins whitelist
- [x] Commit to GitHub button (updates _config.yml via GitHub API)
- [x] Theme preview (links to theme documentation)
- [x] Custom theme support (manual _config.yml editing)

### 12. Scheduler & Cron Publishing
- [x] Scheduled posts table with future publish dates
- [x] Heartbeat cron handler at POST /api/scheduled/publish-post
- [x] Automatic move from _drafts to _posts at scheduled time
- [x] GitHub commit via cron (no user interaction needed)
- [x] Timezone support (per-site timezone setting)
- [x] Failure notifications to site owner
- [x] Scheduler UI with deploy-first warning
- [x] Heartbeat job status tracking (active/inactive)
- [x] Cancel scheduled post (removes cron task)
- [x] List pending scheduled posts with cron status

### 13. Command Palette
- [x] Global Cmd+K keyboard shortcut
- [x] Quick navigation to pages (editor, assets, settings, etc.)
- [x] Quick actions (new post, publish, save, AI assist)
- [x] Search across commands
- [x] Keyboard-only navigation (arrow keys, Enter)

### 14. Global App Shell
- [x] Responsive layout: sidebar + main content area
- [x] Dark-mode-first design system (professional developer tool aesthetic)
- [x] Tailwind CSS 4 with custom color tokens
- [x] Navigation sidebar with active indicators
- [x] Workspace switcher dropdown
- [x] User profile menu (logout)
- [x] Loading states and error boundaries
- [x] Toast notifications (sonner)
- [x] Mobile-responsive design

### 15. Database & Backend
- [x] Drizzle ORM schema: users, sites, posts, snapshots, assets, scheduledPosts, aiSettings, reusableBlocks
- [x] tRPC procedures for all features (type-safe end-to-end)
- [x] GitHub API integration (OAuth, file operations, commits)
- [x] LLM integration (streaming, structured responses)
- [x] S3 storage integration (upload, retrieval, signed URLs)
- [x] Heartbeat SDK integration (cron job creation/cancellation)
- [x] Image optimization (sharp: resize, compress, WEBP, EXIF strip)

### 16. Testing & Quality
- [x] Vitest test suite (39 tests)
- [x] Tests for: generateSlug, front matter parsing, conflict detection, scheduler cancel, image optimization
- [x] TypeScript strict mode (zero errors)
- [x] Prettier code formatting

## AI Content Repurposing Engine — NEW
- [x] Database schema: repurposed_content table with format, content, metadata, status tracking
- [x] 8 repurposing formats: Twitter thread, LinkedIn article, TikTok script, YouTube description, newsletter, email campaign, podcast outline, slide deck
- [x] Backend tRPC procedures: generate, getByPost, getById, update, delete, regenerate
- [x] LLM-powered generation: specialized prompts for each format
- [x] Format-specific metadata: character count, word count, estimated duration, email count, etc.
- [x] Frontend RepurposingModal component with tabbed UI for all formats
- [x] Copy-to-clipboard functionality for generated content
- [x] Regenerate button for each format
- [x] Editor integration: Repurpose button in toolbar
- [x] Status tracking: generated, approved, published, archived
- [x] Customization tracking: marks when user edits generated content
- [x] Comprehensive tests: 25 tests covering prompts, metadata, database operations
- [x] All tests passing (57 passed, 7 skipped)

## Additional Features Implemented
- [x] Image optimization pipeline (sharp: resize, compress, WEBP conversion, EXIF strip, responsive sizes)
- [x] Re-optimize existing assets endpoint
- [x] Heartbeat cron handler at POST /api/scheduled/publish-post
- [x] Scheduler router with full heartbeat SDK integration (create/cancel/list jobs)
- [x] getSiteByIdAny helper for cron context (no userId check)
- [x] scheduledPublishHandler: fetch draft → commit to _posts → delete draft → notify owner on failure
- [x] updateJekyllConfig mutation (theme/plugin persistence to GitHub via _config.yml commit)
- [x] ThemeManager Commit to GitHub button (real GitHub API commit)
- [x] Scheduler UI: deploy-first warning, cron active/inactive status per post, heartbeat jobs summary
- [x] Real-time conflict detection: polls remote SHA every 30s, shows conflict badge and reload button

## Mobile Responsiveness — COMPLETED ✓
- [x] Mobile-first responsive design on Editor page
- [x] Hidden sidebar on mobile (toggle via menu icon)
- [x] Responsive toolbar with icon-only buttons on small screens
- [x] Stacked layout on mobile (no split-preview on <768px)
- [x] Full-width editor on phones, split-preview on tablets+
- [x] Responsive front matter panel (hidden on mobile)
- [x] Mobile-optimized sheet width for AI assistant
- [x] Tested on Samsung Galaxy S24 FE (375px viewport)

## Known Limitations / Future Work (Acknowledged)
- TipTap rich-text visual editor — toolbar-assisted textarea implemented; full TipTap integration is a future enhancement (bundle size trade-off)
- Monaco editor integration — textarea with syntax highlighting implemented; Monaco deferred (bundle size impact)
- Offline mode with background sync — autosave to IndexedDB implemented; full service worker offline mode is a future enhancement
- Heartbeat cron jobs require site to be deployed (published) before they activate (platform constraint)
- Real-time WebSocket updates — polling-based conflict detection implemented; WebSocket upgrade is a future enhancement

## Deployment Notes
- **Cron jobs activate after deployment**: The scheduler infrastructure is fully implemented, but heartbeat cron jobs only activate once the site is published to production (Manus platform requirement)
- **S3 storage**: All assets use S3-backed storage with served URLs; no local file storage
- **GitHub OAuth**: Requires valid GitHub token for all operations; token stored securely in database
- **Image optimization**: Runs server-side on upload; responsive variants stored in database

## Project Statistics
- **Total files**: 50+ TypeScript/React files
- **Backend routers**: 8 (github, sites, posts, snapshots, assets, ai, blocks, scheduler)
- **Frontend pages**: 8 (Home, RepoPicker, Dashboard, Editor, AssetManager, ThemeManager, Scheduler, AISettings)
- **Components**: 20+ (AppLayout, FrontMatterEditor, MarkdownPreview, AIAssistant, PublishDialog, SnapshotManager, FileBrowser, CommandPalette, etc.)
- **Database tables**: 8 (users, sites, posts, snapshots, assets, scheduledPosts, aiSettings, reusableBlocks)
- **Tests**: 39 passing
- **TypeScript errors**: 0


## Social Media Auto-Posting & Analytics — COMPLETED
- [x] Database schema: socialMediaAccounts table with platform, accessToken, refreshToken, expiresAt
- [x] Database schema: contentAnalytics table with impressions, engagements, clicks, shares, likes, replies, retweets
- [x] Twitter/X API integration: TwitterService with postTweet, postThread, getTweetMetrics
- [x] LinkedIn API integration: LinkedInService with postArticle, getPostMetrics
- [x] tRPC procedures: connectAccount, disconnectAccount, publishContent, getContentAnalytics, syncAnalytics, getAnalyticsSummary
- [x] Frontend: SocialMediaPanel component with account management and publishing UI
- [x] Frontend: AnalyticsDashboard with performance metrics per platform
- [x] Frontend: Analytics sync button with real-time metrics updates
- [x] Frontend: SocialMediaPanel embedded in RepurposingModal for easy publishing
- [x] Error handling: Graceful failures for API errors and auth issues
- [x] All tests passing (57 passed, 7 skipped)


## Future Enhancements for Social Media
- [ ] OAuth 2.0 connection flows for Twitter/X and LinkedIn (auth URLs, callbacks, token exchange)
- [ ] Token refresh mechanism for expired credentials
- [ ] Batch publishing to multiple platforms simultaneously
- [ ] Scheduled social media posts (publish at specific time)
- [ ] Social media account analytics page in dashboard
- [ ] Rate limit handling and retry logic
- [ ] Post preview before publishing
- [ ] Integration tests for social publishing and analytics sync

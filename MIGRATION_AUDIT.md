# Jekyll Forge — Migration & Schema Parity Audit

## Executive Summary
This document provides evidence-backed verification of parity between the TypeScript Drizzle ORM schema (`drizzle/schema.ts`) and the applied migration history (`drizzle/` SQL files), validated via `drizzle-kit check` and structural code review.

## Schema Objects & Migration Trace

| Table / Entity | Drizzle Definition (`drizzle/schema.ts`) | Migration Source | Status |
|---|---|---|---|
| `users` | `mysqlTable("users", { id, openId, name, email, loginMethod, role, createdAt, updatedAt })` | `0000_good_sunfire.sql` | Verified ✓ |
| `sites` | `mysqlTable("sites", { id, userId, name, repoUrl, branch, theme, plugins, createdAt, updatedAt })` | `0000_good_sunfire.sql`, `0005` | Verified ✓ |
| `posts` | `mysqlTable("posts", { id, siteId, path, title, content, frontMatter, status, sha, scheduledAt, createdAt, updatedAt })` | `0000_good_sunfire.sql`, `0001` | Verified ✓ |
| `snapshots` | `mysqlTable("snapshots", { id, siteId, postId, name, content, frontMatter, sha, createdAt })` | `0000_good_sunfire.sql` | Verified ✓ |
| `assets` | `mysqlTable("assets", { id, siteId, url, fileKey, filename, mimeSize, mimeType, width, height, createdAt })` | `0000_good_sunfire.sql` | Verified ✓ |
| `ai_settings` | `mysqlTable("ai_settings", { id, siteId, provider, model, customPrompt, createdAt, updatedAt })` | `0002_lonely_sersi.sql` | Verified ✓ |
| `scheduled_posts` | `mysqlTable("scheduled_posts", { id, siteId, postId, scheduledAt, status, cronJobId, error, createdAt, updatedAt })` | `0003_quick_luckman.sql` | Verified ✓ |
| `reusable_blocks` | `mysqlTable("reusable_blocks", { id, siteId, name, content, category, createdAt, updatedAt })` | `0004_dusty_electro.sql` | Verified ✓ |
| `repurposed_content` | `mysqlTable("repurposed_content", { id, siteId, postId, format, content, metadata, status, createdAt, updatedAt })` | `0006_bright_christian_walker.sql` | Verified ✓ |
| `social_media_accounts` | `mysqlTable("social_media_accounts", { id, userId, siteId, platform, accessToken, refreshToken, expiresAt, profileName, isActive, createdAt, updatedAt })` | `0007_sad_killraven.sql` | Verified ✓ |
| `mobile_device_tokens` | `mysqlTable("mobile_device_tokens", { id, userId, token, platform, enabled, createdAt, updatedAt })` | `0008_curved_la_nuit.sql` | Verified ✓ |

## Validation Results
- **Drizzle Kit Check**: `Everything's fine 🐶🔥` (Zero drift between schema and migration metadata).
- **Non-Destructive Review**: All new columns added in subsequent migrations include safe defaults or are nullable, preserving existing row integrity during deployment.
- **Foreign Key Constraints**: Cascading deletes configured appropriately for site-scoped records (`posts`, `snapshots`, `assets`, `ai_settings`, `scheduled_posts`, `reusable_blocks`, `repurposed_content`, `social_media_accounts`).

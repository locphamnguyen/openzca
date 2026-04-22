# Port openzca Features to ZaloCRM

**Date:** 2026-04-16
**Branch:** locphamnguyen/port-openzca-to-zalocrm
**Status:** IMPLEMENTED (Backend — Phases 0-5 complete)
**Scope:** FULL PORT — all 80 features, 5 phases

## Architecture Decisions (Eng Review)
- **1A: ZaloOperations service class** — single service wrapping all zca-js calls with account resolution + error handling + Socket.IO emission. All route handlers delegate to it.
- **2B: One migration per phase** — incremental Prisma schema changes, testable and rollbackable per phase.
- **3B: Full-stack per phase** — each phase delivers backend + frontend end-to-end. No dead APIs.

---

## Context

**openzca** is a Node.js CLI (v0.1.58, ~8200 LOC main file) for Zalo messaging built on zca-js.
**ZaloCRM** is a TypeScript full-stack web CRM (Fastify 5 + Vue 3 + PostgreSQL 16 + Socket.IO) for managing Zalo accounts at scale.

Both use `zca-js` v2.1.2. The goal is to identify all openzca capabilities and plan which ones to port into ZaloCRM's web platform.

---

## Complete openzca Feature Catalog

### 1. ACCOUNT — Multi-profile Management (8 commands)
| # | Command | Description | ZaloCRM Has? |
|---|---------|-------------|:---:|
| 1 | `account list` | List all profiles | YES (ZaloAccount) |
| 2 | `account current` | Show active profile | YES |
| 3 | `account switch` | Set default profile | YES (UI switching) |
| 4 | `account add` | Create new profile | YES |
| 5 | `account label` | Set label for profile | PARTIAL (name only) |
| 6 | `account remove` | Remove profile | YES |

### 2. AUTH — Authentication & Cache (7 commands)
| # | Command | Description | ZaloCRM Has? |
|---|---------|-------------|:---:|
| 7 | `auth login` | QR code login | YES |
| 8 | `auth login-cred` | Login via credential JSON | NO |
| 9 | `auth logout` | Remove credentials | YES (disconnect) |
| 10 | `auth status` | Show login status | YES (health check) |
| 11 | `auth cache-refresh` | Refresh friends/groups cache | PARTIAL (auto-sync) |
| 12 | `auth cache-info` | Show cache metadata | NO |
| 13 | `auth cache-clear` | Clear local cache | NO |

### 3. MSG — Messaging (21 commands)
| # | Command | Description | ZaloCRM Has? |
|---|---------|-------------|:---:|
| 14 | `msg send` | Send formatted text | YES (basic) |
| 15 | `msg analyze-text` | Preview text payload/chunking | NO |
| 16 | `msg image` | Send image(s) from file/URL | YES |
| 17 | `msg video` | Send video with ffmpeg native mode | PARTIAL (basic) |
| 18 | `msg voice` | Send voice message | NO |
| 19 | `msg upload` | Upload and send file(s) | YES (file attach) |
| 20 | `msg sticker` | Send sticker by ID | YES (render only) |
| 21 | `msg link` | Send link preview | NO |
| 22 | `msg card` | Send contact card | NO |
| 23 | `msg react` | React to message (emoji) | NO |
| 24 | `msg typing` | Send typing indicator | NO |
| 25 | `msg forward` | Forward text to multiple targets | NO |
| 26 | `msg delete` | Delete message (self/all) | NO |
| 27 | `msg undo` | Recall sent message | NO |
| 28 | `msg edit` | Edit sent message | NO |
| 29 | `msg recent` | List recent messages | YES (auto-sync) |
| 30 | `msg pin` | Pin conversation | NO |
| 31 | `msg unpin` | Unpin conversation | NO |
| 32 | `msg list-pins` | List pinned conversations | NO |
| 33 | `msg member-info` | Get member info | PARTIAL |
| 34 | `msg reply` | Reply to specific message | NO |

### 4. GROUP — Group Management (23 commands)
| # | Command | Description | ZaloCRM Has? |
|---|---------|-------------|:---:|
| 35 | `group list` | List all groups | YES |
| 36 | `group info` | Get group info | YES |
| 37 | `group members` | List group members | YES |
| 38 | `group create` | Create new group | NO |
| 39 | `group poll create` | Create poll | NO |
| 40 | `group poll detail` | Get poll detail | NO |
| 41 | `group poll vote` | Vote on poll | NO |
| 42 | `group poll lock` | Close poll | NO |
| 43 | `group poll share` | Share poll | NO |
| 44 | `group rename` | Rename group | NO |
| 45 | `group avatar` | Change group avatar | NO |
| 46 | `group settings` | Update group settings | NO |
| 47 | `group add` | Add users to group | NO |
| 48 | `group remove` | Remove users from group | NO |
| 49 | `group add-deputy` | Promote to deputy | NO |
| 50 | `group remove-deputy` | Demote deputy | NO |
| 51 | `group transfer` | Transfer ownership | NO |
| 52 | `group block` | Block group member | NO |
| 53 | `group unblock` | Unblock member | NO |
| 54 | `group blocked` | List blocked members | NO |
| 55 | `group pending` | List pending requests | NO |
| 56 | `group review` | Approve/deny request | NO |
| 57 | `group enable-link` | Enable invite link | NO |
| 58 | `group disable-link` | Disable invite link | NO |
| 59 | `group link-detail` | Get invite link | NO |
| 60 | `group join-link` | Join via link | NO |
| 61 | `group leave` | Leave group | NO |
| 62 | `group disperse` | Disband group | NO |

### 5. FRIEND — Friend Management (16 commands)
| # | Command | Description | ZaloCRM Has? |
|---|---------|-------------|:---:|
| 63 | `friend list` | List all friends | YES (contact list) |
| 64 | `friend find` | Find by phone/name/username | YES (search) |
| 65 | `friend online` | List online friends | NO |
| 66 | `friend recommendations` | Get friend recommendations | NO |
| 67 | `friend add` | Send friend request | NO |
| 68 | `friend accept` | Accept friend request | NO |
| 69 | `friend reject` | Reject friend request | NO |
| 70 | `friend cancel` | Cancel sent request | NO |
| 71 | `friend sent` | List sent requests | NO |
| 72 | `friend request-status` | Check request status | NO |
| 73 | `friend remove` | Remove friend | NO |
| 74 | `friend alias` | Set friend alias | PARTIAL (CRM name) |
| 75 | `friend remove-alias` | Remove alias | PARTIAL |
| 76 | `friend aliases` | List all aliases | NO |
| 77 | `friend block/unblock` | Block/unblock user | NO |
| 78 | `friend block-feed/unblock-feed` | Block feed visibility | NO |
| 79 | `friend boards` | Get boards in conversation | NO |

### 6. ME — Profile Commands (9 commands)
| # | Command | Description | ZaloCRM Has? |
|---|---------|-------------|:---:|
| 80 | `me info` | Get account info | YES |
| 81 | `me id` | Get own user ID | YES |
| 82 | `me update` | Update name/gender/birthday | NO |
| 83 | `me avatar` | Change avatar | NO |
| 84 | `me avatars` | List avatars | NO |
| 85 | `me delete-avatar` | Delete avatar | NO |
| 86 | `me reuse-avatar` | Reuse previous avatar | NO |
| 87 | `me status` | Set online/offline | NO |
| 88 | `me last-online` | Get user last online time | NO |

### 7. LISTEN — Real-time Listener (1 command, many modes)
| # | Command | Description | ZaloCRM Has? |
|---|---------|-------------|:---:|
| 89 | `listen` (echo mode) | Echo incoming messages | YES (Socket.IO) |
| 90 | `listen` (raw mode) | JSON line output | NO (internal) |
| 91 | `listen` (webhook mode) | POST to URL | YES (webhooks) |
| 92 | `listen` (keep-alive) | Auto-restart on disconnect | YES (ZaloPool) |
| 93 | `listen` (supervised) | Lifecycle events for orchestration | NO |
| 94 | `listen` (IPC upload) | Unix socket upload acceleration | NO |
| 95 | `listen` (recycle) | Periodic forced restart | NO |
| 96 | `listen` (DB persist) | SQLite message persistence | YES (PostgreSQL) |

### 8. DB — SQLite Database (18 commands)
| # | Command | Description | ZaloCRM Has? |
|---|---------|-------------|:---:|
| 97 | `db enable/disable/reset/status` | DB lifecycle | YES (always-on PG) |
| 98 | `db me info/id` | Self profile from DB | YES |
| 99 | `db group list/info/members/messages` | Group queries | YES |
| 100 | `db contact list/find/info/messages` | Contact queries | YES |
| 101 | `db friend chat list/info/messages` | Chat queries | YES |
| 102 | `db message get` | Get message by ID | YES |
| 103 | `db sync all/groups/friends/chats` | Sync from Zalo API | PARTIAL |

### 9. Core Library Capabilities
| # | Capability | Description | ZaloCRM Has? |
|---|-----------|-------------|:---:|
| 104 | Markdown-to-Zalo text styles | Bold, italic, color, headings, lists, code blocks | NO |
| 105 | Group @mention resolution | `@Name`/`@userId` auto-resolve | NO |
| 106 | Text chunking (2000 char limit) | Smart split with style preservation | NO |
| 107 | Adaptive batching | Large request optimization | NO |
| 108 | Send retry with backoff | Exponential retry logic | NO |
| 109 | FFmpeg video native mode | Thumbnail gen, Zalo video upload | NO |
| 110 | Voice publish command hook | Custom voice publishing pipeline | NO |
| 111 | IPC upload acceleration | Unix socket fast upload | NO |
| 112 | Listener ownership locking | Single owner per profile | PARTIAL (ZaloPool) |

---

## Gap Analysis Summary

| Category | Total Commands | ZaloCRM Has | Missing | % Coverage |
|----------|:---:|:---:|:---:|:---:|
| Account | 6 | 5 | 1 | 83% |
| Auth | 7 | 4 | 3 | 57% |
| Messaging | 21 | 5 | 16 | 24% |
| Group | 28 | 3 | 25 | 11% |
| Friend | 17 | 3 | 14 | 18% |
| Profile (me) | 9 | 2 | 7 | 22% |
| Listen | 8 | 4 | 4 | 50% |
| DB | 7 | 6 | 1 | 86% |
| Core Libs | 9 | 0 | 9 | 0% |
| **TOTAL** | **112** | **32** | **80** | **29%** |

**80 features missing from ZaloCRM.** These are the porting candidates.

---

## Porting Priority Tiers

### Tier 1 — HIGH VALUE, LOW EFFORT (Port First)
Features that directly improve CRM user experience and use existing zca-js calls.

| Phase | Features | Effort | Impact |
|-------|----------|--------|--------|
| 1A | Message reactions (react) | 1 day | High — basic chat UX |
| 1B | Typing indicator | 0.5 day | Medium — live chat feel |
| 1C | Message delete/undo/edit | 2 days | High — essential chat ops |
| 1D | Reply to message | 1 day | High — conversation threading |
| 1E | Pin/unpin conversation | 1 day | Medium — inbox management |
| 1F | Send link preview | 0.5 day | Medium — rich messaging |
| 1G | Send contact card | 0.5 day | Low — niche use |

### Tier 2 — HIGH VALUE, MEDIUM EFFORT
Features that expand CRM's Zalo management capabilities.

| Phase | Features | Effort | Impact |
|-------|----------|--------|--------|
| 2A | Group management (create, rename, avatar, settings) | 3 days | High — team collaboration |
| 2B | Group membership (add/remove, deputy, transfer, block) | 3 days | High — group admin |
| 2C | Group invite links (enable/disable/join) | 1 day | Medium — growth |
| 2D | Group polls (create, vote, lock, share) | 2 days | Medium — engagement |
| 2E | Friend requests (add/accept/reject/cancel) | 2 days | High — CRM outreach |
| 2F | Friend online status | 1 day | Medium — presence info |

### Tier 3 — MEDIUM VALUE, MEDIUM EFFORT
Features that add power-user capabilities.

| Phase | Features | Effort | Impact |
|-------|----------|--------|--------|
| 3A | Markdown text formatting (bold, italic, colors, code) | 3 days | High — professional msgs |
| 3B | Group @mention resolution | 1 day | Medium — group comms |
| 3C | Text chunking (smart split) | 1 day | Medium — long messages |
| 3D | Message forwarding to multiple targets | 1 day | High — broadcast |
| 3E | Profile management (avatar, name, gender, birthday) | 2 days | Low — admin feature |
| 3F | Friend alias management | 1 day | Low — name override |

### Tier 4 — SPECIALIZED, HIGHER EFFORT
Features requiring deeper integration work.

| Phase | Features | Effort | Impact |
|-------|----------|--------|--------|
| 4A | Video native mode (ffmpeg thumbnail + upload) | 3 days | Medium — better video |
| 4B | Voice message sending | 2 days | Medium — audio comms |
| 4C | Credential file import/export | 1 day | Low — migration tool |
| 4D | Send retry with exponential backoff | 1 day | High — reliability |
| 4E | Friend recommendations | 1 day | Low — discovery |
| 4F | Friend block/unblock + feed privacy | 1 day | Low — privacy |

### NOT in Scope (Deferred)
| Feature | Reason |
|---------|--------|
| CLI-specific DB commands | ZaloCRM has PostgreSQL; SQLite irrelevant |
| IPC upload acceleration | Architecture-specific to CLI subprocess model |
| Supervised listener mode | ZaloCRM uses ZaloPool, not subprocess listeners |
| Listener recycle timer | ZaloPool handles reconnection differently |
| `auth cache-info/clear` | Cache is internal to ZaloPool |
| `account label` | Minor; ZaloCRM has account naming already |

---

## Implementation Phases

### Phase 0: Infrastructure (3.5 days)
**Files:** `backend/src/shared/`
- ZaloOperations service class (decision 1A) — wraps all zca-js calls
- ZaloRateLimiter service (decision 5A) — Redis-backed, per-account, per-op-type
- Backend event buffer (decision 7B) — Redis pub/sub for typing + reactions
- Session expiry auto-reconnect — operation-level retry with mutex

### Phase 1: Chat Operations Enhancement (1 week)
**Files:** `backend/src/modules/chat/`
- Message reactions (react emoji)
- Typing indicator
- Message delete/undo/edit
- Reply to specific message
- Pin/unpin conversations
- Send link preview + contact card

### Phase 2: Group Management (1 week)
**Files:** `backend/src/modules/zalo/`, new `backend/src/modules/groups/`
- Group CRUD (create, rename, avatar, settings)
- Membership management (add/remove/deputy/transfer/block)
- Invite links
- Polls system

### Phase 3: Friend & Outreach (1 week)
**Files:** `backend/src/modules/contacts/`, new `backend/src/modules/friends/`
- Friend request lifecycle (add/accept/reject/cancel/sent)
- Online status detection
- Friend recommendations
- Block/unblock + feed privacy

### Phase 4: Rich Messaging (1.5 weeks)
**Files:** `backend/src/modules/chat/`, `backend/src/shared/`, `frontend/src/components/`
- Build Vue rich text editor (Tiptap/ProseMirror) with Zalo format output (decision 4B)
- Port group-mentions.ts (@ resolution)
- Port text-send.ts (chunking + payload builder)
- Message forwarding to multiple targets
- Send retry with backoff

### Phase 5: Profile & Media (1 week)
**Files:** `backend/src/modules/zalo/`, `backend/src/shared/`
- Profile management (avatar, update name/gender/birthday)
- Video native mode (ffmpeg integration)
- Voice message sending
- Credential import/export

---

## What Already Exists in ZaloCRM

| ZaloCRM Module | Reuse Potential |
|---------------|----------------|
| `backend/src/modules/zalo/` | ZaloPool, session management — extend for new operations |
| `backend/src/modules/chat/` | Message handler — add reaction, delete, reply routes |
| `backend/src/modules/contacts/` | Contact CRUD — extend for friend request lifecycle |
| `frontend/src/components/` | Chat UI — add reaction picker, typing indicator, rich formatting |
| Prisma schema | Message model — add reaction, pin, edit fields |

---

## Worktree Parallelization Strategy

| Step | Modules Touched | Depends On |
|------|----------------|------------|
| Phase 0 (Infra) | shared/ | — |
| Phase 1 (Chat ops) | chat/, prisma schema | Phase 0 |
| Phase 2 (Groups) | zalo/, groups/ (new) | Phase 0 |
| Phase 3 (Friends) | contacts/, friends/ (new) | Phase 0 |
| Phase 4 (Rich msg) | chat/, shared/, frontend/ | Phase 1 |
| Phase 5 (Profile/Media) | zalo/, shared/ | Phase 0 |

**Parallel Lanes:**
- Lane A: Phase 0 → Phase 1 → Phase 4 (sequential, shared chat/ + shared/)
- Lane B: Phase 2 (independent after Phase 0)
- Lane C: Phase 3 (independent after Phase 0)
- Lane D: Phase 5 (independent after Phase 0)

**Execution:** Phase 0 first (3.5 days). Then launch B + C + D in parallel worktrees. Run A sequentially. Merge all. ~3.5 weeks total with parallelization.

**Conflict flags:** Phase 4 touches chat/ (same as Phase 1) and shared/ (same as Phase 0). Must run after Phase 1 merges. Phases 2, 3, 5 touch different modules and can run fully parallel.

---

## Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| zca-js API breaking changes | High | Pin version, wrap all calls |
| Zalo account suspension (anti-bot) | High | Rate limiting already in ZaloCRM; honor 200/day |
| Schema migrations on live DB | Medium | Prisma migrate, test on staging first |
| Frontend complexity explosion | Medium | Component library, shared composables |
| Group operations need admin perms | Low | Validate permissions before calling zca-js |

---

## Success Criteria

- [ ] Phase 0 infra: ZaloOperations + RateLimiter + EventBuffer + AutoReconnect
- [ ] All Tier 1 features working in ZaloCRM web UI (full-stack, decision 3B)
- [ ] All Tier 2 features with backend API + frontend UI
- [ ] All Tier 3 features including Vue rich text editor (decision 4B)
- [ ] All Tier 4 features with backend API + frontend UI
- [ ] No regression in existing ZaloCRM features
- [ ] Rate limiting respected for ALL operation types (decision 5A)
- [ ] Mock-based test coverage for 80 operations (decision 6A)
- [ ] Backend event buffer working for typing + reactions (decision 7B)
- [ ] All new API endpoints documented
- [ ] Prisma migrations clean and rollbackable per phase (decision 2B)

---

## Eng Review Decisions Log

| # | Decision | Choice | Rationale |
|---|----------|--------|-----------|
| 1A | Service layer pattern | ZaloOperations service class | DRY for 80 ops, mock boundary |
| 2B | Migration strategy | One migration per phase | Incremental, rollbackable |
| 3B | Frontend approach | Full-stack per phase | End-to-end value each phase |
| 4B | Text formatting | Vue rich text editor (Tiptap) | Better UX than raw markdown |
| 5A | Rate limiting | Centralized ZaloRateLimiter | Account safety, all op types |
| 6A | Test strategy | Mock zca-js at service boundary | 240 test cases coverage |
| 7B | Event handling | Backend Redis buffer | Scales to 50+ users, RabbitMQ/Redis |

## Failure Modes

| # | Codepath | Failure | Test? | Handling? | User Sees? | Status |
|---|----------|---------|:---:|:---:|:---:|:---:|
| 1 | ZaloOps.react() | Session expired mid-call | YES (mock) | YES (TODO 5) | Retry | Fixed |
| 2 | ZaloOps.deleteMessage() | Delete others' msg | YES (route) | YES (ACL) | Error toast | OK |
| 3 | ZaloOps.createGroup() | Invalid member IDs | YES (mock) | YES (validation) | Error toast | OK |
| 4 | Rate limiter | Redis connection lost | YES (integration) | YES (fail-open) | Allow through | Fixed |
| 5 | Rich text editor | Output > 2000 chars | YES (unit) | YES (chunking) | Split indicator | OK |
| 6 | Friend request | Target blocked you | YES (mock) | YES (status check) | Error toast | OK |
| 7 | Group poll vote | Poll locked | YES (mock) | YES (status) | Error toast | OK |
| 8 | Typing buffer | Redis slow/full | YES (integration) | YES (drop events) | No typing shown | OK |
| 9 | Video upload | ffmpeg missing in Docker | YES (startup) | YES (fallback) | Basic upload | OK |
| 10 | Migration | Phase 3 migration fails | YES (manual) | YES (rollback) | Deploy blocked | OK |

**Critical gaps: 0** (both original critical gaps addressed by TODOs 5 and rate limiter fail-open)

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/plan-ceo-review` | Scope & strategy | 0 | — | — |
| Codex Review | `/codex review` | Independent 2nd opinion | 0 | — | — |
| Eng Review | `/plan-eng-review` | Architecture & tests (required) | 1 | CLEAR (PLAN) | 7 issues, 0 critical gaps |
| Design Review | `/plan-design-review` | UI/UX gaps | 0 | — | — |
| DX Review | `/plan-devex-review` | Developer experience gaps | 0 | — | — |

- **UNRESOLVED:** 0 decisions remaining
- **VERDICT:** ENG CLEARED — ready to implement

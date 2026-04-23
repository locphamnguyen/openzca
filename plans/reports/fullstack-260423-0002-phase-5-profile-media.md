# Phase 5: Profile & Media — Implementation Report

**Date:** 2026-04-23 00:39
**Branch:** locphamnguyen/port-openzca-to-zalocrm
**Work root:** ZaloCRM-phase3/

---

## Files Created/Modified

### Backend (new)
- `backend/src/modules/zalo/profile-operations.ts` — profile service wrapper; updateProfile/listAvatars/deleteAvatar/reuseAvatar stubbed as skipped (zca-js v2 unsupported)
- `backend/src/shared/video-processor.ts` — ported from openzca video-send.ts; ffmpeg detection, thumbnail gen (256x256), native send, fallback logic
- `backend/src/shared/voice-sender.ts` — voice format validation, sendVoiceMessage, sendVoiceViaOps wrapper
- `backend/src/modules/zalo/credential-routes.ts` — GET/POST /accounts/:id/credentials/export|import; shape validation; admin-only guard
- `backend/tests/profile-media.test.ts` — 36 tests covering all new modules

### Backend (modified)
- `backend/src/modules/zalo/profile-routes.ts` — expanded with full endpoint set + backward-compat legacy routes
- `backend/src/app.ts` — registered `credentialRoutes`

### Frontend (new)
- `frontend/src/composables/use-profile.ts`
- `frontend/src/components/profile/profile-editor.vue`
- `frontend/src/components/profile/avatar-uploader.vue` — drag-drop, 300KB limit
- `frontend/src/components/profile/avatar-history.vue`
- `frontend/src/components/profile/status-toggle.vue`
- `frontend/src/components/chat/video-message-bubble.vue`
- `frontend/src/components/chat/voice-message-bubble.vue` — pseudo-waveform via static bars + native `<audio>`
- `frontend/src/components/chat/voice-recorder.vue` — MediaRecorder API, webm/opus preferred
- `frontend/src/components/zalo/credential-manager.vue`
- `frontend/src/views/ProfileView.vue`

### Frontend (modified)
- `frontend/src/router/index.ts` — added `/profile` route

---

## Endpoints Implemented

| Method | Path | Status |
|--------|------|--------|
| GET | `/api/v1/zalo-accounts/:accountId/profile` | implemented |
| PATCH | `/api/v1/zalo-accounts/:accountId/profile` | skipped — zca-js v2 no updateProfile |
| POST | `/api/v1/zalo-accounts/:accountId/avatar` | implemented (multipart + JSON) |
| GET | `/api/v1/zalo-accounts/:accountId/avatars` | returns [] — zca-js v2 no listAvatars |
| DELETE | `/api/v1/zalo-accounts/:accountId/avatars/:id` | skipped — zca-js v2 |
| POST | `/api/v1/zalo-accounts/:accountId/avatars/:id/reuse` | skipped — zca-js v2 |
| POST | `/api/v1/zalo-accounts/:accountId/status` | implemented |
| GET | `/api/v1/zalo-accounts/:accountId/users/:userId/last-online` | implemented |
| GET | `/api/v1/accounts/:id/credentials/export` | implemented |
| POST | `/api/v1/accounts/:id/credentials/import` | implemented |

Legacy compat routes preserved: `PATCH /profile/avatar`, `PUT /profile/status`, `GET /profile/last-online/:userId`

---

## Tests Added

- New file: `backend/tests/profile-media.test.ts` — **36 tests**
- Total suite: **155 tests, 9 test files — all pass**

---

## Build Status

| Target | Status |
|--------|--------|
| Backend (`tsc`) | PASS |
| Backend tests | 155/155 PASS |
| Frontend (`vue-tsc + vite build`) | PASS |

---

## ffmpeg Detection

- Host: `/opt/homebrew/bin/ffmpeg` v7.1.1 — **available**
- `isFfmpegAvailable()` will return `true` on this machine
- Docker image may lack ffmpeg; `planVideoSendMode` falls back to `attachment` mode automatically with log warning

---

## Unresolved Questions

1. **updateProfile** — zca-js v2 has no `api.updateProfile(name, gender, dob)` method. All profile mutations beyond avatar/status are stubbed with `{ skipped: true }`. Needs upstream zca-js update or direct HTTP call to Zalo API.
2. **listAvatars / deleteAvatar / reuseAvatar** — same gap; no avatar history API in zca-js v2.
3. **Voice duration from browser** — `MediaRecorder` doesn't expose final duration pre-send; duration is estimated from recording time and passed to `api.sendVoice`. Actual playback duration may differ for some codecs.
4. **Credential encryption at rest** — currently stored as plain JSON in `sessionData` (existing behavior). The plan mentioned "encrypt before storage" but no encryption pattern exists in shared/; deferred to a security hardening phase.
5. **Credential encryption at rest** — stored as plain JSON in `sessionData` (existing behavior). Plan mentioned "encrypt before storage" but no encryption pattern exists in shared/; deferred to security hardening phase.

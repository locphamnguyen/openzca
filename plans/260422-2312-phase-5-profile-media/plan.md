# Phase 5: Profile & Media Implementation Plan

**Date:** 2026-04-22
**Branch:** feature/phase-5-profile-media
**Duration:** 1 week
**Status:** PENDING

## Overview

Implement profile management and media operations:
- Profile management (avatar, name, gender, birthday)
- Video native mode (ffmpeg integration)
- Voice message sending
- Credential import/export

## Backend Tasks

### Task 1: Profile Operations Service
- File: `backend/src/modules/zalo/profile-operations.ts` (new)
- Methods: updateProfile, uploadAvatar, listAvatars, deleteAvatar, reuseAvatar, setOnlineStatus, getLastOnline

### Task 2: Profile Routes
- File: `backend/src/modules/zalo/profile-routes.ts` (new)
- Endpoints: PATCH /me/profile, POST /me/avatar, GET /me/avatars, DELETE /me/avatars/:id, POST /me/avatars/:id/reuse, POST /me/status, GET /users/:id/last-online

### Task 3: Video Native Mode
- File: `backend/src/shared/video-processor.ts` (port from openzca/src/lib/video-send.ts)
- Detect ffmpeg/ffprobe availability
- Generate thumbnail from video (256x256 first frame)
- Upload video + thumbnail to Zalo
- Fallback to plain attachment if ffmpeg missing

### Task 4: Voice Message Service
- File: `backend/src/shared/voice-sender.ts` (new)
- Accept audio file (m4a, mp3, ogg)
- Upload to Zalo via voice channel
- Persist with contentType='voice'

### Task 5: Credential Import/Export
- File: `backend/src/modules/zalo/credential-routes.ts` (new)
- Endpoints: GET /accounts/:id/credentials/export (download JSON), POST /accounts/:id/credentials/import (upload JSON)
- Validate credential JSON shape
- Encrypt before storage

### Task 6: Tests
- File: `backend/tests/profile-media.test.ts` (new)
- Mock profile operations, video processing, voice sending
- Test credential validation

## Frontend Tasks

### Task 7: Profile Composables
- File: `frontend/src/composables/use-profile.ts` (new)
- Functions: updateProfile, uploadAvatar, listAvatars, deleteAvatar, setStatus

### Task 8: Profile UI Components
- Files:
  - `frontend/src/components/profile/profile-editor.vue` — name/gender/birthday form
  - `frontend/src/components/profile/avatar-uploader.vue` — drag-drop avatar upload
  - `frontend/src/components/profile/avatar-history.vue` — list/reuse previous avatars
  - `frontend/src/components/profile/status-toggle.vue` — online/offline switch

### Task 9: Media Components
- Files:
  - `frontend/src/components/chat/video-message-bubble.vue` (extend message-bubble.vue) — video player with thumbnail
  - `frontend/src/components/chat/voice-message-bubble.vue` (extend message-bubble.vue) — voice player with waveform
  - `frontend/src/components/chat/voice-recorder.vue` — record voice in chat composer

### Task 10: Credential Management UI
- File: `frontend/src/components/zalo/credential-manager.vue` (new)
- Export current credentials as JSON download
- Import credentials from file upload
- Show backup status

### Task 11: Profile View
- File: `frontend/src/views/ProfileView.vue` (new or extend SettingsView)
- Sections: Profile info, Avatar, Status, Credentials backup

## Acceptance Criteria

- [ ] Can update profile name/gender/birthday
- [ ] Can upload, list, delete, reuse avatars
- [ ] Online/offline status toggle works
- [ ] Video native mode generates thumbnails when ffmpeg available
- [ ] Falls back to plain video attachment when ffmpeg missing
- [ ] Can record and send voice messages
- [ ] Voice messages play with waveform UI
- [ ] Can export credentials as JSON
- [ ] Can import credentials from file
- [ ] Tests pass with 80%+ coverage
- [ ] Backend builds without errors
- [ ] Frontend builds without errors
- [ ] ffmpeg detection logs warning when missing

## Dependencies

- Phase 0: Infrastructure ✅
- Phase 1: Chat Operations ✅

## Risks

- ffmpeg may not be in Docker image (Dockerfile update needed)
- Voice file size limits (likely 5MB max for Zalo)
- Avatar upload size limits (300KB max for Zalo)
- Credential JSON contains sensitive cookies (encrypt at rest)
- Browser audio recording API support varies

## Notes

- ffmpeg already used by openzca CLI; copy detection logic
- Voice recording in browser uses MediaRecorder API
- Credential format documented in openzca's StoredCredentials interface

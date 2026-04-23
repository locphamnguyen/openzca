# Phase 3: Friend & Outreach Implementation Plan

**Date:** 2026-04-22
**Branch:** feature/phase-3-friend-outreach
**Duration:** 1 week
**Status:** PENDING

## Overview

Implement friend management and outreach operations:
- Friend request lifecycle (add/accept/reject/cancel)
- Online status detection
- Friend recommendations
- Block/unblock + feed privacy

## Backend Tasks

### Task 1: Friend Operations Service
- File: `backend/src/modules/contacts/friend-operations.ts` (new)
- Wrap all friend-related zca-js calls
- Methods: addFriend, acceptRequest, rejectRequest, cancelRequest, listSentRequests, checkRequestStatus, removeFriend, blockFriend, unblockFriend, blockFeed, unblockFeed, getRecommendations, getFriendOnlineStatus

### Task 2: Friend Routes
- File: `backend/src/modules/contacts/friend-routes.ts` (new)
- Endpoints: POST /friends/request (add), POST /friends/request/:userId/accept, POST /friends/request/:userId/reject, DELETE /friends/request/:userId (cancel), GET /friends/requests/sent, GET /friends/request-status/:userId, DELETE /friends/:userId (remove), POST /friends/:userId/block, DELETE /friends/:userId/block (unblock), POST /friends/:userId/feed/block, DELETE /friends/:userId/feed/block (unblock), GET /friends/recommendations, GET /friends/:userId/online-status

### Task 3: Prisma Schema
- File: `backend/prisma/schema.prisma`
- Add: FriendRequest model (from, to, status, createdAt), FriendBlock model, OnlineStatus tracking

### Task 4: Rate Limiting
- File: `backend/src/shared/zalo-rate-limiter.ts`
- Add rate limits for: friend.add, friend.request (5/day to prevent spam), friend.block

### Task 5: Tests
- File: `backend/tests/friend-management.test.ts` (new)
- Mock friend operations, test request lifecycle, verify rate limiting

## Frontend Tasks

### Task 6: Friend Composables
- File: `frontend/src/composables/use-friend-operations.ts` (new)
- Functions: sendFriendRequest, acceptRequest, rejectRequest, cancelRequest, removeFriend, blockFriend, unblockFriend, blockFeed, unblockFeed, getRecommendations, trackOnlineStatus

### Task 7: Friend UI Components
- Files:
  - `frontend/src/components/friends/friend-request-list.vue` — incoming/sent requests
  - `frontend/src/components/friends/friend-card.vue` — display friend info, actions
  - `frontend/src/components/friends/recommendations-panel.vue` — suggested friends
  - `frontend/src/components/friends/friend-actions-menu.vue` — block, remove, feed privacy

### Task 8: Friend Views & Integration
- Files:
  - `frontend/src/views/FriendsView.vue` (extend) — list friends, manage requests, recommendations
  - `frontend/src/composables/use-chat.ts` (update) — show friend request status in chat UI
  - `frontend/src/components/chat/ChatContactPanel.vue` (extend) — add friend request action

## Acceptance Criteria

- [ ] All friend operations in FriendOperations service
- [ ] All routes return correct shapes and status codes
- [ ] Friend request lifecycle works end-to-end (add → accept/reject → complete)
- [ ] Can view sent requests and incoming requests
- [ ] Can block/unblock friends and feed visibility
- [ ] Online status updates in real-time (Socket.IO)
- [ ] Recommendations algorithm working
- [ ] Rate limiting prevents spam (5 friend requests/day)
- [ ] Tests pass with 80%+ coverage
- [ ] Backend builds without errors
- [ ] Frontend builds without errors

## Dependencies

- Phase 0: Infrastructure ✅
- Phase 1: Chat Operations ✅

## Risks

- Friend request spam (rate limiting critical)
- Online status accuracy (may lag behind Zalo API)
- Block list privacy edge cases
- Recommendations algorithm relevance

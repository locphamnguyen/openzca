# Phase 2: Group Management Implementation Plan

**Date:** 2026-04-22
**Branch:** feature/phase-2-group-management
**Duration:** 1 week
**Status:** PENDING

## Overview

Implement full group management operations:
- Group CRUD (create, rename, avatar, settings)
- Membership management (add/remove/deputy/transfer/block)
- Invite links (enable/disable/join)
- Polls system (create, vote, lock, share)

## Backend Tasks

### Task 1: Group Operations Service
- File: `backend/src/modules/zalo/group-operations.ts` (new)
- Wrap all group-related zca-js calls
- Methods: createGroup, renameGroup, updateAvatar, updateSettings, addMember, removeMember, promoteDeputy, demoteDeputy, transferOwnership, blockMember, unblockMember, enableInviteLink, disableInviteLink, joinByLink, createPoll, votePoll, lockPoll, sharePoll

### Task 2: Group Routes
- File: `backend/src/modules/zalo/group-routes.ts` (extend existing)
- Endpoints: POST /groups (create), PATCH /groups/:id (rename/settings), POST /groups/:id/avatar (upload), POST /groups/:id/members (add), DELETE /groups/:id/members/:userId (remove), POST /groups/:id/deputy (promote), DELETE /groups/:id/deputy/:userId (demote), POST /groups/:id/transfer/:newOwnerId, POST /groups/:id/block, DELETE /groups/:id/block/:userId, POST /groups/:id/link (enable), DELETE /groups/:id/link (disable), POST /groups/:id/join-link, POST /groups/:id/polls (create), POST /groups/:id/polls/:pollId/vote, PATCH /groups/:id/polls/:pollId (lock), POST /groups/:id/polls/:pollId/share

### Task 3: Prisma Schema
- File: `backend/prisma/schema.prisma`
- Add: Group model enhancements (avatar, settings), GroupMember (role, joinedAt), GroupPoll, GroupInviteLink

### Task 4: Rate Limiting
- File: `backend/src/shared/zalo-rate-limiter.ts`
- Add rate limits for: group.create, group.updateAvatar, member.add, member.remove, poll.create, poll.vote

### Task 5: Tests
- File: `backend/tests/group-management.test.ts` (new)
- Mock group operations, test all endpoints, verify rate limiting

## Frontend Tasks

### Task 6: Group Composables
- File: `frontend/src/composables/use-group-operations.ts` (new)
- Functions: createGroup, renameGroup, updateAvatar, updateSettings, addMember, removeMember, promoteDeputy, demoteDeputy, transferOwnership, blockMember, unblockMember, enableInviteLink, disableInviteLink, joinByLink, createPoll, votePoll, lockPoll

### Task 7: Group UI Components
- Files:
  - `frontend/src/components/groups/group-editor.vue` — create/edit group form
  - `frontend/src/components/groups/member-manager.vue` — add/remove members
  - `frontend/src/components/groups/invite-link-manager.vue` — link management
  - `frontend/src/components/groups/poll-creator.vue` — poll creation UI
  - `frontend/src/components/groups/poll-voter.vue` — voting UI

### Task 8: Group Views
- File: `frontend/src/views/GroupsView.vue` (extend)
- Sections: List groups, Create group, Edit group, Manage members, Manage links, Manage polls

## Acceptance Criteria

- [ ] All group operations in ZaloOperations + GroupOperations services
- [ ] All routes return correct shapes and status codes
- [ ] Frontend components compile and render correctly
- [ ] Can create, rename, update group avatar and settings
- [ ] Can add/remove members, manage roles
- [ ] Invite links work end-to-end
- [ ] Polls can be created, voted on, locked, shared
- [ ] Rate limiting enforced for all operations
- [ ] Tests pass with 80%+ coverage
- [ ] Backend builds without errors
- [ ] Frontend builds without errors

## Dependencies

- Phase 0: Infrastructure ✅
- Phase 1: Chat Operations ✅

## Risks

- Group permissions (not all users can create/manage groups)
- Avatar upload size limits
- Poll participation state tracking

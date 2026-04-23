# Phase 4: Rich Messaging Implementation Plan

**Date:** 2026-04-22
**Branch:** feature/phase-4-rich-messaging
**Duration:** 1.5 weeks
**Status:** PENDING

## Overview

Implement advanced messaging features:
- Vue rich text editor (Tiptap) with Zalo formatting
- Group @mention resolution
- Text chunking for 2000+ char messages
- Message forwarding to multiple targets
- Send retry with exponential backoff

## Backend Tasks

### Task 1: Text Formatting Service
- File: `backend/src/shared/text-formatter.ts` (port from openzca)
- Markdown-to-Zalo conversion: bold, italic, strikethrough, headings, lists, code blocks, colors, underline
- HTML input support (from Tiptap editor)
- Output: Zalo API text style payload

### Task 2: Group Mentions Service
- File: `backend/src/modules/chat/group-mentions-resolver.ts` (port from openzca)
- Parse `@Name`/`@userId` in text
- Resolve against group member list
- Handle conflicts (multiple members with same name)
- Output: Zalo @mention payload

### Task 3: Text Chunking Service
- File: `backend/src/modules/chat/text-chunker.ts` (port from openzca)
- Smart split text at 2000 char boundaries
- Preserve markdown/style formatting across chunks
- Handle inline/block elements correctly
- Output: array of message chunks

### Task 4: Message Forward Route
- File: `backend/src/modules/chat/chat-routes.ts` (extend)
- Endpoint: POST /conversations/:id/forward with `{ msgId, targetConversationIds }`
- Call `zaloOps.forwardMessage()` for each target
- Persist forward metadata

### Task 5: Retry with Backoff
- File: `backend/src/shared/retry-handler.ts` (new)
- Exponential backoff: 1s, 2s, 4s, 8s max
- Applicable to: sendMessage, addReaction, deleteMessage, editMessage
- Circuit breaker for rate limit 429
- Jitter to prevent thundering herd

### Task 6: Rate Limiting Extensions
- File: `backend/src/shared/zalo-rate-limiter.ts` (extend)
- Add limits for: message.forward, message.sendChunked

### Task 7: Tests
- File: `backend/tests/rich-messaging.test.ts` (new)
- Test text formatting with all markdown types
- Test @mention resolution with name conflicts
- Test text chunking across boundaries
- Test forward to multiple conversations
- Test retry backoff logic

## Frontend Tasks

### Task 8: Tiptap Rich Editor
- File: `frontend/src/components/chat/rich-text-editor.vue` (extend)
- Extensions: bold, italic, underline, strike, heading, bullet list, code block, blockquote, color, link
- Toolbar buttons for all formatting
- Keyboard shortcuts (Ctrl+B, Ctrl+I, etc.)
- Output: HTML → Tiptap → Backend text-formatter

### Task 9: @Mention Plugin
- File: `frontend/src/components/chat/mention-popup.vue` (new)
- Show group members on `@` trigger
- Autocomplete filtering
- Insert @mention into editor
- Visual indicator in editor

### Task 10: Message Forwarding UI
- File: `frontend/src/components/chat/forward-dialog.vue` (extend if exists or create)
- Multi-select target conversations
- Confirm before forwarding
- Show preview of message being forwarded

### Task 11: Send with Formatting
- File: `frontend/src/composables/use-chat.ts` (update sendMessage)
- Send formatted text with @mentions
- Handle chunked messages (show progress)
- Retry logic on 429 errors with user notification

## Acceptance Criteria

- [ ] Tiptap editor renders with all formatting options
- [ ] Markdown → Zalo text styles conversion working
- [ ] @mention resolution works in groups
- [ ] Text chunking handles 5000+ char messages
- [ ] Message forwarding works to multiple conversations
- [ ] Retry backoff prevents rate limit 429
- [ ] All formatting preserved through send → receive → display
- [ ] Tests pass with 85%+ coverage
- [ ] Backend builds without errors
- [ ] Frontend builds without errors
- [ ] Editor renders correctly on desktop and mobile

## Dependencies

- Phase 0: Infrastructure ✅
- Phase 1: Chat Operations ✅
- Phase 2: Group Management (for @mention resolution)
- Phase 3: Friend & Outreach

## Risks

- Tiptap bundle size (consider lazy loading)
- @mention resolution with 500+ members (performance)
- Text formatting edge cases (nested styles, mixed markdown/HTML)
- Retry backoff may cause user confusion on long waits
- Chunked message numbering/tracking

## Notes

- Tiptap is already in package.json, just need to configure extensions
- Text formatter logic already ported in early exploration, reuse if available
- @mention can initially be simple autocomplete, advance to fuzzy search later

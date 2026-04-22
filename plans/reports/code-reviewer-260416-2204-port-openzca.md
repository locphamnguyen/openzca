# Code Review: ZaloCRM Port from openzca

**Reviewer:** code-reviewer  
**Date:** 2026-04-16  
**Branch:** locphamnguyen/port-openzca-to-zalocrm

---

## Scope

- **Files reviewed:** 30+ backend + frontend files
- **LOC:** ~3,800 (new code)
- **Focus:** Security, correctness, consistency, type safety, performance, API contracts

---

## Overall Assessment

The port is well-structured with good separation of concerns. The `zaloOps` service provides a clean centralized wrapper with rate limiting and auto-reconnect. Route helpers enforce DRY auth/access patterns. Frontend composables correctly wrap all API endpoints. No raw SQL injection risks in new code (all Prisma parameterized). No `v-html` usage (no XSS via template injection).

However, there are several production-readiness concerns detailed below.

---

## Critical Issues

### C1. Session Expiry Detection is Overly Broad (False Positive Reconnect Loop)

**File:** `backend/src/shared/zalo-operations.ts:88-98`

```ts
function isSessionExpiredError(err: any): boolean {
  const msg = String(err?.message || err || '').toLowerCase();
  return (
    msg.includes('session') ||
    msg.includes('expired') ||
    msg.includes('not logged in') ||
    msg.includes('cookie') ||
    msg.includes('unauthorized') ||
    msg.includes('login required') ||
    msg.includes('invalid token')
  );
}
```

**Problem:** Matching on substrings like `'session'` or `'cookie'` is dangerously broad. Any error message containing "session" (e.g., "Failed to parse session data for group settings", "Invalid cookie format in request body") would trigger a reconnect attempt. This could cause:
- Spurious reconnect storms when the actual error is a transient API issue
- Masking of real bugs — the reconnect silently swallows the first error
- Database load from `prisma.zaloAccount.findUnique` on every false positive

**Suggested fix:** Use stricter matching patterns. Match against known zca-js error codes/messages rather than substring search. At minimum, require multiple keywords (e.g., `session` AND `expired`), or check for specific error codes from the zca-js library.

### C2. Reconnect Race Condition: Mutating `instance.api` on Shared Object

**File:** `backend/src/shared/zalo-operations.ts:168-169`

```ts
const freshInstance = zaloPool.getInstance(accountId);
if (freshInstance?.api && freshInstance.status === 'connected') {
  instance.api = freshInstance.api;  // <-- mutating the original reference
  continue;
}
```

**Problem:** The `instance` variable was captured at line 120 from `zaloPool.getInstance()`. After reconnect, the code mutates `instance.api` directly. If two concurrent `exec()` calls are in the retry phase for the same account, both would:
1. Race to call `attemptReconnect()` (the mutex handles this correctly)
2. Both get `freshInstance` and mutate `instance.api` simultaneously

The fundamental issue is that `instance` is a shared mutable object from the pool. While the reconnect mutex prevents duplicate reconnects, the `instance.api` mutation is not synchronized. A concurrent non-reconnecting call could be mid-flight using the old `api` reference while it's being replaced.

**Suggested fix:** Don't mutate `instance.api`. Instead, get a fresh reference from the pool and use it directly for the retry:
```ts
const freshInstance = zaloPool.getInstance(accountId);
if (freshInstance?.api && freshInstance.status === 'connected') {
  // Use fresh API for retry, don't mutate captured reference
  result = await fn(freshInstance.api);
  // ... handle success
  return result;
}
```

### C3. Missing Authorization on Friend Routes (All Destructive Operations)

**File:** `backend/src/modules/zalo/friend-routes.ts` (entire file)

**Problem:** Unlike `group-routes.ts` and `profile-routes.ts` which use `checkAccess(request, reply, accountId, 'admin')` for destructive operations, the friend routes only call `resolveAccount()` (which checks orgId ownership) but **never** call `checkAccess()`. This means any authenticated user in the org can:
- Send/accept/reject friend requests (lines 115-153)
- Remove friends (line 171)
- Block/unblock users (lines 214-237)
- Block feed (lines 240-263)
- Change aliases (lines 184-209)

All of these are destructive operations on a shared Zalo account.

**Suggested fix:** Add `checkAccess` calls matching the group routes pattern:
- Read operations (list, find, online, recommendations): `'read'` permission
- Mutating operations (send request, remove friend, block, alias): `'chat'` or `'admin'` permission

---

## High Priority

### H1. Forward Message: Sequential N+1 Database Queries in Loop

**File:** `backend/src/modules/chat/chat-operations-routes.ts:183-190`

```ts
for (const targetId of targetConversationIds) {
  const target = await prisma.conversation.findFirst({ where: { id: targetId, orgId: user.orgId } });
  if (!target) continue;
  const threadType = target.threadType === 'group' ? 1 : 0;
  await zaloOps.forwardMessage(conv.zaloAccountId, msgId, target.externalThreadId || '', threadType);
  forwarded++;
}
```

**Problem:** For N target conversations, this executes N sequential database queries + N sequential API calls. If a user forwards to 20 conversations, this blocks for 20 round trips. No upper bound on `targetConversationIds` length either.

**Suggested fix:**
1. Add a max limit on `targetConversationIds.length` (e.g., 10)
2. Batch the DB query: `prisma.conversation.findMany({ where: { id: { in: targetConversationIds }, orgId: user.orgId } })`
3. Consider `Promise.allSettled` for the Zalo API calls (though rate limiting may make sequential preferable)

### H2. Rate Limiter Memory Leak: `recentSends` Never Fully Cleaned

**File:** `backend/src/modules/zalo/zalo-rate-limiter.ts:83`

```ts
const recent = (this.recentSends.get(key) || []).filter(t => now - t < 60_000);
```

**Problem:** The `recentSends` Map grows entries for every `accountId:category` key pair ever seen. The filter removes old timestamps from existing arrays, but the Map keys themselves are never pruned. Over weeks of operation with many accounts, this accumulates stale entries. The `dailyCounts` Map has the same issue — old dates are never cleaned up, they just get overwritten per-key the next day.

**Suggested fix:** Add a periodic cleanup (e.g., every hour) that removes keys with empty arrays from `recentSends` and removes `dailyCounts` entries for past dates. Or better: set up a `setInterval` in a `start()` method that prunes stale entries.

### H3. `event-buffer.ts`: Typing Events Broadcast to All Clients

**File:** `backend/src/shared/event-buffer.ts:130`

```ts
ioRef.emit('chat:typing', { conversationId, typers: activeTypers });
```

**Problem:** `ioRef.emit(...)` broadcasts to **all** connected Socket.IO clients. This means every user in the system receives typing indicators for every conversation in every org. This is:
- A **data leak** — users see who is typing in conversations they don't have access to
- A **performance issue** — unnecessary event traffic for all clients

The same issue exists at line 139 for `chat:reactions`.

**Suggested fix:** Emit to Socket.IO rooms scoped by conversation or org:
```ts
ioRef.to(`conv:${conversationId}`).emit('chat:typing', { conversationId, typers: activeTypers });
```

### H4. Delete/Edit Message: No Ownership Verification

**File:** `backend/src/modules/chat/chat-operations-routes.ts:96-122` (delete) and `148-167` (edit)

**Problem:** The delete and edit endpoints check that the conversation belongs to the user's org and that the user has 'chat' access, but they don't verify that the message being deleted/edited was sent by the current user. Any user with 'chat' permission can delete or edit any message in the conversation.

For delete, the `onlyMe` parameter controls Zalo-side behavior but doesn't gate whether the caller should be allowed to delete someone else's message. For edit, editing another user's message is almost certainly wrong.

**Suggested fix:** For edit: verify `msg.repliedByUserId === user.id` or `msg.senderUid` matches the user's Zalo UID. For delete: either restrict to own messages or require 'admin' permission to delete others' messages.

### H5. Socket.IO Events Emitted Without Room Scoping

**File:** `backend/src/modules/chat/chat-operations-routes.ts:119,142,164,207,224`

Same issue as H3 but for message operations:
```ts
io?.emit('chat:deleted', { conversationId: id, msgId });
io?.emit('chat:message-edited', { conversationId: id, msgId, content });
io?.emit('chat:pinned', { conversationId: id });
```

All these broadcast to every connected client, leaking conversation activity across orgs. Should be scoped to `io.to(`conv:${id}`)` or at minimum `io.to(`org:${orgId}`)`.

---

## Medium Priority

### M1. Pervasive `any` Types in Frontend Composables

**Files:** All composables (`use-groups.ts`, `use-friends.ts`, `use-polls.ts`) and components

```ts
const groups = ref<any[]>([]);
const selectedGroup = ref<any | null>(null);
const members = ref<any[]>([]);
```

**Problem:** Over 40 instances of `any` across frontend composables and component props. This eliminates all compile-time type checking for data flowing between backend and frontend. Typos in property accesses like `m.displayName` vs `m.display_name` won't be caught.

**Suggested fix:** Define TypeScript interfaces for the zca-js response shapes (Group, Member, Friend, Poll) and use them. Even partial interfaces with optional properties would catch common mistakes.

### M2. `use-chat-operations.ts`: Module-Level State Creates Singleton Coupling

**File:** `frontend/src/composables/use-chat-operations.ts:7-12`

```ts
const typingUsers = ref<Map<string, { userId: string; userName: string }[]>>(new Map());
const replyingTo = ref<Message | null>(null);
const editingMessage = ref<Message | null>(null);
const typingTimers = new Map<string, ReturnType<typeof setTimeout>>();
```

**Problem:** These are module-level singletons. Every component calling `useChatOperations()` shares the same `replyingTo` and `editingMessage` refs. If two chat windows are open simultaneously (e.g., in different tabs or side-by-side), replying in one window would clear/overwrite the editing state of the other.

**Suggested fix:** If singleton behavior is intentional (global state store), document it. If per-instance behavior is expected, move the state inside the composable function. Consider using a conversation-keyed map instead.

### M3. `message-context-menu.vue`: Context Menu Position May Overflow Viewport

**File:** `frontend/src/components/chat/message-context-menu.vue:11`

```html
<v-card :style="{ top: `${position.y}px`, left: `${position.x}px` }" ...>
```

**Problem:** The context menu is positioned at the mouse event coordinates using `position: fixed`. If the right-click happens near the bottom or right edge of the viewport, the menu will overflow off-screen. No viewport boundary clamping is applied.

**Suggested fix:** Clamp the position values against `window.innerWidth - menuWidth` and `window.innerHeight - menuHeight`.

### M4. `text-formatter.ts`: Mention Regex Only Matches ASCII Word Characters

**File:** `backend/src/shared/text-formatter.ts:183`

```ts
const mentionRe = /@[\w]+/g;
```

**Problem:** `\w` matches `[a-zA-Z0-9_]` only. Vietnamese names (the primary user base) contain diacritical characters like Nguy?n, Tr?n, etc. These won't match, meaning `@Nguy?n` would only capture `@Nguy`, producing incorrect mention offsets.

**Suggested fix:** Use a Unicode-aware pattern: `/@[\p{L}\p{N}_]+/gu` or at minimum `/@[^\s]+/g` to match until whitespace.

### M5. `profile-routes.ts`: Avatar Upload Accepts Arbitrary File Path

**File:** `backend/src/modules/zalo/profile-routes.ts:47-48`

```ts
const { filePath } = request.body as { filePath: string };
if (!filePath) return reply.status(400).send({ error: 'filePath is required' });
```

**Problem:** The `filePath` parameter is passed directly to `zaloOps.changeAccountAvatar(accountId, filePath)` which calls `api.changeAccountAvatar(filePath)`. If `filePath` is a server filesystem path (rather than a pre-uploaded file), this could allow:
- **Path traversal** — reading arbitrary files from the server (e.g., `/etc/passwd`)
- **SSRF** — if zca-js supports URLs, pointing to internal network resources

**Suggested fix:** Validate that `filePath` points to an expected upload directory or is an allowed URL scheme. Alternatively, use multipart file upload instead of accepting raw paths.

### M6. `group-settings-dialog.vue`: Missing Settings Pass-Through

**File:** `frontend/src/components/groups/group-settings-dialog.vue:70-73`

```ts
function save() {
  emit('save', { name: newName.value.trim() });
  open.value = false;
}
```

**Problem:** The dialog emits `save` with only `{ name }`, but the parent `GroupsView.vue:178-181` only calls `renameGroup` if `settings.name` changed. The `updateSettings` endpoint (for modifying lockSendMsg, lockAddMember, etc.) is never exposed in the dialog. The group settings functionality is incomplete.

### M7. `poll-create-dialog.vue`: Options Can Be Empty After Filter

**File:** `frontend/src/components/groups/poll-create-dialog.vue:129`

```ts
options: form.value.options.map(o => o.trim()).filter(Boolean),
```

The submit button is disabled when `form.options.some(o => !o.trim())`, but there's a TOCTOU gap: the button disabled state and the actual submit run at different times. If options are modified between the check and the emit, you could submit an empty options array. The backend correctly validates `options.length < 2`, but the frontend should also validate at submit time.

### M8. Inconsistent Error Response Shapes

**Files:** `chat-operations-routes.ts` vs `zalo-route-helpers.ts`

`chat-operations-routes.ts:36`:
```ts
reply.status(err.statusCode).send({ error: err.message });
```

`zalo-route-helpers.ts:48`:
```ts
reply.status(err.statusCode).send({ error: err.message, code: err.code });
```

**Problem:** The chat operations routes strip the `code` field from error responses while the helper routes include it. Frontend code may need the `code` field to differentiate between `RATE_LIMITED` and `NOT_CONNECTED` errors for different UX treatment.

**Suggested fix:** Use the same `handleError` from `zalo-route-helpers.ts` in `chat-operations-routes.ts`, or at minimum include the `code` field consistently.

---

## Low Priority

### L1. `event-buffer.ts`: Reaction Batching Loses Events for Multi-Message Conversations

**File:** `backend/src/shared/event-buffer.ts:104-109`

```ts
let batch = reactionBuffer.get(conversationId);
if (!batch || batch.msgId !== msgId) {
  batch = { msgId, conversationId, reactions: [] };
  reactionBuffer.set(conversationId, batch);
}
```

**Problem:** The reaction buffer is keyed by `conversationId`, not by `conversationId:msgId`. If two users react to different messages in the same conversation within the 1-second flush window, the second reaction overwrites the first batch (because `batch.msgId !== msgId` causes a new batch to be created, discarding the previous one).

**Suggested fix:** Key the buffer by `${conversationId}:${msgId}` or use a Map<string, ReactionBatch[]> to accumulate multiple message batches per conversation.

### L2. Unused `actionLoading` ref in GroupsView

**File:** `frontend/src/views/GroupsView.vue:114`

```ts
const { ... actionLoading, ... } = useGroups();
```

`actionLoading` is destructured but never used in the template or script. Should either be used (e.g., to disable buttons during action) or removed from destructuring.

### L3. `friend-request-panel.vue`: accept/reject Emits Defined but No UI

**File:** `frontend/src/components/friends/friend-request-panel.vue`

The component defines `accept` and `reject` emits (lines 58-59) but only renders "Sent requests" with a cancel button. There's no UI for incoming requests with accept/reject buttons, meaning these emits are dead code.

### L4. `forward-dialog.vue`: `selected` Not Reset on Dialog Reopen

**File:** `frontend/src/components/chat/forward-dialog.vue:100-101`

```ts
const query = ref('');
const selected = ref<string[]>([]);
```

These refs are initialized once. If the dialog is closed and reopened without the component being destroyed (which is typical with `v-dialog`), the previous selection and search query persist. The `onForward` function resets `selected` after forward, but not on cancel.

### L5. `rich-text-editor.vue`: Emits Plain Text, Loses Formatting

**File:** `frontend/src/components/chat/rich-text-editor.vue:110-111`

```ts
onUpdate({ editor: ed }) {
  const text = ed.getText();
  emit('update:modelValue', text);
```

**Problem:** The editor supports bold, italic, underline, lists, and code blocks via the toolbar, but `ed.getText()` strips all formatting and emits plain text. The formatting the user applied is lost. To preserve it, you'd need to emit HTML or a structured format that the backend's `text-formatter.ts` can process.

---

## Positive Observations

1. **Centralized operation wrapper** (`zaloOps.exec`) is excellent architecture — single place for rate limiting, retry, and logging
2. **Reconnect mutex** prevents thundering herd on session expiry
3. **Consistent route structure** across group, friend, and profile modules
4. **No raw SQL** in new code — all Prisma parameterized queries
5. **No v-html** in Vue components — no template injection XSS
6. **Proper auth middleware** hook registration on all route files
7. **Clean component decomposition** — bubble, picker, display, context menu are well-separated
8. **Event buffer** is a thoughtful optimization to prevent event storms
9. **Rate limiter** with per-category limits is a good defense against account bans

---

## Recommended Actions (Priority Order)

1. **[CRITICAL]** Add `checkAccess()` calls to all friend routes (C3)
2. **[CRITICAL]** Fix session expiry detection to avoid false-positive reconnect storms (C1)
3. **[CRITICAL]** Fix `instance.api` mutation race condition in exec retry (C2)
4. **[HIGH]** Scope all Socket.IO emits to conversation/org rooms (H3, H5)
5. **[HIGH]** Add message ownership check on edit/delete (H4)
6. **[HIGH]** Batch forward DB queries and add max target limit (H1)
7. **[HIGH]** Add rate limiter memory cleanup (H2)
8. **[MEDIUM]** Validate avatar `filePath` against allowed directories (M5)
9. **[MEDIUM]** Fix mention regex for Unicode/Vietnamese names (M4)
10. **[MEDIUM]** Standardize error response shapes (M8)
11. **[MEDIUM]** Add TypeScript interfaces for frontend data shapes (M1)

---

## Metrics

| Metric | Value |
|--------|-------|
| Type coverage (backend new files) | Good (few `any` except for zca-js API types) |
| Type coverage (frontend new files) | Poor (~40+ `any` usages in composables/components) |
| Raw SQL injection risk | None (no raw queries in new code) |
| XSS risk | None (no v-html, no innerHTML) |
| Auth coverage (backend routes) | **Gap**: friend-routes.ts missing `checkAccess()` |
| Socket.IO scoping | **Gap**: all emits broadcast to global namespace |

---

## Unresolved Questions

1. Is the `filePath` in profile-routes avatar endpoint intended to be a server-local path or a URL? If server-local, how does the file get uploaded first?
2. Does the `zaloPool.getInstance()` return a mutable reference or a copy? This determines the severity of C2.
3. Are Socket.IO rooms (`conv:${id}`, `org:${orgId}`) already set up elsewhere in the codebase for clients to join? If not, the scoping fix for H3/H5 requires client-side changes too.
4. What is the intended behavior for `rich-text-editor.vue` — should formatting be preserved in the sent message (requires switching from `getText()` to `getHTML()` or a markdown export)?

---

**Status:** DONE_WITH_CONCERNS  
**Summary:** Port is architecturally sound but has 3 critical issues (missing auth on friend routes, overly broad session expiry detection, race condition on reconnect) and 5 high-priority issues (Socket.IO data leak, missing ownership checks, N+1 queries, memory leak, event broadcast scope).  
**Concerns:** C3 (missing auth) and H3/H5 (cross-org data leak via Socket.IO) are the most urgent for production. They can be exploited by any authenticated user.

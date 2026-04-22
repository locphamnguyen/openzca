# TODOS — Port openzca to ZaloCRM

## Phase 0: Infrastructure (before feature work)

### TODO 1: ZaloOperations Service Class
- **What:** Create `backend/src/shared/zalo-operations.ts` wrapping all zca-js API calls
- **Why:** DRY pattern for 80 operations. Single place for account resolution, error handling, Socket.IO emission, rate limiting
- **Pros:** Every new operation is a 5-line method. Testable mock boundary (decision 6A)
- **Cons:** 1 day upfront before any feature ships
- **Context:** ZaloCRM's ZaloPool manages sessions but doesn't wrap individual operations. This service sits between route handlers and ZaloPool. All 80 ported features call through this service. It resolves which Zalo account to use, gets the session, calls zca-js, catches errors (including session-expired), emits Socket.IO events, and logs the operation
- **Depends on:** Nothing. Must complete before Phase 1
- **Effort:** ~1 day

### TODO 2: ZaloRateLimiter Service
- **What:** Create `backend/src/shared/zalo-rate-limiter.ts` with per-account, per-operation-type limits backed by Redis
- **Why:** Account safety for 80 new operations. Zalo bans accounts for API abuse beyond messaging
- **Pros:** Centralized rate limiting visible in dashboard. Fail-open with in-memory fallback when Redis unavailable (failure mode #4 fix)
- **Cons:** ~1 day to build. Redis dependency (already optional in docker-compose, becomes required)
- **Context:** ZaloCRM already has 200 msg/day limit. This extends to ALL operation types: group admin (50/day), friend requests (30/day), reactions (100/day), profile updates (10/day). Configurable per-org
- **Depends on:** ZaloOperations service (TODO 1)
- **Effort:** ~1 day

### TODO 3: Backend Event Buffer (Redis-backed)
- **What:** Create `backend/src/shared/event-buffer.ts` for typing indicators + reaction batching via Redis pub/sub
- **Why:** Prevent Socket.IO event storms in multi-user conversations. Decision 7B
- **Pros:** Scales to 50+ concurrent users per conversation. Batches typing events (1s window) and reaction updates. RabbitMQ/Redis integration per user request
- **Cons:** ~1.5 days. Redis becomes required dependency (currently optional)
- **Context:** openzca is single-user CLI, no multi-user concern. ZaloCRM must handle N users watching same conversation. In a 10-person team, one user typing emits to 9 clients. Buffer aggregates: "users A, B are typing" as single event per second
- **Depends on:** Redis in docker-compose (already present as optional)
- **Effort:** ~1.5 days

### TODO 5: Session Expiry Auto-Reconnect
- **What:** Add auto-reconnect + operation retry in ZaloOperations when zca-js throws session-expired errors
- **Why:** Critical failure mode #1. Without this, operations silently fail when session expires mid-call
- **Pros:** Transparent retry. Users never see transient session errors. Retry with mutex to prevent concurrent reconnect attempts
- **Cons:** ~0.5 day. Must handle reconnect-while-another-reconnect-in-progress
- **Context:** ZaloPool already reconnects on listener disconnect, but doesn't retry failed individual operations. This adds operation-level catch-reconnect-retry
- **Depends on:** ZaloOperations service (TODO 1)
- **Effort:** ~0.5 day

---

## Phase 4: Rich Messaging

### TODO 4: Vue Rich Text Editor (Tiptap/ProseMirror)
- **What:** Build a WYSIWYG rich text editor component that outputs Zalo-compatible format directly from editor state
- **Why:** Decision 4B. Better UX than raw markdown for CRM users. Toolbar buttons for bold, italic, colors, headings, lists
- **Pros:** Intuitive formatting. Non-technical sales/support staff can use rich text without knowing markdown
- **Cons:** ~3 days. Tiptap learning curve. Must build custom output serializer for Zalo's offset-based format (not HTML)
- **Context:** Replaces openzca's regex-based text-styles.ts. Zalo uses offset-based styling: `{offset: 0, length: 5, style: "bold"}` not `<b>text</b>`. The editor needs a custom serializer that walks the ProseMirror document tree and produces Zalo format arrays
- **Depends on:** Phase 4 start. Frontend work can begin in parallel with backend rich messaging APIs
- **Effort:** ~3 days

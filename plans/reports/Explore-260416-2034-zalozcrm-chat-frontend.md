# ZaloCRM Frontend Chat Architecture Exploration

**Date:** 2026-04-16  
**Task:** Explore chat-related Vue components and understand orchestration patterns

---

## 1. Main Chat View Orchestration

**File:** `/Users/martin/conductor/workspaces/openzca/victoria/ZaloCRM/frontend/src/views/ChatView.vue`

### Structure
- **Desktop layout:** Three-panel flex layout (1) conversation list, (2) message thread, (3) contact panel
- **Mobile layout:** Routes to `MobileChatView.vue` (separate responsive component)
- **Layout system:** Uses Vuetify (`v-` components) with flexbox
- **Panel widths:** Resizable with localStorage persistence (`chat-left-width`, `chat-right-width`)

### Template Structure
```
<div class="chat-container d-flex">
  <!-- Left panel: Conversation list (fixed 200-500px) -->
  <ConversationList ... @select @filter-account @update:filters />
  
  <!-- Center panel: Message thread (flex: 1) -->
  <MessageThread ... @send @toggle-contact-panel />
  
  <!-- Right panel: Contact details (320px when open) -->
  <ChatContactPanel v-if="showContactPanel" ... @close @saved />
</div>
```

### Key Setup Pattern
- Uses `useChat()` composable to centralize state
- Props/events form unidirectional data flow (top → down, events ↑ up)
- Emits: `select`, `filter-account`, `update:filters`, `conversation-moved`
- Resize handles use inline mousemove/mouseup listeners with localStorage sync

### Composable Integration
```javascript
const {
  conversations, selectedConvId, selectedConv, messages,
  loadingConvs, loadingMsgs, sendingMsg, searchQuery,
  fetchConversations, selectConversation, sendMessage,
  generateAiSuggestion, generateAiSummary, generateAiSentiment,
  initSocket, destroySocket,
} = useChat();
```

---

## 2. ConversationList.vue Component

**File:** `/Users/martin/conductor/workspaces/openzca/victoria/ZaloCRM/frontend/src/components/chat/ConversationList.vue`

### Features
- **Account filter dropdown:** Fetches `/zalo-accounts`, shows display names
- **Search:** Real-time text search with v-model binding
- **Tab switcher:** Toggle between "Chính" (Main) and "Khác" (Other) conversations
- **Filter chips:** Unread, unreplied, date range, tags with badge counts
- **Context menu:** Right-click to move conversations between tabs

### Props Input
```typescript
defineProps<{
  conversations: Conversation[];
  selectedId: string | null;
  loading: boolean;
  search: string;
}>();
```

### Emits Pattern
```typescript
emit<{
  select: [id: string];
  'update:search': [value: string];
  'filter-account': [accountId: string | null];
  'update:filters': [params: Record<string, string>];
  'tab-changed': [tab: string];
  'conversation-moved': [id: string, tab: string];
}>();
```

### List Item Template
- Avatar (icon for groups, image for users)
- Title: Contact name or group name (bold if unread)
- Subtitle: Last message preview with sentiment badge
- Timestamp: Formatted relative time (vừa xong, 5 phút, 2 ngày, etc.)
- Badge: Unread count (99+ max)
- Account indicator: Small text display name

### Last Message Preview Logic
Handles 15+ content types with emoji:
- `image`, `sticker`, `video`, `voice`, `gif`, `file`, `link`
- `bank_transfer` → 🏦, `call` → 📞, `qr_code` → 📱
- `reminder` → 📅, `poll` → 📊, `note` → 📝, `forwarded` → ↩️, `contact_card` → 👤, `rich` → 📋
- Falls back to JSON parsing for legacy reminder format (`msg.content` with action: `msginfo.actionlist`)

### Filter State Management
```javascript
const filters = reactive({
  unread: boolean,
  unreplied: boolean,
  from: string | null,          // date
  to: string | null,            // date
  tags: string[],
});
```

### API Calls
- `GET /zalo-accounts` → Account options
- `GET /conversations/counts?tab=main&accountId=...` → Badge counts
- `GET /contacts?limit=200&fields=tags` → Available tags
- `PATCH /conversations/{id}/tab` → Move conversation

### Computed Properties
- `hasDateFilter`: Boolean for date range active state
- `hasAnyFilter`: Any filter applied
- `dateLabel`: Formatted range display

---

## 3. SpecialMessageRenderer.vue Component

**File:** `/Users/martin/conductor/workspaces/openzca/victoria/ZaloCRM/frontend/src/components/chat/special-message-renderer.vue`

### Purpose
Renders special message types that require formatted display (not plain text).

### Props Input
```typescript
defineProps<{
  type: string;
  content: any;  // Parsed JSON or string
}>();
```

### Supported Types & Templates

#### Bank Transfer
- Icon: `mdi-bank-transfer` (size 28)
- Card: `v-card variant="tonal" color="success"`
- Display: Bank name, amount (VND currency formatted), description
- Extraction: `content.bankName || content.bankCode`, `content.amount || content.transferAmount`

#### Call (Voice/Video)
- Icon: `mdi-phone` or `mdi-video`
- Chip: Color changes based on missed status (error) or success (primary)
- Label logic:
  - Missed video: "Cuộc gọi video nhỡ"
  - Missed call: "Cuộc gọi nhỡ"
  - Duration: "Cuộc gọi (2p15s)" format
  - No duration: "Cuộc gọi"
- Missed detection: `callType.includes('miss')` or `duration === 0`

#### QR Code
- Icon: `mdi-qrcode` (size 48)
- Card: Outlined, max-width 140px, centered text
- Simple visual placeholder

#### Reminder/Calendar
- Icon: `mdi-calendar-clock`
- Card: Tonal color="warning", displays `content.title`
- Used for scheduled reminders

#### Poll/Vote
- Icon: `mdi-poll`
- Card: Tonal color="info"
- Displays `content.title`

#### Note
- Icon: `mdi-note-text`
- Card: Tonal color="secondary"
- Displays `content.title`

#### Forwarded
- Icon: `mdi-share`
- Chip: Tonal color="purple", label="Tin nhắn chuyển tiếp"

#### Generic Fallback
- Icon: `mdi-message-text`
- Chip: Grey, label="Tin nhắn đặc biệt"

### Helper Functions

**formatAmount(value: number)**
```javascript
new Intl.NumberFormat('vi-VN', { 
  style: 'currency', 
  currency: 'VND' 
}).format(value)
```

**isMissed computed:** Checks callType.toLowerCase() for 'miss' or duration === 0

**callLabel computed:** Builds label with duration or "nhỡ" suffix

---

## 4. MessageThread.vue Component

**File:** `/Users/martin/conductor/workspaces/openzca/victoria/ZaloCRM/frontend/src/components/chat/MessageThread.vue`

### Architecture
- **Sections:** Empty state, header, messages scroller, input area, image preview, snackbar
- **Imports:** SpecialMessageRenderer, AiSuggestionPanel, QuickTemplatePopup
- **Scroll behavior:** Auto-scroll to bottom on new messages via `watch(() => messages.length)`

### Template Structure
```
<div class="message-thread d-flex flex-column">
  <!-- Empty state when no conversation selected -->
  <!-- Header with avatar, contact name, Ask AI button, contact panel toggle -->
  <!-- Messages container (scrollable) -->
    <!-- Progress bar while loading -->
    <!-- For each message: -->
      <!-- Group label (if group chat) -->
      <!-- Message bubble with different styles for self/contact -->
      <!-- Timestamp -->
  <!-- Input area -->
    <!-- AI Suggestion panel (collapsible) -->
    <!-- Quick template popup (triggered by /) -->
    <!-- Textarea with auto-grow (1-3 rows) -->
    <!-- Send button -->
  <!-- Image preview dialog -->
  <!-- Sync snackbar for appointment confirmation -->
</div>
```

### Message Content Routing
1. **Deleted:** Shows strikethrough + "(đã thu hồi)" label
2. **Image:** Renders `<img>` with click-to-preview, extracts from `content.href || content.thumb || content.hdUrl`
3. **File/PDF:** Shows document card with download button
4. **Media types:** Sticker, video, voice, GIF show emoji + label
5. **Reminder (legacy):** Renders inline reminder-card with sync button
6. **Special types:** Delegates to SpecialMessageRenderer (bank_transfer, call, qr_code, poll, note, forwarded, rich)
7. **Default text:** Plain content display with link parsing

### Special Types Detection
```javascript
const SPECIAL_TYPES = new Set([
  'bank_transfer', 'call', 'qr_code', 'reminder', 'poll', 'note', 'forwarded', 'rich',
]);

function isSpecialType(contentType: string | null | undefined): boolean {
  return !!contentType && SPECIAL_TYPES.has(contentType);
}
```

### Content Parsing
```javascript
function parseContent(content: string | null): unknown {
  if (!content) return null;
  try { return JSON.parse(content); } catch { return content; }
}
```

### Image URL Extraction
- Checks multiple nested paths: `href`, `thumb`, `hdUrl`
- Falls back to JSON parsing for complex structures
- Validates URLs end with image extensions or zdn.vn domain

### File Info Extraction
- Parses `params` field (can be nested JSON string)
- Checks for `fileExt` or `fType === 1`
- Formats file size (MB/KB)
- Extracts download URL from `href`

### Reminder Message Detection
```javascript
function isReminderMessage(msg: Message): boolean {
  if (!msg.content) return false;
  try {
    const p = JSON.parse(msg.content);
    return p.action === 'msginfo.actionlist';  // Legacy pattern
  } catch { return false; }
}

// Time extraction from nested params.highLightsV2
// Sync to CRM appointments via POST /appointments
```

### Template Quick-Insert Feature
- Triggered by typing `/` at input start
- Filters templates by query (text after /)
- Arrow keys navigate, Enter selects
- Loads from `GET /automation/templates`
- Inserts rendered template content at cursor position

### Input Keydown Handling
```javascript
function onInputKeydown(e: KeyboardEvent) {
  if (!showTemplatePopup.value) return;
  if (['ArrowUp', 'ArrowDown', 'Enter', 'Escape'].includes(e.key)) {
    popupRef.value?.onKey(e);
  }
}
```

### Styling
- Message bubbles: Self (primary bg, white text), contact (white bg)
- Reminder card: Left border 3px (#FFB74D), warning background
- File card: Bordered, info accent color
- Images: Rounded corners, hover scale effect

---

## 5. ChatContactPanel.vue Component

**File:** `/Users/martin/conductor/workspaces/openzca/victoria/ZaloCRM/frontend/src/components/chat/ChatContactPanel.vue`

### Layout & Structure
- **Width:** Fixed 320px
- **Scroll:** `overflow-y: auto` for long contact details
- **Sections:** Header → form fields → save button → AI cards → appointments

### Header
- Icon: `mdi-account-details`
- Title: "Thông tin khách hàng"
- Close button: Emits `close` event

### Form Fields (reactive state via useChatContactPanel composable)
```typescript
form = reactive({
  crmName: string,              // Tên CRM (tên thật)
  fullName: string,             // Tên hiển thị Zalo
  phone: string,
  email: string,
  source: string | null,
  status: string | null,
  firstContactDate: string,     // type="date"
  nextAppointmentDate: string,  // type="date"
  tags: string[],               // v-combobox multiple chips
  notes: string,
});
```

### Lead Score Display
- Chip with icon `mdi-star`, dynamic color based on score:
  - score >= 70: "success" (green)
  - score >= 40: "orange"
  - < 40: "error" (red)
- Shows "X điểm" and last activity relative time

### Action Buttons
- **Save button:** Primary block button, loading state while saving
- **Success/Error alerts:** Collapsible with auto-hide
- **Refresh buttons:** For AI summary and sentiment (within cards)

### AI Integration Cards

#### AI Summary Card
- Component: `AiSummaryCard`
- Props: `summary` (string), `loading` (boolean)
- Event: `@refresh` → emits `refresh-ai-summary`

#### AI Sentiment Card
- Title: "Cảm xúc khách hàng" with refresh button
- Component: `AiSentimentBadge` (displays sentiment label)
- Shows reason field if available
- Event: `@refresh` → emits `refresh-ai-sentiment`

### Appointments Section
- Component: `ChatAppointments`
- Props: `contactId`, `appointments` array
- Event: `@refresh` → calls `reloadAppointments()`
- Only renders if `contactId` exists

### Props Input
```typescript
defineProps<{
  contactId: string | null;
  contact: Contact | null;
  aiSummary: string;
  aiSummaryLoading: boolean;
  aiSentiment: AiSentiment | null;
  aiSentimentLoading: boolean;
}>();
```

### Emits Pattern
```typescript
emit<{
  close: [];
  saved: [];
  'refresh-ai-summary': [];
  'refresh-ai-sentiment': [];
}>();
```

### Composable Integration
```typescript
const {
  form,
  saving, saveSuccess, saveError,
  contactAppointments,
  saveContact,
  reloadAppointments,
} = useChatContactPanel(
  () => props.contactId,
  () => props.contact,
  () => emit('saved'),
);
```

### Helper Functions
- `scoreColor(score)`: Returns color name based on lead score thresholds
- `relativeTime(dateStr)`: Converts date to "Hôm nay", "Hôm qua", or "X ngày trước"

---

## 6. Use-Chat Composable

**File:** `/Users/martin/conductor/workspaces/openzca/victoria/ZaloCRM/frontend/src/composables/use-chat.ts`

### Type Definitions
```typescript
interface AiSentiment {
  label: 'positive' | 'neutral' | 'negative';
  confidence: number;
  reason: string;
}

interface Conversation {
  id: string;
  threadType: 'user' | 'group';
  contact: Contact | null;
  zaloAccount: ZaloAccount | null;
  lastMessageAt: string | null;
  unreadCount: number;
  isReplied: boolean;
  messages?: ConversationMessage[];
}

interface Message {
  id: string;
  content: string | null;
  contentType: string;
  senderType: string;
  senderName: string | null;
  sentAt: string;
  isDeleted: boolean;
  zaloMsgId: string | null;
}
```

### Reactive State References
- `conversations`: Conversation[]
- `selectedConvId`: string | null
- `messages`: Message[]
- `loadingConvs`, `loadingMsgs`, `sendingMsg`: boolean flags
- `searchQuery`, `accountFilter`: string filtering
- `aiSuggestion`, `aiSummary`: string
- `aiSentiment`: AiSentiment | null
- `aiSuggestionLoading`, `aiSummaryLoading`, `aiSentimentLoading`: boolean
- `extraFilters`: Record<string, string> (from ConversationList)

### Key Functions
- `fetchConversations()`: GET /conversations with search, accountId, extraFilters
- `selectConversation(id)`: Sets selectedConvId and fetches messages
- `sendMessage(content)`: POST message to conversation
- `generateAiSuggestion()`: Generates reply suggestion
- `generateAiSummary()`: Generates contact summary
- `generateAiSentiment()`: Analyzes customer sentiment
- `initSocket()`: WebSocket connection for real-time updates
- `destroySocket()`: Cleanup on unmount

---

## 7. Data Flow & Communication Patterns

### Top-Down Props Flow
```
ChatView (orchestrator)
├── ConversationList (receives conversations[], selectedId, search, loading)
├── MessageThread (receives conversation, messages[], loading)
└── ChatContactPanel (receives contact, aiSummary, aiSentiment, loading flags)
```

### Bottom-Up Events Flow
```
ChatView (listens)
├── ConversationList emits: select, filter-account, update:filters, conversation-moved
├── MessageThread emits: send, toggle-contact-panel, ask-ai
└── ChatContactPanel emits: close, saved, refresh-ai-summary, refresh-ai-sentiment
```

### Composable Orchestration
- `useChat()` provides all state and methods
- ChatView calls composable functions on events
- Direct state mutations through ref updates
- Socket.io integration for real-time sync

### Message Content Type Handling
```
Text/Plain → Display as-is
Image → Extract href/thumb, show in bubble with preview
File → Parse params, show download card
Special Type (bank_transfer, call, etc.) → Route to SpecialMessageRenderer
Reminder (legacy) → Inline reminder-card with sync button
```

---

## 8. Key Observations

### Strengths
- **Separation of concerns:** View orchestrator, list/thread/panel components, shared composable
- **Flexible content routing:** Multiple fallback layers for message rendering
- **Real-time sync:** WebSocket integration for live updates
- **AI integration:** Suggestion, summary, sentiment analysis all wired
- **Vietnamese UX:** Full localization with date formatting, labels, placeholders
- **Resizable panels:** localStorage persistence for user preferences

### Patterns Used
- Vue 3 Composition API (setup syntax)
- TypeScript interfaces for type safety
- Reactive refs and computed properties
- Watchers for derived state updates
- Component composition with props/emits
- Vuetify Material Design components
- JSON content parsing with fallback handling

### Content Type Coverage
ConversationList preview + MessageThread + SpecialMessageRenderer together handle:
- Text, images, files, links
- Rich media (sticker, video, voice, GIF)
- Special types (bank transfers, calls, QR codes, polls, notes, reminders, forwarded, rich)
- Group messages with sender labels
- Deleted messages with recovery indication

---

## 9. Files Summary

| File | Purpose | Key Pattern |
|------|---------|------------|
| ChatView.vue | Orchestrator | useChat() composable, 3-panel layout, resizable |
| ConversationList.vue | Sidebar list | Account filter, tabs, chips, context menu |
| MessageThread.vue | Message display | Content routing, template quick-insert, media preview |
| SpecialMessageRenderer.vue | Rich message types | 8+ card/chip templates with icon/color/content |
| ChatContactPanel.vue | Right sidebar | Form editing, AI cards, appointments section |
| use-chat.ts | State management | Types, refs, API calls, socket integration |

---

**Report Generated:** 2026-04-16 20:34 UTC


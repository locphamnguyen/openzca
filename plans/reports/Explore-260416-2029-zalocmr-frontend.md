# ZaloCRM Frontend Codebase Exploration Report

**Date:** 2026-04-16  
**Location:** `/Users/martin/conductor/workspaces/openzca/victoria/ZaloCRM/frontend/`

---

## Executive Summary

ZaloCRM is a Vue 3 + TypeScript + Vite frontend for a Zalo-based CRM system. The application uses:
- **Vue 3** with Composition API
- **Vuetify 4** for Material Design UI
- **Pinia** for state management
- **Vue Router 4** for routing
- **Axios** for API calls
- **Socket.io** for real-time chat
- **Chart.js** for analytics

The codebase is well-organized with clear separation between components, composables, stores, and views. It supports both desktop and mobile layouts with responsive design patterns.

---

## 1. Directory Structure

```
src/
├── api/                  # API client setup
├── assets/              # Images, CSS, fonts
├── components/          # Reusable Vue components
│   ├── ai/             # AI-powered features (sentiment, suggestions, summary)
│   ├── analytics/      # Analytics & reporting charts
│   ├── automation/     # Automation rule builders
│   ├── chat/           # Chat UI components
│   ├── contacts/       # Contact management
│   ├── dashboard/      # Dashboard metrics & charts
│   └── settings/       # Organization & team settings
├── composables/        # Vue 3 composition API hooks
├── layouts/            # Page layout templates
├── plugins/            # Vuetify theme & plugins
├── router/             # Vue Router configuration
├── stores/             # Pinia state stores
├── views/              # Page-level components
├── main.ts             # App initialization
└── style.css           # Global styles
```

---

## 2. Vue Components Overview

### 2.1 Chat-Related Components

**Location:** `src/components/chat/`

| Component | Purpose | Key Features |
|-----------|---------|--------------|
| `MessageThread.vue` | Main chat message view | Message rendering, media support (images, files, videos), special message types (reminders, transfers, polls), message templates, AI suggestions |
| `ConversationList.vue` | Conversation sidebar | Search, filtering (unread, unreplied, date range, tags), tab switching (main/other), conversation counts, sentiment badges, context menu for moving conversations |
| `ChatContactPanel.vue` | Contact info sidebar | Contact CRUD, lead score display, appointment management, AI sentiment analysis, AI summary |
| `ChatAppointments.vue` | Appointment list for contact | Appointment CRUD, status filtering |
| `quick-template-popup.vue` | Message template autocomplete | Template suggestions triggered by `/` keystroke |
| `special-message-renderer.vue` | Rich message rendering | Bank transfers, QR codes, reminders, polls, forwarded messages |

**Message Types Supported:**
- Text messages
- Images, stickers, GIFs, videos, voice messages
- Links (with title extraction)
- Files/PDFs
- Bank transfers (with JSON metadata)
- Calendar reminders (msginfo.actionlist format)
- Polls, notes, QR codes
- Forwarded messages
- Rich/special message types

**Chat Features:**
- Real-time messaging via Socket.io
- Message deletion tracking
- Unread count management
- Message templates with quick insert (`/`)
- Group chat support with sender names
- Contact profile sync during chat

### 2.2 Contact Management Components

**Location:** `src/components/contacts/`

| Component | Purpose |
|-----------|---------|
| `ContactDetailDialog.vue` | View/edit individual contact |
| `ContactFilters.vue` | Filter toolbar (search, source, status) |
| `DuplicateReviewDialog.vue` | Merge duplicate contacts |

### 2.3 Dashboard & Analytics

**Location:** `src/components/dashboard/` and `src/components/analytics/`

| Component | Purpose |
|-----------|---------|
| `KpiCards.vue` | Key metrics display |
| `MessageVolumeChart.vue` | Message statistics |
| `PipelineChart.vue` | Sales pipeline visualization |
| `SourceChart.vue` | Contact source distribution |
| `AppointmentChart.vue` | Appointment metrics |
| `ConversionFunnelChart.vue` | Conversion funnel analysis |
| `ResponseTimeChart.vue` | Response time metrics |
| `TrendLineChart.vue` | Trend visualization |
| `TeamLeaderboard.vue` | Team performance ranking |
| `ReportBuilder.vue` | Custom report generator |

### 2.4 AI Components

**Location:** `src/components/ai/`

| Component | Purpose |
|-----------|---------|
| `ai-suggestion-panel.vue` | AI reply suggestions |
| `ai-summary-card.vue` | Conversation summary |
| `ai-sentiment-badge.vue` | Sentiment indicator badge |
| `ai-config-dialog.vue` | AI settings (Anthropic/Gemini) |

**AI Features:**
- Provider selection (Anthropic Claude, Google Gemini)
- Daily usage quotas (500 requests default)
- Sentiment analysis (positive/neutral/negative with confidence)
- Conversation summaries
- Reply suggestions
- Config with API key management

### 2.5 Automation Components

**Location:** `src/components/automation/`

| Component | Purpose |
|-----------|---------|
| `RuleBuilder.vue` | Visual rule creation |
| `ConditionEditor.vue` | Condition configuration |
| `ActionEditor.vue` | Action configuration |
| `TemplateManager.vue` | Message template management |

### 2.6 Settings Components

**Location:** `src/components/settings/`

| Component | Purpose |
|-----------|---------|
| `TeamManagement.vue` | Team CRUD operations |
| `OrgSettings.vue` | Organization settings |
| `ZaloAccessDialog.vue` | Zalo account linking |

### 2.7 Other Components

| Component | Purpose |
|-----------|---------|
| `BottomNav.vue` | Mobile bottom navigation |
| `GlobalSearch.vue` | Global search across all data |
| `NotificationBell.vue` | Notification center |
| `OfflineIndicator.vue` | Offline status indicator |
| `PullToRefresh.vue` | Mobile pull-to-refresh |
| `MobileQuickActions.vue` | Mobile action buttons |

---

## 3. View Pages

**Location:** `src/views/`

| View | Route | Purpose |
|------|-------|---------|
| `LoginView.vue` | `/login` | User authentication |
| `SetupView.vue` | `/setup` | Initial organization setup |
| `DashboardView.vue` | `/` | Main dashboard with KPIs |
| `ChatView.vue` | `/chat` | Main chat interface (desktop) |
| `MobileChatView.vue` | `/chat` | Chat interface (mobile) |
| `ContactsView.vue` | `/contacts` | Contact management |
| `MobileContactView.vue` | `/contacts` | Contacts (mobile) |
| `ZaloAccountsView.vue` | `/zalo-accounts` | Zalo account management |
| `AppointmentsView.vue` | `/appointments` | Appointment calendar |
| `ReportsView.vue` | `/reports` | Custom reports |
| `AnalyticsView.vue` | `/analytics` | Analytics dashboard |
| `SettingsView.vue` | `/settings` | Team & user management |
| `ApiSettingsView.vue` | `/api-settings` | API keys & webhooks |
| `IntegrationsView.vue` | `/integrations` | Third-party integrations |
| `AutomationView.vue` | `/automation` | Automation rule management |
| `NotFoundView.vue` | `/*` | 404 error page |

---

## 4. Composables (Vue 3 Hooks)

**Location:** `src/composables/`

### 4.1 Chat & Messaging

**`use-chat.ts`**
- Manages: conversations, messages, message sending, socket.io connection
- Handles AI features: suggestions, summaries, sentiment analysis
- Real-time events: `chat:message`, `chat:deleted`
- State: `conversations`, `selectedConvId`, `messages`, `aiSuggestion`, `aiSummary`, `aiSentiment`
- Methods: `fetchConversations()`, `fetchMessages()`, `selectConversation()`, `sendMessage()`, `generateAiSuggestion()`, `generateAiSummary()`, `generateAiSentiment()`, `initSocket()`, `destroySocket()`

**`use-message-templates.ts`**
- Template CRUD operations
- Personal vs. shared templates
- Template categories

**`use-chat-contact-panel.ts`**
- Contact form state management during chat
- Contact save/fetch operations
- Appointment loading
- Reactive form with: `fullName`, `crmName`, `phone`, `email`, `source`, `status`, `tags`, `notes`, `nextAppointmentDate`, `firstContactDate`

### 4.2 Contacts Management

**`use-contacts.ts`**
- Contact CRUD operations
- Filtering: search, source, status
- Pagination support (page, limit)
- Interfaces: `Contact`, `ContactFilters`, `DuplicateGroup`
- Exports: `SOURCE_OPTIONS`, `STATUS_OPTIONS`
- Methods: `fetchContacts()`, `createContact()`, `updateContact()`, `deleteContact()`, `fetchContact()`

**`useContactIntelligence()`** (sub-function in use-contacts.ts)
- Duplicate detection & merging
- Contact intelligence recomputation
- Methods: `fetchDuplicateGroups()`, `mergeDuplicateGroup()`, `recomputeIntelligence()`

### 4.3 Appointments

**`use-appointments.ts`**
- Appointment CRUD
- Date range filtering
- Status management (scheduled, completed, cancelled, no_show)
- Appointment types (follow_up, new_visit, consultation, other)
- Quick shortcuts: `fetchToday()`, `fetchUpcoming()`
- Methods: `markComplete()`, `cancelAppointment()`

### 4.4 Team & Organization

**`use-teams.ts`**
- Team management (CRUD)
- Team member management (add, remove)
- Methods: `fetchTeams()`, `createTeam()`, `updateTeam()`, `deleteTeam()`, `fetchMembers()`, `addMember()`, `removeMember()`

**`use-users.ts`**
- User profile management
- User list/search

**`use-zalo-accounts.ts`**
- Zalo account linking
- Account list management

### 4.5 Analytics & Reporting

**`use-analytics.ts`**
- Dashboard metrics fetching
- Chart data aggregation
- Report generation

**`use-dashboard.ts`**
- Dashboard state management
- Widget configuration

### 4.6 Infrastructure

**`use-offline-queue.ts`**
- Offline message queue
- Network status detection
- Retry logic for failed requests

**`use-automation-rules.ts`**
- Rule CRUD operations
- Automation workflow management

**`use-mobile.ts`**
- Mobile breakpoint detection
- Responsive layout flags
- Export: `isMobile` (reactive boolean)

---

## 5. Stores (Pinia)

**Location:** `src/stores/`

### `auth.ts`

**State:**
```typescript
interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
  orgId: string;
  orgName: string;
}

user: Ref<User | null>
token: Ref<string>
needsSetup: Ref<boolean>
```

**Computed:**
- `isAuthenticated`: token && user exist
- `isOwner`: role === 'owner'
- `isAdmin`: role in ['owner', 'admin']

**Methods:**
- `checkSetup()`: Check if initial setup needed
- `setup(data)`: Initial organization setup
- `login(email, password)`: User authentication
- `fetchProfile()`: Fetch current user profile
- `logout()`: Clear auth state
- `init()`: Initialize from stored token

---

## 6. Router Configuration

**Location:** `src/router/index.ts`

**Routes:**
- `/login` → LoginView (auth layout)
- `/setup` → SetupView (auth layout)
- `/` → DashboardView (default layout)
- `/chat` → ChatView (default layout)
- `/contacts` → ContactsView (default layout)
- `/zalo-accounts` → ZaloAccountsView (default layout)
- `/appointments` → AppointmentsView (default layout)
- `/reports` → ReportsView (default layout)
- `/analytics` → AnalyticsView (default layout)
- `/settings` → SettingsView (default layout)
- `/api-settings` → ApiSettingsView (default layout)
- `/integrations` → IntegrationsView (default layout)
- `/automation` → AutomationView (default layout)
- `/*` → NotFoundView (catch-all)

**Auth Guard:**
- Protects routes with `meta: { requiresAuth: true }`
- Redirects unauthenticated users to `/login`
- Calls `authStore.init()` if user not loaded
- Skips guard for `/login` and `/setup`

---

## 7. API Client & Services

**Location:** `src/api/index.ts`

**Configuration:**
- Base URL: `/api/v1`
- Timeout: 30 seconds
- Uses Axios instance

**Interceptors:**

1. **Request Interceptor:**
   - Adds JWT token from localStorage: `Authorization: Bearer {token}`

2. **Response Interceptor:**
   - Catches 401 (Unauthorized)
   - Clears token from localStorage
   - Redirects to `/login` via Vue Router

**Endpoints Called:**
- `/setup/status`, `/setup` — Initial setup
- `/auth/login` — Login
- `/profile` — User profile
- `/conversations` — List conversations
- `/conversations/{id}/messages` — Get messages
- `/conversations/{id}` — Conversation details
- `/conversations/{id}/mark-read` — Mark as read
- `/conversations/{convId}/messages` — Send message
- `/conversations/{convId}/tab` — Move between tabs
- `/conversations/counts` — Get counts (unread, unreplied)
- `/ai/config` — AI configuration
- `/ai/suggest` — Generate AI suggestion
- `/ai/summarize/{convId}` — Summarize conversation
- `/ai/sentiment/{convId}` — Sentiment analysis
- `/ai/usage` — AI usage stats
- `/contacts` — Contact CRUD
- `/contacts/{id}` — Individual contact
- `/contacts/{id}/appointments` — Contact's appointments
- `/contacts/duplicates` — Duplicate groups
- `/contacts/duplicates/{groupId}/merge` — Merge duplicates
- `/contacts/intelligence/recompute` — Recompute duplicates
- `/appointments` — Appointment CRUD
- `/appointments/today` — Today's appointments
- `/appointments/upcoming` — Upcoming appointments
- `/zalo-accounts` — Zalo account list
- `/automation/templates` — Message templates
- `/teams` — Team management
- `/teams/{id}/members` — Team members

---

## 8. Layouts

**Location:** `src/layouts/`

### `DefaultLayout.vue` (Desktop)
- **Top Bar:** Logo, global search, online status, user name, notifications, theme toggle, logout
- **Sidebar:** Navigation menu (collapsible), menu items with icons
- **Main Content:** RouterView with fluid container
- **Menu Items:** Dashboard, Chat, Contacts, Zalo Accounts, Appointments, Reports, Analytics, Settings, API, Integrations, Automation

### `MobileLayout.vue`
- **Bottom Navigation:** Mobile-optimized nav bar
- **Content:** Full-width RouterView
- **Responsive:** Simplified for mobile

### `AuthLayout.vue`
- Minimal layout for login/setup
- No sidebars or top navigation

---

## 9. Styling & Theme

**Location:** `src/plugins/vuetify.ts` and `src/style.css`

**Theme System:**
- **Dark Theme (Default)**
  - Background: `#0A192F` (dark blue)
  - Surface: `#112240`
  - Primary: `#00F2FF` (cyan)
  - Secondary: `#E6F1FF` (light blue)
  - Success: `#4CAF50` (green)
  - Warning: `#FFB74D` (orange)
  - Error: `#FF5252` (red)

- **Light Theme**
  - Inverted colors
  - Primary: `#0A192F` (dark blue)
  - Accent: `#00B4D8` (cyan)

**Default Component Variants:**
- Buttons: `variant: 'flat'`, `rounded: 'xl'`
- Text fields: `variant: 'outlined'`, `density: 'compact'`, `rounded: 'xl'`
- Cards: `rounded: 'xl'`, `variant: 'flat'`
- Chips: `rounded: 'lg'`, `size: 'small'`
- Dialogs: `maxWidth: 600`

**CSS Classes:**
- `.liquid-bg` — Applied to app in dark theme
- `.ai-core-orb` — AI logo styling
- `.message-bubble` — Chat message styling
- `.chat-image` — Chat image styling
- `.reminder-card` — Reminder message styling
- `.file-card` — File attachment styling

---

## 10. Component Patterns & Practices

### 10.1 Composition API Pattern
```typescript
const { state1, state2, method1, method2 } = useComposable();
```

### 10.2 Props & Emits Pattern
```typescript
const props = defineProps<{ prop1: string; prop2: number }>();
const emit = defineEmits<{ event1: [arg1: string]; event2: [] }>();
```

### 10.3 Reactive State
- Uses `ref()` for primitives
- Uses `reactive()` for objects (filters, forms)
- Computed properties for derived state

### 10.4 Error Handling
- Try/catch with console.error logging
- Non-critical errors don't show UI errors
- Critical errors show v-alert components
- Snackbar for inline notifications

### 10.5 Loading States
- Boolean refs: `loading`, `saving`, `deleting`, `sending`
- Applied to buttons/inputs via `:loading` prop
- Disables interactions during async operations

### 10.6 Form Management
- `reactive()` for form objects
- Manual field binding with `v-model`
- Validation via API response feedback
- Success/error alerts after save

---

## 11. Real-Time Communication

**Socket.io Connection:**
```typescript
socket = io({ transports: ['websocket', 'polling'] });

socket.on('chat:message', (data: { message: Message; conversationId: string }) => {
  // Add new message if in selected conversation
});

socket.on('chat:deleted', (data: { msgId: string }) => {
  // Mark message as deleted
});
```

---

## 12. Responsive Design

### Mobile Breakpoints
- Uses `useMobile()` composable (likely based on window width)
- Renders different components based on `isMobile` flag
- Mobile views: `MobileChatView`, `MobileContactView`
- Desktop views: Full-featured versions
- Mobile layout: Bottom navigation instead of sidebar

### Resizable Panels (Desktop)
- Three-panel chat layout (conversation list, messages, contact panel)
- Resize handles between panels
- Min-width constraints for usability

---

## 13. Data Types & Interfaces

### Contact
```typescript
interface Contact {
  id: string;
  fullName: string | null;
  crmName?: string | null;
  phone: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  source: string | null;
  status: string | null;
  nextAppointment: string | null;
  notes: string | null;
  tags: string[];
  assignedUserId?: string | null;
  assignedUser?: { fullName: string } | null;
  leadScore: number;
  lastActivity: string | null;
  mergedInto: string | null;
}
```

### Conversation
```typescript
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
```

### Message
```typescript
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

### Appointment
```typescript
interface Appointment {
  id: string;
  contactId: string;
  contact?: { id: string; fullName: string | null; phone: string | null };
  appointmentDate: string;
  appointmentTime: string;
  type: string;
  status: string;
  notes: string | null;
  createdAt: string;
}
```

---

## 14. Key Features Summary

### Chat
- Multi-threaded conversations (1-to-1 and groups)
- Rich message support (images, files, videos, stickers, voice)
- Message deletion
- Real-time updates via Socket.io
- Message templates with quick-insert (`/`)
- Unread/unreplied filtering
- Tab switching (main/other conversations)
- Conversation pinning/moving
- Contact integration during chat

### Contacts
- Full CRUD operations
- Filtering by source, status, custom search
- Duplicate detection and merging
- Lead scoring
- Tag management
- CRM name tracking (separate from Zalo name)
- Appointment tracking
- Last activity timestamps
- Assigned user tracking

### Appointments
- Calendar integration
- Today/upcoming quick views
- Status tracking (scheduled, completed, cancelled, no_show)
- Type categorization
- Contact association
- Notes/remarks

### AI Features
- Conversation summarization
- Response suggestions
- Sentiment analysis with confidence scores
- Daily usage quota tracking
- Multi-provider support (Anthropic, Gemini)
- Per-conversation analysis

### Analytics
- Message volume trends
- Response time metrics
- Conversion funnel analysis
- Team performance leaderboard
- Source distribution
- Pipeline visualization
- Custom report builder

### Automation
- Visual rule builder
- Condition/action editors
- Message templates
- Template categories
- Personal vs. shared templates

---

## 15. Dependencies

**Core Framework:**
- `vue@^3.5.30` — UI framework
- `vue-router@^4.6.4` — Routing
- `vuetify@^4.0.4` — Material Design components
- `pinia@^3.0.4` — State management

**API & Real-Time:**
- `axios@^1.13.6` — HTTP client
- `socket.io-client@^4.8.3` — WebSocket communication

**UI & Visualization:**
- `@mdi/font@^7.4.47` — Material Design Icons
- `chart.js@^4.5.1` — Charts
- `vue-chartjs@^5.3.3` — Vue Chart.js integration

**Internationalization:**
- `vue-i18n@^11.3.0` — i18n (Vietnamese translations expected)

**Build Tools:**
- `vite@^8.0.1` — Build tool
- `typescript@~5.9.3` — Type checking
- `vue-tsc@^3.2.5` — Vue TypeScript checking

---

## 16. Code Quality & Patterns

### Strengths
1. **Clear separation of concerns** — Composables, stores, components, views
2. **Reactive state management** — Pinia for global state, composables for local
3. **Type safety** — Full TypeScript with interfaces
4. **Error boundaries** — Try/catch with user-friendly messages
5. **Accessibility** — Vuetify components with proper ARIA
6. **Performance** — Lazy-loaded routes, async imports
7. **Responsive design** — Mobile & desktop layouts
8. **Real-time support** — Socket.io for live updates

### Areas for Enhancement
1. Could add form validation library (Vee-Validate)
2. Could add more granular error handling with custom error types
3. Could extract repeated API patterns into service classes
4. Could add caching layer for contact/conversation lists
5. Could add request debouncing for search/filters

---

## 17. Unresolved Questions

1. **Group Chat Features** — Does the system support group creation, member management, group settings?
2. **Friend List Management** — Is there a dedicated "friends" or "contacts" vs. "groups" distinction?
3. **Profile Features** — Full profile editing, avatar upload, status/availability?
4. **Webhook Configuration** — What webhook events can be configured in API settings?
5. **Backup/Export** — Data export, backup, or archival functionality?
6. **Notifications** — What triggers push notifications? Desktop/mobile support?
7. **Search Scope** — Global search covers contacts, messages, or both?
8. **Customization** — Field customization for contacts? Custom properties?
9. **Permissions** — Role-based access control granularity?
10. **Rate Limiting** — Client-side or server-side message rate limiting?

---

## 18. File Listing

**Total Vue Components:** 38  
**Total Composables:** 13  
**Total Views:** 16  
**Total Layouts:** 3  
**Total Stores:** 1  

**Key Files:**
```
src/main.ts                                    — App initialization
src/App.vue                                    — Root component
src/router/index.ts                            — Router config
src/api/index.ts                               — API client
src/stores/auth.ts                             — Auth store
src/plugins/vuetify.ts                         — Vuetify theme

src/views/ChatView.vue                         — Chat main view
src/views/ContactsView.vue                     — Contacts main view
src/views/DashboardView.vue                    — Dashboard view
src/views/AppointmentsView.vue                 — Appointments view

src/components/chat/MessageThread.vue          — Message display
src/components/chat/ConversationList.vue       — Conversation list
src/components/chat/ChatContactPanel.vue       — Contact sidebar

src/composables/use-chat.ts                    — Chat logic
src/composables/use-contacts.ts                — Contact logic
src/composables/use-appointments.ts            — Appointment logic

src/layouts/DefaultLayout.vue                  — Desktop layout
src/layouts/MobileLayout.vue                   — Mobile layout
src/layouts/AuthLayout.vue                     — Auth layout
```

---

**Report Generated:** 2026-04-16 20:29 UTC

# ZaloCRM Frontend Infrastructure Exploration Report

## Executive Summary
ZaloCRM frontend is a Vue 3 + TypeScript + Vuetify 4 SPA using Vite. Architecture emphasizes composables for state/API logic, components for UI, with Pinia stores for auth. No group/friend management views exist in the current codebase—conversations support `threadType: 'user' | 'group'` but no dedicated UI routes. Tiptap is NOT installed; message composition is plain text.

---

## 1. API Client Setup (`src/api/index.ts`)

**Base Configuration:**
```typescript
const api = axios.create({
  baseURL: '/api/v1',
  timeout: 30000,
});
```

**Key Features:**
- JWT Bearer token injection from `localStorage.getItem('token')`
- 401 response interceptor: clears token, redirects to `/login` (guards against redirect loops)
- Clean error handling with Promise.reject()

**Current Endpoints Used:**
- `/setup/status`, `/setup`, `/auth/login`, `/profile` (auth)
- `/contacts`, `/contacts/:id`, `/contacts/duplicates` (contacts)
- `/conversations`, `/conversations/:id/messages`, `/conversations/:id/mark-read` (chat)
- `/ai/config`, `/ai/usage`, `/ai/suggest`, `/ai/summarize/:id`, `/ai/sentiment/:id` (AI)
- `/zalo-accounts`, `/appointments`, `/reports`, `/analytics`, `/automation` (various modules)

---

## 2. Router Configuration (`src/router/index.ts`)

**Routes Defined (14 total):**

| Path | Name | Component | Auth Required |
|------|------|-----------|---------------|
| `/login` | Login | LoginView.vue | No |
| `/setup` | Setup | SetupView.vue | No |
| `/` | Dashboard | DashboardView.vue | Yes |
| `/chat` | Chat | ChatView.vue | Yes |
| `/contacts` | Contacts | ContactsView.vue | Yes |
| `/zalo-accounts` | ZaloAccounts | ZaloAccountsView.vue | Yes |
| `/appointments` | Appointments | AppointmentsView.vue | Yes |
| `/reports` | Reports | ReportsView.vue | Yes |
| `/analytics` | Analytics | AnalyticsView.vue | Yes |
| `/settings` | Settings | SettingsView.vue | Yes |
| `/api-settings` | ApiSettings | ApiSettingsView.vue | Yes |
| `/integrations` | Integrations | IntegrationsView.vue | Yes |
| `/automation` | Automation | AutomationView.vue | Yes |
| `/:pathMatch(.*)*` | NotFound | NotFoundView.vue | No |

**Auth Guard:**
- Checks `authStore.token` and `authStore.user` before accessing protected routes
- Calls `authStore.init()` (fetches profile) if user not loaded
- Redirects unauthenticated users to `/login`

**Important:** No group management routes or friend routes defined. Conversations support groups but no dedicated UI.

---

## 3. View Files (All 16)

```
src/views/
├── LoginView.vue                    # Auth entry point
├── SetupView.vue                    # Initial setup
├── DashboardView.vue                # KPI cards, charts
├── ChatView.vue                     # Main chat (3-panel layout)
├── ContactsView.vue                 # CRM contacts (table, filters)
├── MobileContactView.vue            # Mobile variant
├── ChatView.vue (not mobile)        # Desktop chat
├── MobileChatView.vue               # Mobile chat variant
├── ZaloAccountsView.vue             # Zalo account management
├── AppointmentsView.vue             # Calendar/appointments
├── ReportsView.vue                  # Custom reports
├── AnalyticsView.vue                # Analytics dashboard
├── SettingsView.vue                 # User, team, org settings
├── ApiSettingsView.vue              # API keys, webhooks
├── IntegrationsView.vue             # Third-party integrations
├── AutomationView.vue               # Automation rules
└── NotFoundView.vue                 # 404
```

**Key Observations:**
- No dedicated Group Management or Friend Management views
- SettingsView includes TeamManagement subcomponent
- Chat supports group conversations (`threadType: 'group'`) but no group creation/management UI
- 2,511 total lines of Vue template code across all views

---

## 4. Stores (Pinia)

**Single Store File:**
- `src/stores/auth.ts`

**Auth Store Interface:**
```typescript
interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;          // 'owner' | 'admin' | 'member'
  orgId: string;
  orgName: string;
}
```

**Auth Store Methods:**
- `checkSetup()` - Check if org needs setup
- `setup(data)` - Initial organization setup
- `login(email, password)` - User authentication
- `fetchProfile()` - Refresh user data
- `logout()` - Clear token and user
- `init()` - Initialize on app load

**Computed Properties:**
- `isAuthenticated` - token && user exist
- `isOwner` - role === 'owner'
- `isAdmin` - role in ['owner', 'admin']

**Storage:**
- Token stored in `localStorage.getItem('token')`
- Requires manual persistence (no auto-sync)

---

## 5. Composables (13 files)

| File | Purpose |
|------|---------|
| `use-contacts.ts` | Contact CRUD, duplicate detection, filters |
| `use-chat.ts` | Conversations, messages, Socket.IO, AI features |
| `use-chat-contact-panel.ts` | Right panel in chat (contact details) |
| `use-appointments.ts` | Appointment scheduling |
| `use-analytics.ts` | Analytics data fetching |
| `use-automation-rules.ts` | Automation workflow management |
| `use-dashboard.ts` | KPI aggregation |
| `use-message-templates.ts` | Message template management |
| `use-zalo-accounts.ts` | Zalo account linking |
| `use-teams.ts` | Team management |
| `use-users.ts` | User management (CRUD) |
| `use-mobile.ts` | Responsive detection (`isMobile` ref) |
| `use-offline-queue.ts` | Offline message queuing |

**Key Patterns:**
- All composables use axios via `api` from `src/api/index.ts`
- Heavy use of `ref()` and `reactive()` for state
- Return objects with refs + async functions
- No Vuex-style actions; direct API calls

---

## 6. Components Structure (38 Vue files)

```
src/components/
├── Global/
│   ├── BottomNav.vue               # Mobile navigation
│   ├── GlobalSearch.vue            # App-wide search
│   ├── NotificationBell.vue        # Notification UI
│   ├── OfflineIndicator.vue        # Connection status
│   ├── PullToRefresh.vue           # Mobile pull-to-refresh
│   └── MobileQuickActions.vue      # Mobile quick actions
│
├── chat/                            # 6 files
│   ├── ChatAppointments.vue        # Schedule within chat
│   ├── ChatContactPanel.vue        # Right panel info + forms
│   ├── ConversationList.vue        # Left sidebar conversations
│   ├── MessageThread.vue           # Center message area
│   ├── quick-template-popup.vue    # Quick template selector
│   └── special-message-renderer.vue # Rich message rendering
│
├── contacts/                        # 3 files
│   ├── ContactDetailDialog.vue     # Detail/edit modal
│   ├── ContactFilters.vue          # Filter bar component
│   └── DuplicateReviewDialog.vue   # Duplicate merge UI
│
├── dashboard/                       # 5 files
│   ├── AppointmentChart.vue
│   ├── KpiCards.vue
│   ├── MessageVolumeChart.vue
│   ├── PipelineChart.vue
│   └── SourceChart.vue
│
├── analytics/                       # 5 files
│   ├── ConversionFunnelChart.vue
│   ├── ReportBuilder.vue
│   ├── ResponseTimeChart.vue
│   ├── TeamLeaderboard.vue
│   └── TrendLineChart.vue
│
├── automation/                      # 4 files
│   ├── ActionEditor.vue
│   ├── ConditionEditor.vue
│   ├── RuleBuilder.vue
│   └── TemplateManager.vue
│
├── ai/                              # 4 files
│   ├── ai-config-dialog.vue
│   ├── ai-sentiment-badge.vue
│   ├── ai-suggestion-panel.vue
│   └── ai-summary-card.vue
│
├── settings/                        # 3 files
│   ├── OrgSettings.vue
│   ├── TeamManagement.vue
│   └── ZaloAccessDialog.vue
│
└── HelloWorld.vue                   # Demo component
```

---

## 7. Package.json Analysis

**Framework Stack:**
```json
{
  "dependencies": {
    "vue": "^3.5.30",
    "vue-router": "^4.6.4",
    "pinia": "^3.0.4",
    "vuetify": "^4.0.4",
    "axios": "^1.13.6",
    "socket.io-client": "^4.8.3",
    "chart.js": "^4.5.1",
    "vue-chartjs": "^5.3.3",
    "vue-i18n": "^11.3.0"
  },
  "devDependencies": {
    "vite": "^8.0.1",
    "typescript": "~5.9.3",
    "vue-tsc": "^3.2.5"
  }
}
```

**Key Findings:**
- **Tiptap NOT installed** - No rich text editor in dependencies
- UI framework: **Vuetify 4.0.4** (Material Design components)
- State management: **Pinia 3.0.4** (auth store only)
- Real-time: **Socket.IO client 4.8.3** for chat updates
- Charts: **Chart.js + vue-chartjs** for analytics
- i18n: **vue-i18n 11.3** (Vietnamese support visible in UI)
- Build: **Vite 8** with TypeScript support
- Icons: **@mdi/font 7.4.47** (Material Design Icons)

---

## 8. Layouts (3 variants)

**DefaultLayout.vue** (main authenticated layout):
- Top app bar with logo, global search, notifications, theme toggle
- Persistent sidebar with 11 menu items
- Dark theme by default (localStorage['theme'])
- Vuetify v-app structure

**AuthLayout.vue** (login/setup):
- Minimal wrapper for unauthenticated views

**MobileLayout.vue** (responsive):
- Bottom navigation instead of sidebar
- Touch-optimized components

---

## 9. Key Architectural Patterns

### State Management
- **Auth:** Pinia store only
- **UI/Chat/Contacts:** Composable refs (no centralized store)
- **Local Storage:** Theme, panel widths (chat left/right)
- **Session:** Bearer token in header injection

### API Integration
- Single axios instance with interceptors
- Composables directly call API
- No middleware/transformers
- Components call composable functions

### UI Framework
- **Vuetify 4** for all components (v-btn, v-dialog, v-data-table, etc.)
- Dark theme as default
- Custom color scheme (primary: #00F2FF, dark background: #0A192F)
- Rounded corners theme defaults (xl)

### Real-Time Features
- Socket.IO for chat message streaming (`chat:message`, `chat:deleted` events)
- Connection state auto-managed
- Conversation list updated on message receive

### Mobile Support
- Responsive detection via `useMobile()` composable
- Conditional view rendering (MobileContactView, MobileChatView)
- Resizable panels in ChatView with localStorage persistence

---

## 10. Current Group & Friend Support

**Conversations Support Groups:**
```typescript
// from use-chat.ts
export interface Conversation {
  id: string;
  threadType: 'user' | 'group';  // ← Supports groups
  contact: Contact | null;
  zaloAccount: ZaloAccount | null;
  // ...
}
```

**Group Display in UI:**
- ConversationList shows `mdi-account-group` icon for `threadType === 'group'`
- MessageThread shows group sender names
- quick-template-popup shows personal vs group templates

**Missing:**
- No group creation/management view
- No group settings route
- No friend management/outreach UI
- No group member list view
- No group-specific actions (mute, leave, etc.)

---

## 11. Message Composition (Plain Text Only)

**Current Implementation:**
- `MessageThread.vue` sends via `sendMessage(content: string)`
- No rich text editor imported
- Renders deleted messages, images, files (from Zalo)
- No Tiptap or markdown support
- Template system is plaintext with variables

---

## 12. Data Type Interfaces

**Contact:**
```typescript
interface Contact {
  id: string;
  fullName: string | null;
  crmName?: string | null;
  phone: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  source: string | null;          // 'FB' | 'TT' | 'GT' | 'CN'
  status: string | null;          // 'new' | 'contacted' | 'interested' | 'converted' | 'lost'
  zaloUid?: string | null;
  nextAppointment: string | null;
  notes: string | null;
  tags: string[];
  assignedUserId?: string | null;
  assignedUser?: { fullName: string } | null;
  createdAt?: string;
  firstContactDate?: string | null;
  leadScore: number;
  lastActivity: string | null;
  mergedInto: string | null;
}
```

**Message:**
```typescript
interface Message {
  id: string;
  content: string | null;
  contentType: string;            // 'text' | 'image' | 'file' | etc.
  senderType: string;             // 'self' | 'other'
  senderName: string | null;      // For group messages
  sentAt: string;
  isDeleted: boolean;
  zaloMsgId: string | null;
}
```

---

## 13. Environment & Build

- **Build Tool:** Vite 8
- **Language:** TypeScript 5.9.3
- **CSS:** Vuetify-provided, custom variables (--border-glow, --theme colors)
- **PWA:** Disabled (commented out in main.ts)
- **HMR:** Standard Vite defaults

**CSS Variables Used:**
- `--border-glow: rgba(0,242,255,0.1)` (cyan border for glass effect)
- Theme colors injected via Vuetify theme config

---

## Unresolved Questions

1. **Backend API Mismatch:** Frontend expects group support but no group management UI. Are groups created via API only or in a separate admin panel?
2. **Tiptap Implementation Plan:** Will rich text be needed for group descriptions, templates, or announcements?
3. **Friend Management:** Will outreach features require a dedicated friend/contact request system?
4. **Group Permissions:** How will group member roles/permissions be enforced in the UI?
5. **Mobile Group UX:** Should group management be tablet/mobile-responsive from the start?
6. **Offline Sync:** The `use-offline-queue.ts` exists—will group operations need offline support?

---

## Summary Table

| Area | Status | Details |
|------|--------|---------|
| **Framework** | Vue 3 | With TypeScript, Vite, Vuetify 4 |
| **State** | Minimal | Pinia (auth only), rest are composables |
| **API** | Axios | Bearer JWT auth, /api/v1 base |
| **Real-Time** | Socket.IO | For chat updates |
| **UI Lib** | Vuetify | Material Design, customized colors |
| **Rich Text** | ❌ Not installed | Plain text messaging only |
| **Groups** | Partial | Backend support, no UI routes |
| **Friends** | ❌ Missing | No outreach/management views |
| **Mobile** | Responsive | Conditional views, touch UX |
| **Theming** | Dark Default | Light/dark toggle in header |


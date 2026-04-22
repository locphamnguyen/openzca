# ZaloCRM Repository Analysis

**Date:** 2026-04-16  
**Research Focus:** Tech stack, features, architecture, Zalo integration, development state  
**Status:** Active (last commit 2026-04-16, v2.1 released)

---

## Executive Summary

**ZaloCRM** is a multi-tenant web-based CRM platform for managing multiple Zalo personal accounts with real-time chat, workflow automation, AI assistance, and third-party integrations. Built with **TypeScript full-stack** (Fastify + Vue 3 + PostgreSQL), it's designed for teams managing Zalo conversations at scale.

**Key Finding:** ZaloCRM and openzca have **complementary scope** — openzca is a CLI for individual Zalo automation; ZaloCRM is a web platform for team-based CRM and conversation management. **No direct overlap** in features; integration potential exists.

---

## 1. Tech Stack

### Backend
| Component | Tech | Version |
|-----------|------|---------|
| **Runtime** | Node.js | 20 LTS |
| **Framework** | Fastify | 5.8.4 |
| **ORM** | Prisma | 7.5.0 |
| **Database** | PostgreSQL | 16 |
| **Real-time** | Socket.IO | 4.8.3 |
| **Auth** | JWT (jsonwebtoken) | 9.0.3 |
| **Zalo Integration** | zca-js | 2.1.2 |
| **Scheduling** | node-cron | 4.2.1 |
| **Hashing** | bcryptjs | 3.0.3 |
| **Excel Export** | ExcelJS | 4.4.0 |
| **Build Tool** | tsx | 4.21.0 |

### Frontend
| Component | Tech | Version |
|-----------|------|---------|
| **Framework** | Vue 3 | 3.5.30 |
| **UI Library** | Vuetify | 4.0.4 |
| **State Mgmt** | Pinia | 3.0.4 |
| **Routing** | Vue Router | 4.6.4 |
| **Charts** | Chart.js + vue-chartjs | 4.5.1 |
| **HTTP Client** | Axios | 1.13.6 |
| **Real-time** | Socket.IO Client | 4.8.3 |
| **i18n** | vue-i18n | 11.3.0 |
| **PWA** | vite-plugin-pwa | 1.2.0 |
| **Build Tool** | Vite | 8.0.1 |

### DevOps & Deployment
- **Containerization:** Docker + Docker Compose
- **Database Adapter:** @prisma/adapter-pg (native PostgreSQL)
- **System Requirements:** 1 vCPU min, 1 GB RAM (4 GB rec), 10 GB disk, Ubuntu 20.04+

---

## 2. Current Features

### Core (v1.0)
- **Multi-account Zalo management:** QR login, auto-reconnect, session persistence
- **Real-time chat:** Send/receive messages, images, files, stickers, group chat
- **CRM pipeline:** Contacts with statuses (New → Contacted → Interested → Converted → Lost)
- **Appointments:** Create, track, auto-reminder (daily)
- **Dashboard:** Message charts, KPI, lead source, pipeline status
- **Reports:** Excel export, time-based filtering
- **Access Control:** Owner/Admin/Member roles, team management, per-Zalo ACL
- **Public API:** REST with API-key auth (X-API-Key header)
- **Webhooks:** message.received, message.sent, contact.created, zalo.connected, zalo.disconnected
- **Rate limiting:** 200 msgs/day anti-block, fast-send detection
- **Notifications:** Unreplied >30min, upcoming appointments, connection lost
- **Full-system search:** Contacts, messages, appointments
- **UI:** Dark/light theme, Liquid Silicon design

### New in v2.0 (31/03/2026)
- **AI Assistant:** Answer suggestions, conversation summaries, sentiment analysis
- **Workflow Automation:** Auto message send, contact classification, event triggers
- **Integration Hub:** Google Sheets (export contacts), Telegram (daily summary), Facebook (import leads), Zapier (webhooks)
- **Mobile PWA:** Responsive, offline mode, installable on phone
- **Contact Intelligence:** Duplicate detection, lead scoring (0-100), auto-tagging (hot/warm/cold)
- **Advanced Analytics:** Conversion funnel, team leaderboard, response time trends, custom report builder
- **Multi-Provider AI:** Anthropic, OpenAI, Qwen, Kimi (provider registry pattern)
- **Per-Account Proxy:** HTTP proxy config per Zalo account (anti-block)

### New in v2.1 (16/04/2026) — Latest
- **"Khác" Tab:** Hidden conversations moved to separate tab, right-click to switch tabs
- **Dual Contact Names:** CRM Name (custom) + Zalo Name, CRM Name prioritized in UI & templates
- **Conversation Filters:** By unread, unreplied, date range, tags
- **Quick Templates:** Type `/` in chat to insert templates with dynamic variables (name, date, status)
- **Special Message Rendering:** Sticker, image, video, file, bank transfer, call, QR code, appointment reminder
- **Message Sync:** Auto-fetch last 50 messages on reconnect, selfListen dedup, auto-create contacts
- **Bug Fixes:** Unknown sender name resolution, PWA vite-plugin-pwa setup, duplicate sent messages

---

## 3. Architecture & Project Structure

```
ZaloCRM/
├── backend/                    # Fastify server (Node.js 20)
│   ├── src/
│   │   ├── app.ts              # Fastify app setup, middleware registration
│   │   ├── config/             # Config loaders (env, db, jwt, etc.)
│   │   ├── modules/            # Feature modules (12 distinct domains)
│   │   │   ├── ai/             # AI suggestions, multi-provider support
│   │   │   ├── analytics/      # Funnel, team perf, response time, reports
│   │   │   ├── api/            # Public API routes (v1/v2)
│   │   │   ├── auth/           # JWT auth, user mgmt
│   │   │   ├── automation/     # Rule engine, template interpolation
│   │   │   ├── chat/           # Chat routes, message handlers
│   │   │   ├── contacts/       # Contact CRUD, search, merge
│   │   │   ├── dashboard/      # Stats aggregation, KPI queries
│   │   │   ├── integrations/   # 3rd-party sync (Google Sheets, Telegram, etc.)
│   │   │   ├── notifications/  # Alerts, webhooks
│   │   │   ├── search/         # Full-text search across conversations
│   │   │   └── zalo/           # Zalo API wrapper, rate limiting, listener pool
│   │   └── shared/             # Utilities, types
│   ├── prisma/
│   │   └── schema.prisma       # 20+ models (Org, User, Contact, Message, etc.)
│   ├── package.json
│   └── tsconfig.json
├── frontend/                   # Vue 3 SPA (Vite)
│   ├── src/
│   │   ├── components/         # UI components (Vue + Vuetify)
│   │   ├── views/              # Page-level views
│   │   ├── stores/             # Pinia state stores
│   │   ├── composables/        # Reusable logic hooks
│   │   ├── api/                # Axios client + endpoints
│   │   ├── utils/              # Helpers
│   │   ├── App.vue
│   │   └── main.ts
│   ├── public/                 # Static assets, PWA icons
│   ├── vite.config.ts          # Vite + vite-plugin-pwa
│   ├── index.html
│   └── package.json
├── docker/                     # Dockerfile (multi-stage)
├── docker-compose.yml          # Production setup (Fastify + PostgreSQL)
├── docker-compose.dev.yml      # Dev setup (nodemon + local db)
└── .env.example                # Config template
```

### Key Patterns

**Modular Architecture:**
- Each module (ai, chat, contacts, etc.) contains routes + handlers + services
- Modules are semi-independent; share database & Socket.IO via Fastify context
- Clear separation of concerns (routes → handlers → services → Prisma)

**Database:**
- Prisma ORM with PostgreSQL 16
- Multi-tenant: all models scoped to `Organization` (org_id)
- ~20 models covering users, contacts, conversations, messages, automations, integrations
- Indexes on frequently-queried paths (org_id, status, dates)

**Real-time:**
- Socket.IO for live chat updates, notifications, connection status
- Message handlers emit socket events to subscribed clients
- Separate zalo-socket.ts module manages Zalo ↔ socket routing

**Authentication:**
- JWT tokens (email + role)
- Per-Zalo access control via ZaloAccountAccess model (read/chat/admin)
- API key for public endpoints (X-API-Key header)

**Zalo Integration:**
- Uses `zca-js` library (v2.1.2) — reverse-engineered Zalo client
- Manages multiple Zalo accounts per user via ZaloPool
- Handles QR login, session persistence (sessionData as JSON)
- Rate limiting (200 msgs/day) + anti-fast-send detection
- Message sync: polls for old messages, deduped via unique constraint

---

## 4. Zalo Integration Details

### How ZaloCRM Uses zca-js

1. **Account Linking:**
   - User initiates QR login → generates QR code via `zca-js`
   - QR scanned on phone → Zalo session credentials returned
   - Session stored in `ZaloAccount.sessionData` (JSON) — survives server restart

2. **Multi-Account Pool:**
   - `ZaloPool` manages N Zalo accounts concurrently
   - Each account has independent listener (Socket.IO forwarding)
   - Cross-account isolation via zaloAccountId scoping

3. **Message Flow:**
   - Incoming Zalo message → zca-js listener emits event
   - Message handler creates Message record + emits Socket.IO event
   - Socket.IO broadcasts to web clients
   - Dedup via unique constraint: `[conversationId, zaloMsgId]`

4. **Send Path:**
   - Web user types message → POST /api/messages/send
   - Message saved to DB first
   - zca-js sends via linked Zalo account
   - Socket.IO echoes back to sender (dedup check on receive)
   - Rate limiting enforced (200/day check)

5. **Special Handling:**
   - **Proxy support:** Per-account HTTP proxy to avoid IP blocks
   - **Old message sync:** On reconnect, fetches last 50 messages via API
   - **Auto-contact creation:** New senders auto-added as contacts
   - **Group member sync:** Periodic group info refresh
   - **Anti-duplicate:** DB unique constraint + application-level dedup in listener

### API Endpoints for Zalo Operations
```
POST   /api/zalo/accounts              # Link new Zalo account (QR login)
GET    /api/zalo/accounts              # List linked accounts
PATCH  /api/zalo/accounts/:id          # Update account settings (proxy, name)
DELETE /api/zalo/accounts/:id          # Unlink account
POST   /api/zalo/sync                  # Manual message history sync
GET    /api/zalo/health                # Connection status check
```

---

## 5. Database Schema (Key Models)

### Multi-Tenancy
```prisma
Organization        # Top-level tenant container
├─ Team             # Team groups within org
├─ User             # CRM users (owner/admin/member roles)
├─ ZaloAccount      # Zalo accounts linked to users
├─ Contact          # CRM contacts (pipeline status, lead score, tags)
├─ Conversation     # Chat threads (user ↔ contact or group)
├─ Message          # Individual messages (with attachments)
├─ Appointment      # Scheduled meetings
├─ DailyMessageStat # Daily aggregates for KPI
├─ AutomationRule   # Workflow triggers + actions
├─ MessageTemplate  # Quick-send templates
├─ AiConfig         # Provider + model settings
├─ Integration      # 3rd-party service configs
└─ SavedReport      # Custom analytics definitions
```

### Access Control
```prisma
ZaloAccountAccess   # ACL: User → Zalo account (read/chat/admin)
```

### Special Relationships
- **Contact merge:** `Contact.mergedInto` → historical contact tracking
- **Message reply tracking:** `Message.repliedByUserId` → response attribution
- **Conversation status:** `Conversation.isReplied` + `tab` (main|other) → inbox management

---

## 6. Development State & Momentum

### Recent Activity
- **Last commit:** 2026-04-16 (today)
- **Release cycle:** v1.0 (29/03) → v2.0 (31/03) → v2.1 (16/04) — rapid iteration
- **Active contributors:** Loc Nguyen, Nguyễn Tiến Lộc
- **Branching:** main + feature branches (e.g., locphamnguyen/ai-assistant, locphamnguyen/crm-automation)

### Development Phase
- **v2.1 is current stable**
- Focus: Bug fixes (dedup, N+1 queries, vite-plugin-pwa), UX enhancements (tab "Khác", dual names)
- Recent PRs merged for AI multi-provider, automation module, analytics, PWA, integrations
- Code review process active (PR comments on dedup TOCTOU, batch queries, contactId orphan handling)

### Test Coverage
- No explicit test files mentioned in repo listing
- Tests likely in progress (common pattern: v1 MVP first, tests added in v2+)
- Docker setup includes dev compose for local testing

### Known Issues & Workarounds
1. **Vite PWA build:** Fixed in v2.1 (npmrc for peer dep compatibility)
2. **Duplicate messages on send:** Fixed in v2.1 (dedup via unique constraint + socket echo suppression)
3. **Unknown sender names:** Fixed in v2.1 (getUserInfo API lookup)
4. **Rate limiting on static assets:** Fixed in recent commit (API route filtering)

---

## 7. Architectural Fit & Integration with openzca

### How They Differ
| Aspect | openzca | ZaloCRM |
|--------|---------|---------|
| **Purpose** | CLI tool for Zalo automation | Web-based CRM platform |
| **Users** | Individual developers/powerusers | Teams managing sales/support |
| **Input** | CLI commands | Web UI + REST API |
| **Scope** | Sending messages, listening, scripting | Full CRM pipeline + analytics |
| **Persistence** | Local profiles (~/.openzca) | PostgreSQL multi-tenant DB |
| **Real-time** | Single-process WebSocket listener | Multi-user Socket.IO hub |
| **Deployment** | npm global install | Docker containers |

### Complementary Features

**openzca excels at:**
- Scripting & automation (CLI-driven workflows)
- Text style parsing + custom formatting
- Local file handling (media validation, tilde expansion)
- Video send with native ffmpeg/ffprobe integration
- Low-resource footprint (suitable for CI/CD, serverless)

**ZaloCRM excels at:**
- Team collaboration (shared Zalo accounts, ACL)
- Conversation management (pipeline, tags, search)
- Analytics & reporting (KPI, funnel, lead scoring)
- AI-assisted workflows (suggestions, summaries)
- Integration ecosystem (Google Sheets, Telegram, Zapier)

### Potential Integration Points

1. **openzca CLI as Backend Worker for ZaloCRM:**
   - ZaloCRM spawns openzca CLI for complex tasks (video send, text styling)
   - Already done by OpenClaw plugin — ZaloCRM could adopt same pattern
   - Benefit: Offload media processing from Node.js

2. **ZaloCRM API consumption from openzca:**
   - openzca `--zalocrm-api-key` flag to push contacts/messages to ZaloCRM
   - Benefit: CLI operations audit-logged in CRM, contacts auto-synced

3. **Shared Zalo session storage:**
   - ZaloCRM exports session credentials → openzca CLI reads them
   - Benefit: Single Zalo account managed across both tools

4. **Template & rule sharing:**
   - openzca uses ZaloCRM templates (quick-insert via REST API)
   - Benefit: Centralized template management

---

## 8. Security & Compliance

### Built-in Safeguards
- **JWT + role-based access** (owner/admin/member)
- **Per-account ACL** (ZaloAccountAccess model)
- **API key isolation** (X-API-Key header only for public endpoints)
- **Cross-org protection** (org_id scoping on all queries)
- **Input validation** (Fastify schema validation)
- **SSRF guard** (15s fetch timeouts on webhooks)
- **Password hashing** (bcryptjs)
- **Config encryption** (AES + ENCRYPTION_KEY in .env)
- **Rate limiting** (Zalo anti-block, HTTP request throttling)

### Missing (Worth Noting)
- No explicit audit logging for sensitive operations (e.g., API key rotation)
- Webhook secret validation not mentioned
- No 2FA for web login
- Session revocation not documented

---

## 9. Deployment & Infrastructure

### Docker Compose (Production)
```yaml
services:
  web:        # Fastify backend + static frontend (single container)
  db:         # PostgreSQL 16
  redis:      # Optional (for Socket.IO adapter)
```

### Environment Variables (Key)
```
PORT=3000                        # Fastify port
DATABASE_URL=postgresql://...    # Prisma connection
JWT_SECRET=<32-byte-hex>         # Auth token signing
ENCRYPTION_KEY=<16-byte-hex>     # Config encryption
UPLOAD_DIR=/var/lib/zalo-crm/files # File storage
AI_DEFAULT_PROVIDER=anthropic    # AI config
```

### System Requirements
- **CPU:** 1 vCPU min, 2-4 vCPU rec
- **RAM:** 1 GB min, 4 GB rec
- **Disk:** 10 GB min, 20 GB SSD rec
- **OS:** Ubuntu 20.04+ (Docker-based)

### Deployment Strategy
- Single Docker Compose file for all-in-one deployment
- Frontend bundled with backend (Fastify static middleware)
- Database migrations run on startup (Prisma automatic)
- No separate CI/CD docs — likely manual or GitHub Actions

---

## 10. Open Questions & Gaps

1. **Testing:** Where are tests? CI/CD pipeline status?
2. **Performance:** Have benchmarks been done on 1000+ contacts, 10k+ messages?
3. **Data retention:** Message archival policy? Database cleanup strategy?
4. **Backup strategy:** Documented backup/restore procedures?
5. **Scalability:** Can PostgreSQL scale to multi-thousand-user deployments? Redis needed for Socket.IO adapter?
6. **Documentation:** Admin deployment guide present (HUONG-DAN-CAI-DAT.md), but troubleshooting guide missing.
7. **Plugin system:** Is there a plugin architecture for custom integrations beyond the 4 built-in?
8. **Mobile app:** PWA covers mobile, but native iOS/Android apps planned?
9. **Compliance:** GDPR data deletion? Right-to-be-forgotten implementation?

---

## Conclusion

**ZaloCRM is a production-grade, actively-developed multi-tenant CRM built on modern TypeScript stack (Fastify + Vue 3 + PostgreSQL).** It fills a gap between DIY Zalo bots and enterprise CRM systems, targeting Vietnamese SMB sales/support teams.

**Integration with openzca makes architectural sense:**
- Complementary scope (CLI vs. web platform)
- Shared Zalo API foundation (zca-js)
- openzca could serve as compute-intensive task worker for video processing, text styling
- Future: unified "Zalo management ecosystem" with openzca CLI + ZaloCRM web

**Porting openzca features into ZaloCRM would be low-value:**
- ZaloCRM already does multi-account Zalo management
- Text styling & media sending already implemented
- Better approach: keep openzca as standalone CLI, explore worker/API integration model

**Recommendation:** Build a **ZaloCRM ↔ openzca bridge** (webhooks + API) to let teams use both tools cohesively, rather than merging codebases.

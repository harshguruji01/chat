# Guru Chat — Audit Report & Cross-Platform System Architecture

**Official Product:** Guru Chat  
**Brand / Developer:** HarshGuruJi  
**Official Web URL:** `https://chat.webguruji.online/` (with `guruchat.webguruji.online` alias)  
**Android Package:** `com.harshguruji.guruchat`

---

## 1. Existing Repository Audit (Prompt 01)

| Area | Technology / State | Classification | Notes |
| --- | --- | --- | --- |
| Web Frontend | React 19, TypeScript 6, Vite 8 | **Fully working** | Fast build (`vite build`), clean CSS variables |
| Android Client | Capacitor 8 (`com.harshguruji.guruchat`) | **Needs upgrade** | Basic `MainActivity` wrapper; needs deep links, notification channels, permissions, release config |
| Backend / DB | Supabase (Postgres, Auth, Realtime, Storage) | **Partially working** | Core tables exist (`profiles`, `conversations`, `messages`, `follows`, `blocks`, `reports`); missing calls, conferences, notifications, connection requests, device sessions, audit logs |
| Auth | Supabase Auth (Email/Password + Google OAuth) | **Partially working** | Needs terms acceptance, verification pending state, password reset flow, active device sessions, remote logout |
| Private & Group Messaging | `ChatContext.tsx` + `ChatWindow.tsx` | **Partially working** | Works for text/media/replies/reactions/edits/deletes; needs offline queue, pinned messages, multi-select, unread separator, group roles/settings/announcements |
| Contacts & Privacy | `UserSearch.tsx` + `PrivacySettingsModal.tsx` | **Needs redesign** | Uses `follows`; needs full Contact Directory (Contacts, Incoming/Sent Requests, Blocked), granular privacy controls |
| Voice & Video Calling | `CallContext.tsx` (Supabase Broadcast + WebRTC) | **Partially working** | 1:1 P2P WebRTC; needs 13-state lifecycle, server call records/invitations, call history, audio routing, quality selector, strict block/privacy checks |
| Group Conferencing | Missing | **Missing** | Needs full Meeting Creation, SFU/Mesh WebRTC room, Host Controls, Raise Hand, In-Meeting Chat, Screen Share, Breakout Rooms |
| PWA | Missing `manifest.webmanifest` & `sw.js` | **Missing** | Needs installable PWA manifest, service worker with safe caching, offline fallback |
| Admin Dashboard | `AdminControlCenter.tsx` | **Partially working** | Has Overview, Policies, Users, Moderation, Ops, Audit; needs Calls, Conferences, Notifications, Storage, Security, Settings |

---

## 2. Cross-Platform System Architecture (Prompt 02)

### Clients
- **Web App (`https://chat.webguruji.online/`)**: Responsive 3-panel desktop messenger + mobile PWA with Service Worker, Web Push, WebRTC/LiveKit media.
- **Android App (`com.harshguruji.guruchat`)**: Capacitor 8 native-integrated Android application with native notification channels, deep links (`https://chat.webguruji.online/*` and `com.harshguruji.guruchat://*`), hardware back button stack, native permissions, and signed APK/AAB build pipeline.

### Shared Identity & Backend
Both Android and Web authenticate against the exact same Supabase Auth + Postgres `profiles` table (`id`, `user_code`, `username`, `email`, `role`, `account_state`), ensuring seamless cross-device session and message synchronization.

### Modular Service Layer (`src/services/`)
- `authService.ts` — Google OAuth (PKCE), email auth, device sessions, remote logout.
- `contactService.ts` — Contact directory, connection requests, blocking, privacy enforcement.
- `messagingService.ts` — Idempotent messaging, offline queue, pinned messages, group roles/settings.
- `callService.ts` — Call eligibility checks, server call records, invitations, call history, TURN/LiveKit tokens.
- `conferenceService.ts` — Meeting creation, invitations, host controls, breakout rooms, multi-peer WebRTC.
- `notificationService.ts` — Cross-platform notifications, preferences, quiet hours, badge sync.
- `adminService.ts` — Private server-verified admin operations, announcements, audit logs.

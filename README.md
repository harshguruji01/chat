# GuruChat 💬

> **Connect. Chat. Share.**  
> **Brand**: By HarshGuruJi  
> **Official Landing Page**: [https://webguruji.online/guruchat](https://webguruji.online/guruchat)  
> **Web Application**: [https://guruchat.webguruji.online](https://guruchat.webguruji.online)  
> **Admin Control Center**: [https://guruchat.webguruji.online/admin](https://guruchat.webguruji.online/admin)  
> **Developer & Creator**: HarshGuruJi  

---

## 🌟 Overview

GuruChat is an advanced real-time social messaging platform engineered for seamless communication across Android smartphones and modern web browsers. Featuring high-performance messaging, studio voice notes, document sharing, communities, broadcast channels, WebRTC audio/video calling, and an administrator control center.

---

## 🚀 Key Features

### 1. Brand Identity & Splash Screen
- Animated startup splash screen with GuruChat glowing logo and sleek pulse animations.
- Official branding throughout: Splash, Login/Register, About modal, Profile, and Admin Control Center.
- Smooth startup session checking that skips login for active sessions.

### 2. Complete Authentication & Google OAuth
- **Login**: Email, Username, or Unique User ID + Password with show/hide password toggle.
- **Google Sign-In**: 1-click Google OAuth authentication alongside standard credentials.
- **Registration**: Username, Display Name, Email, Phone Number, Password, Confirm Password, and optional Avatar upload.
- **Unique Permanent User ID**: Automatically generated 8-character unique alphanumeric ID (e.g., `HG8X29K4`) assigned to every user account.
- Passwords safely hashed and authenticated via Supabase Auth.

### 3. Location Permission & Nearby People Discovery
- Transparent permission dialog explaining privacy protection before native browser/device geolocation requests.
- **Privacy-Preserving**: Only calculates approximate distance (e.g., `~1.5 km away`) via Haversine formula in PostgreSQL RPC (`get_nearby_users`). Raw GPS coordinates and addresses are NEVER exposed.
- Privacy switch to disable appearing in nearby discovery at any time.

### 4. Fast Debounced Search & Discovery
- Search by Unique User ID (`HG...`) or `@username`.
- Fast debounced query (300ms) with instant matching user cards showing avatar, name, follow status, and direct chat action.

### 5. Follow & Social System
- Follow, Unfollow, and Accept/Reject follow requests for private accounts.
- Follower and Following counter with list modals.
- Self-following and following blocked users are prevented at both client and database levels.

### 6. Communities & Channels
- **Communities**: Multi-group hubs with category badges and joined/explore directories.
- **Channels**: Verified broadcast channels with subscriber counts, pinned announcements, and 1-click post sharing.

### 7. Rich Messaging Interface & Real-Time Engine
- **Responsive Layout**:
  - **Desktop**: Dual-pane layout (collapsible conversation list + active chat window).
  - **Mobile**: Seamless single-page view with bottom navigation bar (Home, Chat, Communities, Channels, Search, Profile).
- **Message Types**:
  - **Text & Emojis**: Built-in categorized Emoji Picker (Smiles, Gestures, Hearts, Animals, Food, etc.) with search.
  - **Voice Notes**: Tap to record up to **1 minute (60s hard ceiling)** with live animated waveform, elapsed timer, preview playback, cancel, and send.
  - **Document Sharing**: Instant PDF, Word (.doc, .docx), Excel (.xls, .xlsx), Text, and ZIP attachment transfer with validation.
  - **Video Messages**: Video file sharing strictly validated under **10 MB** (enforced on both client and storage), with upload progress bar and inline video player.
- **Message Controls**:
  - **Edit Message**: Edit sent text messages within a 15-minute window with real-time broadcast and `(edited)` indicator.
  - **Forward Message**: 1-tap message forwarding to any existing contact or group conversation.
  - **Delivery States**: Sent (`✓`), Delivered (`✓✓`), Read (`✓✓` in blue).
  - **Message Deletion**: "Delete for me" and "Delete for everyone" with instant real-time sync.
- **30-Day Auto Cleanup**:
  - Messages store `expires_at = created_at + interval '30 days'`.
  - Automated PostgreSQL daily cron job (`cleanup-expired-messages-daily`) running at 3:00 AM UTC purges expired messages and media.

### 8. Voice & Video Calling
- Peer-to-peer WebRTC voice and video calling.
- Fullscreen call overlay with camera toggle, mic mute, speakerphone, live call timer, and minimizable floating bubble.

### 9. Profile & Customization
- Display profile picture, display name, username, bio, follower/following counts.
- Convenient **1-Click Copy User ID** button.
- **Edit Profile**: Avatar upload, display name, bio, phone.
- **Privacy & Safety Toggles**: Appear in Nearby, Show Online Status, Private Account.
- **Theme Modes**: Dark mode (default), Light mode, and System default mode with persistence.

### 10. Dedicated Admin Control Center (`/admin`)
- Restricted access gate requiring administrative authentication.
- **Overview**: Live database metrics, platform policies summary, and Supabase latency.
- **Platform Policies**: Real-time configuration of Android and Web feature flags, upload limits, and restrictions.
- **User Management**: Search users, inspect registration metadata, Suspend / Unsuspend accounts, or Delete accounts.
- **Content Moderation**: Review abuse and spam reports with Dismiss / Resolve actions.
- **Immutable Audit Trail**: Logs all administrative operations with targets, timestamps, and details.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend Framework** | React 19 + TypeScript + Vite |
| **Styling & Design** | Modern Vanilla CSS Design Tokens, Glassmorphism, Animations |
| **Icons** | `lucide-react` |
| **Mobile & Android** | `@capacitor/core`, `@capacitor/cli`, `@capacitor/android` |
| **Database & Auth** | Supabase (PostgreSQL 15+ with RLS, Realtime Channels, Auth) |
| **Media Storage** | Supabase Storage (`avatars`, `chat-media`) |
| **Automated Cleanup** | PostgreSQL `pg_cron` daily task |

---

## 💻 Getting Started

### 1. Prerequisites
- Node.js 18+ (tested on Node v24)
- pnpm 10+ (or npm 9+)
- Android Studio / Android SDK (for native Android builds)

### 2. Environment Variables
Create a `.env` file in the root directory:
```env
VITE_SUPABASE_URL=https://hzojuiccegnvanqowgmf.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_APP_NAME=GuruChat
VITE_BRAND_NAME=By HarshGuruJi
VITE_BRAND_URL=https://webguruji.online/guruchat
```

### 3. Run Web App Locally
```bash
pnpm install
pnpm run dev
```
Open `http://localhost:5173/` in your browser.

### 4. Build for Production
```bash
pnpm run build
```

### 5. Build Native Android Application
```bash
# Build web assets and sync to Android
pnpm run build
npx cap sync android

# Open project in Android Studio to build APK
npx cap open android
```

---

## 📱 Android Permissions
The following native permissions are pre-configured in `AndroidManifest.xml`:
- `INTERNET`, `ACCESS_NETWORK_STATE` (Network & realtime messaging)
- `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION` (Nearby discovery)
- `RECORD_AUDIO`, `MODIFY_AUDIO_SETTINGS` (60-second voice notes)
- `READ_MEDIA_AUDIO`, `READ_MEDIA_VIDEO`, `READ_MEDIA_IMAGES` (Media uploads)

---

## 🔒 Security & Privacy
- **Row-Level Security (RLS)** is strictly active across all tables.
- **Exact Coordinates are Never Exposed**: The PostgreSQL `get_nearby_users` function uses spherical trigonometry to compute approximate distance without exposing coordinates.
- **Strict File Limits**: 5 MB for avatars, 10 MB for videos, 25 MB for documents.
- **Sanitized Text**: User messages are rendered safely against script injection and XSS.

---

## 📄 License & Credits
Developed with ❤️ by **HarshGuruJi**  
Official Website: [webguruji.online](https://webguruji.online/)  
GuruChat Portal: [webguruji.online/guruchat](https://webguruji.online/guruchat)

import { Capacitor } from '@capacitor/core';

export type PlatformType = 'android' | 'web';

export interface FeatureCapability {
  id: string;
  name: string;
  category: 'messaging' | 'media' | 'social' | 'system' | 'admin';
  description: string;
  android: boolean;
  web: boolean;
  authRequired: boolean;
  permissionRequired?: string;
  serverRestriction?: string;
  adminConfigurable: boolean;
  backendIntegration?: string;
  explanationIfRestricted?: string;
}

export interface PlatformUploadPolicies {
  webMaxImageSizeMb: number;
  androidMaxImageSizeMb: number;
  webMaxVideoSizeMb: number;
  androidMaxVideoSizeMb: number;
  webMaxDocumentSizeMb: number;
  androidMaxDocumentSizeMb: number;
  webMaxVoiceDurationSeconds: number;
  androidMaxVoiceDurationSeconds: number;
  allowedImageTypes: string[];
  allowedVideoTypes: string[];
  allowedDocTypes: string[];
  allowedVoiceTypes: string[];
}

export interface PlatformMessagingPolicies {
  editWindowMinutes: number; // sender can edit within N minutes
  allowDeleteForEveryone: boolean;
  allowDeleteForEveryoneWindowMinutes: number; // 0 for unlimited, or e.g. 1440 mins (24h)
  allowClearConversation: boolean;
  allowDisappearingMessages: boolean;
  defaultExpirationDays: number;
  maxGroupMembers: number;
  allowVoiceMessagesOnWeb: boolean;
}

export interface PlatformPolicyConfig {
  version: string;
  updatedAt: string;
  features: Record<string, boolean>; // override feature by id
  upload: PlatformUploadPolicies;
  messaging: PlatformMessagingPolicies;
}

export const DEFAULT_PLATFORM_CAPABILITIES: FeatureCapability[] = [
  {
    id: 'text_messaging',
    name: 'Text & Unicode Messaging',
    category: 'messaging',
    description: 'Instant rich text, emoji, unicode message exchange with delivery states',
    android: true,
    web: true,
    authRequired: true,
    adminConfigurable: false,
    backendIntegration: 'supabase_realtime_and_postgres',
  },
  {
    id: 'image_sharing',
    name: 'Photo & Image Sharing',
    category: 'media',
    description: 'Compressed image uploads, full-screen lightbox preview, and zoom',
    android: true,
    web: true,
    authRequired: true,
    adminConfigurable: true,
    backendIntegration: 'supabase_storage_chat_media',
  },
  {
    id: 'video_sharing',
    name: 'Video Sharing',
    category: 'media',
    description: 'Short video clips and media attachments with streaming playback',
    android: true,
    web: true,
    authRequired: true,
    adminConfigurable: true,
    backendIntegration: 'supabase_storage_chat_media',
  },
  {
    id: 'voice_messages',
    name: 'Voice Notes & Audio Recording',
    category: 'media',
    description: 'Record and send studio voice notes with audio playback controls',
    android: true,
    web: true,
    authRequired: true,
    permissionRequired: 'microphone',
    adminConfigurable: true,
    backendIntegration: 'supabase_storage_chat_media',
    explanationIfRestricted: 'Microphone permission or supported browser media recorder is required for voice notes.',
  },
  {
    id: 'document_attachments',
    name: 'Document & PDF Attachments',
    category: 'media',
    description: 'Share PDFs, docs, sheets and files securely with signed URLs',
    android: true,
    web: true,
    authRequired: true,
    adminConfigurable: true,
    backendIntegration: 'supabase_storage_chat_media',
  },
  {
    id: 'message_editing',
    name: 'Message Editing',
    category: 'messaging',
    description: 'Edit sent messages with timestamp and visible edited indicator',
    android: true,
    web: true,
    authRequired: true,
    adminConfigurable: true,
    backendIntegration: 'supabase_postgres_messages',
  },
  {
    id: 'message_deletion',
    name: 'Message Deletion (Me & Everyone)',
    category: 'messaging',
    description: 'Delete for me or delete for everyone with recipient state sync',
    android: true,
    web: true,
    authRequired: true,
    adminConfigurable: true,
    backendIntegration: 'supabase_postgres_messages',
  },
  {
    id: 'message_forwarding',
    name: 'Message Forwarding & Replies',
    category: 'messaging',
    description: 'Quote reply with original context and forward messages to other chats',
    android: true,
    web: true,
    authRequired: true,
    adminConfigurable: false,
    backendIntegration: 'supabase_postgres_messages',
  },
  {
    id: 'conversation_search',
    name: 'Search Inside Conversations',
    category: 'messaging',
    description: 'Instant client & server search by keyword, sender, date, and attachments',
    android: true,
    web: true,
    authRequired: true,
    adminConfigurable: false,
    backendIntegration: 'postgres_search',
  },
  {
    id: 'group_chats',
    name: 'Group Messaging & Admin Roles',
    category: 'messaging',
    description: 'Create groups, manage members, roles, group titles and group avatars',
    android: true,
    web: true,
    authRequired: true,
    adminConfigurable: true,
    backendIntegration: 'supabase_rpc_groups',
  },
  {
    id: 'communities_and_channels',
    name: 'Communities & Public Channels',
    category: 'social',
    description: 'Browse, subscribe to public channels and join multi-group communities',
    android: true,
    web: true,
    authRequired: true,
    adminConfigurable: true,
    backendIntegration: 'supabase_postgres_communities',
  },
  {
    id: 'stories_and_feed',
    name: 'Stories & Social Feed',
    category: 'social',
    description: '24-hour expiring stories and curated social thoughts feed',
    android: true,
    web: true,
    authRequired: true,
    adminConfigurable: true,
    backendIntegration: 'supabase_postgres_stories',
  },
  {
    id: 'push_notifications',
    name: 'Push & Local Notifications',
    category: 'system',
    description: 'Native Android notifications and browser Web Push API alerts',
    android: true,
    web: true,
    authRequired: true,
    permissionRequired: 'notification',
    adminConfigurable: true,
    backendIntegration: 'capacitor_notifications_and_web_push',
    explanationIfRestricted: 'Enable browser notifications in site settings to receive instant alerts.',
  },
  {
    id: 'calling',
    name: 'Real-time Audio & Video Calling',
    category: 'media',
    description: 'One-to-one WebRTC calling with audio/video controls',
    android: true,
    web: true,
    authRequired: true,
    permissionRequired: 'camera_and_microphone',
    adminConfigurable: true,
    backendIntegration: 'webrtc_signaling_channel',
  },
  {
    id: 'location_sharing',
    name: 'Nearby Discovery & Location Sharing',
    category: 'system',
    description: 'Consent-based approximate distance discovery without continuous background tracking',
    android: true,
    web: true,
    authRequired: true,
    permissionRequired: 'geolocation',
    adminConfigurable: true,
    backendIntegration: 'supabase_rpc_nearby',
    explanationIfRestricted: 'Location permission required to discover community members nearby.',
  },
  {
    id: 'admin_control_center',
    name: 'GuruChat Admin Control Center',
    category: 'admin',
    description: 'Comprehensive administrative dashboard, policy controls, moderation, and audit logs',
    android: false,
    web: true,
    authRequired: true,
    serverRestriction: 'admin_role_required',
    adminConfigurable: false,
    backendIntegration: 'supabase_admin_auth',
  },
];

export const DEFAULT_PLATFORM_POLICIES: PlatformPolicyConfig = {
  version: '2.0.0',
  updatedAt: new Date().toISOString(),
  features: {},
  upload: {
    webMaxImageSizeMb: 10,
    androidMaxImageSizeMb: 25,
    webMaxVideoSizeMb: 20,
    androidMaxVideoSizeMb: 100,
    webMaxDocumentSizeMb: 15,
    androidMaxDocumentSizeMb: 50,
    webMaxVoiceDurationSeconds: 60,
    androidMaxVoiceDurationSeconds: 120,
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    allowedVideoTypes: ['video/mp4', 'video/webm', 'video/quicktime'],
    allowedDocTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'application/zip',
    ],
    allowedVoiceTypes: ['audio/webm', 'audio/mp4', 'audio/ogg', 'audio/wav', 'audio/m4a', 'audio/aac'],
  },
  messaging: {
    editWindowMinutes: 60, // 1 hour edit window
    allowDeleteForEveryone: true,
    allowDeleteForEveryoneWindowMinutes: 1440, // 24 hours
    allowClearConversation: true,
    allowDisappearingMessages: true,
    defaultExpirationDays: 30,
    maxGroupMembers: 100,
    allowVoiceMessagesOnWeb: true,
  },
};

const POLICY_STORAGE_KEY = 'guruchat_platform_policies_v2';
const LEGACY_STORAGE_KEY = 'chatbase_platform_policies';

/**
 * Get active platform policies (with localStorage overrides by admin)
 */
export function getActivePlatformPolicies(): PlatformPolicyConfig {
  if (typeof window === 'undefined') return DEFAULT_PLATFORM_POLICIES;
  try {
    const raw = localStorage.getItem(POLICY_STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return DEFAULT_PLATFORM_POLICIES;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_PLATFORM_POLICIES,
      ...parsed,
      upload: { ...DEFAULT_PLATFORM_POLICIES.upload, ...(parsed.upload || {}) },
      messaging: { ...DEFAULT_PLATFORM_POLICIES.messaging, ...(parsed.messaging || {}) },
    };
  } catch {
    return DEFAULT_PLATFORM_POLICIES;
  }
}

/**
 * Save updated platform policies (Admin control)
 */
export function savePlatformPolicies(policies: PlatformPolicyConfig): void {
  if (typeof window === 'undefined') return;
  try {
    const toSave = { ...policies, updatedAt: new Date().toISOString() };
    localStorage.setItem(POLICY_STORAGE_KEY, JSON.stringify(toSave));
    localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(toSave));
    window.dispatchEvent(new CustomEvent('guruchat_policy_changed', { detail: toSave }));
  } catch (err) {
    console.error('Failed to persist GuruChat platform policies:', err);
  }
}

/**
 * Detect current platform: 'android' if running in Capacitor Native Android, else 'web'
 */
export function getCurrentPlatform(): PlatformType {
  return Capacitor.isNativePlatform() ? 'android' : 'web';
}

/**
 * Check whether a feature is permitted on the current device
 */
export function isFeatureAvailable(featureId: string, policies = getActivePlatformPolicies()): {
  allowed: boolean;
  reason?: string;
  capability?: FeatureCapability;
} {
  const cap = DEFAULT_PLATFORM_CAPABILITIES.find((c) => c.id === featureId);
  if (!cap) return { allowed: false, reason: 'Unknown feature' };

  // Admin override check
  if (policies.features[featureId] === false) {
    return {
      allowed: false,
      reason: 'This feature has been temporarily paused by administrator policy.',
      capability: cap,
    };
  }

  const platform = getCurrentPlatform();
  const platformSupported = platform === 'android' ? cap.android : cap.web;
  if (!platformSupported) {
    return {
      allowed: false,
      reason:
        cap.explanationIfRestricted ||
        `This feature is available exclusively in the GuruChat ${platform === 'web' ? 'Android App' : 'Web App'}.`,
      capability: cap,
    };
  }

  return { allowed: true, capability: cap };
}

/**
 * Web Platform Restriction Engine validator for file attachments
 */
export function validateAttachmentUpload(
  file: File | Blob,
  type: 'image' | 'video' | 'document' | 'voice',
  policies = getActivePlatformPolicies()
): { valid: boolean; error?: string } {
  const platform = getCurrentPlatform();
  const { upload } = policies;

  const sizeMb = file.size / (1024 * 1024);
  const mime = (file.type || '').toLowerCase();

  if (type === 'image') {
    const maxMb = platform === 'android' ? upload.androidMaxImageSizeMb : upload.webMaxImageSizeMb;
    if (sizeMb > maxMb) {
      return {
        valid: false,
        error: `Image size (${sizeMb.toFixed(1)} MB) exceeds the ${platform === 'web' ? 'Web limit of ' + maxMb + ' MB. Tip: Use GuruChat Android for larger uploads' : maxMb + ' MB limit.'}`,
      };
    }
  } else if (type === 'video') {
    const maxMb = platform === 'android' ? upload.androidMaxVideoSizeMb : upload.webMaxVideoSizeMb;
    if (sizeMb > maxMb) {
      return {
        valid: false,
        error: `Video size (${sizeMb.toFixed(1)} MB) exceeds the ${platform === 'web' ? 'Web limit of ' + maxMb + ' MB. For large HD videos up to 100MB, download GuruChat Android' : maxMb + ' MB limit.'}`,
      };
    }
  } else if (type === 'document') {
    const maxMb = platform === 'android' ? upload.androidMaxDocumentSizeMb : upload.webMaxDocumentSizeMb;
    if (sizeMb > maxMb) {
      return {
        valid: false,
        error: `Document size (${sizeMb.toFixed(1)} MB) exceeds the ${maxMb} MB limit.`,
      };
    }
    if (mime && upload.allowedDocTypes.length > 0 && !upload.allowedDocTypes.some(t => mime.includes(t) || t.includes(mime))) {
      // safe fallback warning
      console.warn('Document mime check:', mime);
    }
  }

  return { valid: true };
}

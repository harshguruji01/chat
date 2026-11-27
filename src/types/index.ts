export type AccountState =
  | 'active'
  | 'email_verification_pending'
  | 'restricted'
  | 'suspended'
  | 'deleted'
  | 'recovery_pending';

export type PrivacyAudience = 'everyone' | 'contacts' | 'nobody';

export interface Profile {
  id: string;
  user_code: string; // e.g. 'HG8X29K4'
  username: string;
  display_name: string;
  phone?: string | null;
  email?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  status_message?: string | null;
  is_private: boolean;
  appear_in_nearby: boolean;
  show_online_status: boolean;
  read_receipts_enabled?: boolean;
  who_can_find?: PrivacyAudience;
  who_can_request?: 'everyone' | 'nobody';
  who_can_see_avatar?: PrivacyAudience;
  who_can_call?: PrivacyAudience;
  who_can_invite_group?: PrivacyAudience;
  account_state?: AccountState;
  terms_accepted_at?: string | null;
  last_seen: string;
  latitude?: number | null;
  longitude?: number | null;
  location_updated_at?: string | null;
  is_suspended: boolean;
  role: 'user' | 'admin';
  created_at: string;
  updated_at: string;
  is_premium?: boolean;
  premium_plan?: 'monthly' | 'annual' | 'lifetime' | null;
  premium_until?: string | null;
}

export interface UserSessionRecord {
  id: string;
  user_id: string;
  device_name: string;
  platform: 'web' | 'android' | 'ios' | 'desktop';
  user_agent?: string | null;
  is_revoked: boolean;
  last_active_at: string;
  created_at: string;
}

export interface ConnectionRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  message?: string | null;
  created_at: string;
  updated_at: string;
  sender?: Profile;
  receiver?: Profile;
}

export interface ContactRecord {
  id: string;
  user_id: string;
  contact_id: string;
  nickname?: string | null;
  is_favorite: boolean;
  created_at: string;
  profile?: Profile;
}

export interface NearbyUser {
  id: string;
  user_code: string;
  username: string;
  display_name: string;
  avatar_url?: string | null;
  bio?: string | null;
  is_private: boolean;
  approx_distance_km: number;
  is_following: boolean;
  is_blocked: boolean;
}

export interface Follow {
  id: string;
  follower_id: string;
  following_id: string;
  status: 'pending' | 'accepted';
  created_at: string;
  profile?: Profile;
}

export interface Block {
  id: string;
  blocker_id: string;
  blocked_id: string;
  reason?: string | null;
  created_at: string;
  blocked_profile?: Profile;
}

export type GroupRole = 'owner' | 'admin' | 'moderator' | 'member';

export interface GroupSettings {
  who_can_invite: 'admins' | 'all';
  who_can_send: 'admins' | 'all';
  who_can_edit_info: 'admins' | 'all';
  who_can_pin: 'admins' | 'all';
  who_can_call: 'admins' | 'all';
}

export interface Conversation {
  id: string;
  created_at: string;
  updated_at: string;
  last_message_text?: string;
  last_message_at?: string;
  is_group?: boolean;
  title?: string;
  description?: string | null;
  is_private?: boolean;
  announcement_only?: boolean;
  pinned_message_ids?: string[];
  settings?: GroupSettings;
  avatar_url?: string | null;
  created_by?: string | null;
  // enriched with other member details (for 1-on-1) or member list (for group)
  other_member?: Profile;
  members?: (ConversationMember & { profile?: Profile })[];
  unread_count?: number;
}

export interface ConversationMember {
  id: string;
  conversation_id: string;
  user_id: string;
  unread_count: number;
  last_read_at: string;
  cleared_at?: string | null;
  created_at: string;
  role?: GroupRole;
  profile?: Profile;
}

export type MessageType = 'text' | 'emoji' | 'voice' | 'video' | 'image' | 'like' | 'document' | 'contact' | 'location';
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  type: MessageType;
  content: string;
  media_url?: string | null;
  media_duration?: number | null; // seconds for voice
  media_size_bytes?: number | null; // bytes for video/image/doc
  file_name?: string | null; // original document/attachment filename
  status: MessageStatus;
  deleted_for_everyone: boolean;
  deleted_by_users: string[];
  reactions?: Record<string, string> | null; // e.g. { [userId]: '❤️' }
  reply_to?: { id: string; sender_name?: string; content?: string } | null;
  is_starred?: boolean;
  is_edited?: boolean;
  edited_at?: string | null;
  created_at: string;
  expires_at: string;
  // sender profile joined
  sender?: Profile;
}

export interface Report {
  id: string;
  reporter_id: string;
  reported_id: string;
  reason: string;
  details?: string;
  status: 'pending' | 'resolved' | 'dismissed';
  created_at: string;
  reporter?: Profile;
  reported?: Profile;
}

export interface AdminAuditLog {
  id: string;
  admin_id: string;
  action: string;
  target_type: string;
  target_id: string;
  reason?: string;
  created_at: string;
  admin?: Profile;
}

export interface Community {
  id: string;
  name: string;
  description: string;
  avatar_url?: string | null;
  banner_url?: string | null;
  creator_id: string;
  is_private: boolean;
  member_count: number;
  groups_count: number;
  created_at: string;
  groups?: { id: string; name: string; member_count: number }[];
  is_joined?: boolean;
}

export interface Channel {
  id: string;
  title: string;
  handle: string;
  description: string;
  avatar_url?: string | null;
  banner_url?: string | null;
  subscribers_count: number;
  is_verified: boolean;
  creator_name: string;
  created_at: string;
  is_subscribed?: boolean;
  pinned_announcement?: string;
  posts?: ChannelPost[];
}

export interface ChannelPost {
  id: string;
  channel_id: string;
  title?: string;
  content: string;
  media_url?: string | null;
  views_count: number;
  likes_count: number;
  created_at: string;
}

export type CallLifecycleState =
  | 'idle'
  | 'initiating'
  | 'ringing'
  | 'accepted'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'declined'
  | 'busy'
  | 'missed'
  | 'cancelled'
  | 'ended'
  | 'failed';

export type VideoQualityMode = 'data_saver' | 'standard' | 'high';

export interface CallRecord {
  id: string;
  conversation_id?: string | null;
  caller_id: string;
  callee_id: string;
  call_type: 'audio' | 'video';
  state: CallLifecycleState;
  room_id: string;
  started_at: string;
  connected_at?: string | null;
  ended_at?: string | null;
  duration_seconds: number;
  end_reason?: string | null;
  caller_profile?: Profile;
  callee_profile?: Profile;
}

export type MeetingType =
  | 'audio'
  | 'video'
  | 'group_discussion'
  | 'team_meeting'
  | 'study_meeting'
  | 'presentation';

export interface ConferenceRoom {
  id: string;
  room_code: string;
  title: string;
  description?: string | null;
  meeting_type: MeetingType;
  host_id: string;
  scheduled_at: string;
  duration_minutes: number;
  max_participants: number;
  is_locked: boolean;
  status: 'scheduled' | 'active' | 'ended';
  created_at: string;
  ended_at?: string | null;
  host_profile?: Profile;
  members?: ConferenceMember[];
}

export interface ConferenceMember {
  id: string;
  conference_id: string;
  user_id: string;
  role: 'host' | 'co_host' | 'participant';
  invite_status: 'invited' | 'accepted' | 'declined' | 'joined' | 'left' | 'removed';
  is_muted_by_host: boolean;
  hand_raised: boolean;
  breakout_room_id?: string | null;
  joined_at?: string | null;
  profile?: Profile;
}

export interface BreakoutRoom {
  id: string;
  conference_id: string;
  name: string;
  is_closed: boolean;
  created_at: string;
}

export type AppNotificationType =
  | 'message'
  | 'group_message'
  | 'connection_request'
  | 'incoming_call'
  | 'missed_call'
  | 'conference_invite'
  | 'security'
  | 'announcement';

export interface AppNotification {
  id: string;
  user_id: string;
  type: AppNotificationType;
  title: string;
  body: string;
  data: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}

export interface NotificationPreferences {
  user_id: string;
  messages_enabled: boolean;
  groups_enabled: boolean;
  calls_enabled: boolean;
  sound_enabled: boolean;
  vibration_enabled: boolean;
  quiet_hours_start?: string | null;
  quiet_hours_end?: string | null;
  preview_visible: boolean;
  muted_conversations: string[];
}

export type TabType =
  | 'home'
  | 'chat'
  | 'contacts'
  | 'groups'
  | 'calls'
  | 'conferences'
  | 'notifications'
  | 'communities'
  | 'channels'
  | 'search'
  | 'profile';

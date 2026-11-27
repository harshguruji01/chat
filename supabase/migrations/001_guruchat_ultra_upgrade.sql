-- ============================================================================
-- GURU CHAT ULTRA UPGRADE — COMPATIBLE MIGRATION FOR SITE PROJECT (wumdbpyhpblvgjttsbpv)
-- Preserves all existing profiles, conversations, messages, and site tables.
-- ============================================================================

-- 1. PROFILES: add Guru Chat + privacy + account_state columns
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS user_code TEXT,
  ADD COLUMN IF NOT EXISTS status_message TEXT,
  ADD COLUMN IF NOT EXISTS is_private BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS appear_in_nearby BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS show_online_status BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS read_receipts_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS location_updated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_premium BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS premium_plan TEXT,
  ADD COLUMN IF NOT EXISTS premium_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS account_state TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS who_can_find TEXT NOT NULL DEFAULT 'everyone',
  ADD COLUMN IF NOT EXISTS who_can_request TEXT NOT NULL DEFAULT 'everyone',
  ADD COLUMN IF NOT EXISTS who_can_see_avatar TEXT NOT NULL DEFAULT 'everyone',
  ADD COLUMN IF NOT EXISTS who_can_call TEXT NOT NULL DEFAULT 'contacts',
  ADD COLUMN IF NOT EXISTS who_can_invite_group TEXT NOT NULL DEFAULT 'contacts';

UPDATE public.profiles
SET user_code = COALESCE(user_code, hgj_id, 'HG' || UPPER(SUBSTRING(REPLACE(id::text, '-', ''), 1, 6)))
WHERE user_code IS NULL;

-- 2. CONVERSATIONS & MESSAGES: add Guru Chat columns
ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS is_group BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS last_message_text TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS is_private BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS announcement_only BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS pinned_message_ids UUID[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS settings JSONB NOT NULL DEFAULT '{"who_can_invite":"admins","who_can_send":"all","who_can_edit_info":"admins","who_can_pin":"admins","who_can_call":"all"}'::jsonb;

ALTER TABLE public.messages
  ALTER COLUMN receiver_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'text',
  ADD COLUMN IF NOT EXISTS media_url TEXT,
  ADD COLUMN IF NOT EXISTS media_duration INTEGER,
  ADD COLUMN IF NOT EXISTS media_size_bytes BIGINT,
  ADD COLUMN IF NOT EXISTS file_name TEXT,
  ADD COLUMN IF NOT EXISTS deleted_by_users UUID[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS reactions JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS reply_to JSONB,
  ADD COLUMN IF NOT EXISTS is_starred BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_edited BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '365 days');

-- 3. CORE GURU CHAT TABLES
CREATE TABLE IF NOT EXISTS public.conversation_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  unread_count INTEGER NOT NULL DEFAULT 0,
  last_read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  cleared_at TIMESTAMPTZ,
  role TEXT NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(conversation_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_conv_members_user ON public.conversation_members(user_id);
ALTER TABLE public.conversation_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members view conversation memberships" ON public.conversation_members;
CREATE POLICY "Members view conversation memberships" ON public.conversation_members
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.conversation_members cm2 WHERE cm2.conversation_id = conversation_id AND cm2.user_id = auth.uid())
  );
DROP POLICY IF EXISTS "Authenticated users manage memberships" ON public.conversation_members;
CREATE POLICY "Authenticated users manage memberships" ON public.conversation_members
  FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

CREATE TABLE IF NOT EXISTS public.follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'accepted',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage follows" ON public.follows;
CREATE POLICY "Users manage follows" ON public.follows
  FOR ALL USING (auth.uid() = follower_id OR auth.uid() = following_id)
  WITH CHECK (auth.uid() = follower_id);

CREATE TABLE IF NOT EXISTS public.blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id)
);
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own blocks" ON public.blocks;
CREATE POLICY "Users manage own blocks" ON public.blocks
  FOR ALL USING (auth.uid() = blocker_id) WITH CHECK (auth.uid() = blocker_id);

CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reported_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users create reports" ON public.reports;
CREATE POLICY "Users create reports" ON public.reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);
DROP POLICY IF EXISTS "Users view own reports" ON public.reports;
CREATE POLICY "Users view own reports" ON public.reports
  FOR SELECT USING (auth.uid() = reporter_id);

-- 4. USER SESSIONS & CONTACTS
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  device_name TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('web', 'android', 'ios', 'desktop')),
  user_agent TEXT,
  push_token TEXT,
  is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON public.user_sessions(user_id, is_revoked);
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own sessions" ON public.user_sessions;
CREATE POLICY "Users manage own sessions" ON public.user_sessions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.connection_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT no_self_request CHECK (sender_id <> receiver_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_pending_request
  ON public.connection_requests(sender_id, receiver_id) WHERE status = 'pending';
ALTER TABLE public.connection_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view own connection requests" ON public.connection_requests;
CREATE POLICY "Users view own connection requests" ON public.connection_requests
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
DROP POLICY IF EXISTS "Users create own connection requests" ON public.connection_requests;
CREATE POLICY "Users create own connection requests" ON public.connection_requests
  FOR INSERT WITH CHECK (auth.uid() = sender_id);
DROP POLICY IF EXISTS "Participants update connection requests" ON public.connection_requests;
CREATE POLICY "Participants update connection requests" ON public.connection_requests
  FOR UPDATE USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE TABLE IF NOT EXISTS public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  nickname TEXT,
  is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, contact_id)
);
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own contacts" ON public.contacts;
CREATE POLICY "Users manage own contacts" ON public.contacts
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 5. MESSAGE EDITS, CALLS, CONFERENCES, NOTIFICATIONS, ADMIN
CREATE TABLE IF NOT EXISTS public.message_edits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  editor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  previous_content TEXT NOT NULL,
  edited_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.message_edits ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
  caller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  callee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  call_type TEXT NOT NULL CHECK (call_type IN ('audio', 'video')),
  state TEXT NOT NULL DEFAULT 'initiating',
  room_id TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  connected_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  end_reason TEXT
);
CREATE INDEX IF NOT EXISTS idx_calls_caller ON public.calls(caller_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_calls_callee ON public.calls(callee_id, started_at DESC);
ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Call participants access calls" ON public.calls;
CREATE POLICY "Call participants access calls" ON public.calls
  FOR ALL USING (auth.uid() = caller_id OR auth.uid() = callee_id)
  WITH CHECK (auth.uid() = caller_id OR auth.uid() = callee_id);

CREATE TABLE IF NOT EXISTS public.conference_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  meeting_type TEXT NOT NULL DEFAULT 'video',
  host_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  max_participants INTEGER NOT NULL DEFAULT 25,
  is_locked BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);
ALTER TABLE public.conference_rooms ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.conference_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conference_id UUID NOT NULL REFERENCES public.conference_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'participant',
  invite_status TEXT NOT NULL DEFAULT 'invited',
  is_muted_by_host BOOLEAN NOT NULL DEFAULT FALSE,
  hand_raised BOOLEAN NOT NULL DEFAULT FALSE,
  breakout_room_id UUID,
  joined_at TIMESTAMPTZ,
  UNIQUE(conference_id, user_id)
);
ALTER TABLE public.conference_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authorized participants view conference" ON public.conference_rooms;
CREATE POLICY "Authorized participants view conference" ON public.conference_rooms
  FOR SELECT USING (
    auth.uid() = host_id OR
    EXISTS (SELECT 1 FROM public.conference_members cm WHERE cm.conference_id = id AND cm.user_id = auth.uid())
  );
DROP POLICY IF EXISTS "Hosts manage conference" ON public.conference_rooms;
CREATE POLICY "Hosts manage conference" ON public.conference_rooms
  FOR ALL USING (auth.uid() = host_id) WITH CHECK (auth.uid() = host_id);

DROP POLICY IF EXISTS "Conference members view members" ON public.conference_members;
CREATE POLICY "Conference members view members" ON public.conference_members
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.conference_rooms cr WHERE cr.id = conference_id AND cr.host_id = auth.uid())
  );
DROP POLICY IF EXISTS "Members update own state or host manages" ON public.conference_members;
CREATE POLICY "Members update own state or host manages" ON public.conference_members
  FOR ALL USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.conference_rooms cr WHERE cr.id = conference_id AND cr.host_id = auth.uid())
  );

CREATE TABLE IF NOT EXISTS public.breakout_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conference_id UUID NOT NULL REFERENCES public.conference_rooms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_closed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.breakout_rooms ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, is_read, created_at DESC);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own notifications" ON public.notifications;
CREATE POLICY "Users manage own notifications" ON public.notifications
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  messages_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  groups_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  calls_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  sound_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  vibration_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  quiet_hours_start TEXT,
  quiet_hours_end TEXT,
  preview_visible BOOLEAN NOT NULL DEFAULT TRUE,
  muted_conversations UUID[] DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own notification prefs" ON public.notification_preferences;
CREATE POLICY "Users manage own notification prefs" ON public.notification_preferences
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  reason TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.platform_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_by UUID REFERENCES public.profiles(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- 6. RPCs: get_email_by_identifier & check_call_eligibility
CREATE OR REPLACE FUNCTION public.get_email_by_identifier(identifier TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  found_email TEXT;
BEGIN
  SELECT email INTO found_email
  FROM public.profiles
  WHERE LOWER(username) = LOWER(TRIM(identifier))
     OR UPPER(user_code) = UPPER(TRIM(identifier))
     OR UPPER(hgj_id) = UPPER(TRIM(identifier))
     OR phone = TRIM(identifier)
  LIMIT 1;
  RETURN found_email;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_call_eligibility(target_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_id UUID := auth.uid();
  caller_prof RECORD;
  target_prof RECORD;
  is_blocked BOOLEAN;
  is_contact BOOLEAN;
BEGIN
  IF caller_id IS NULL THEN
    RETURN jsonb_build_object('eligible', false, 'reason', 'Authentication required');
  END IF;

  SELECT id, is_suspended, account_state INTO caller_prof FROM public.profiles WHERE id = caller_id;
  IF caller_prof IS NULL OR caller_prof.is_suspended OR caller_prof.account_state <> 'active' THEN
    RETURN jsonb_build_object('eligible', false, 'reason', 'Your account is not eligible to place calls');
  END IF;

  SELECT id, is_suspended, account_state, who_can_call INTO target_prof FROM public.profiles WHERE id = target_user_id;
  IF target_prof IS NULL OR target_prof.is_suspended THEN
    RETURN jsonb_build_object('eligible', false, 'reason', 'Recipient is unavailable');
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.blocks
    WHERE (blocker_id = caller_id AND blocked_id = target_user_id)
       OR (blocker_id = target_user_id AND blocked_id = caller_id)
  ) INTO is_blocked;

  IF is_blocked THEN
    RETURN jsonb_build_object('eligible', false, 'reason', 'Call blocked by user privacy policy');
  END IF;

  IF target_prof.who_can_call = 'nobody' THEN
    RETURN jsonb_build_object('eligible', false, 'reason', 'Recipient does not accept incoming calls');
  END IF;

  IF target_prof.who_can_call = 'contacts' THEN
    SELECT EXISTS (
      SELECT 1 FROM public.contacts WHERE user_id = target_user_id AND contact_id = caller_id
      UNION ALL
      SELECT 1 FROM public.follows WHERE follower_id = caller_id AND following_id = target_user_id AND status = 'accepted'
    ) INTO is_contact;
    IF NOT is_contact THEN
      RETURN jsonb_build_object('eligible', false, 'reason', 'Recipient only accepts calls from contacts');
    END IF;
  END IF;

  RETURN jsonb_build_object('eligible', true);
END;
$$;

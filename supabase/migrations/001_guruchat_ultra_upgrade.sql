-- ============================================================================
-- GURU CHAT ULTRA UPGRADE — BACKWARD-COMPATIBLE PRODUCTION MIGRATION
-- Preserves all existing users, profiles, conversations, messages, and media.
-- ============================================================================

-- 1. PROFILE & PRIVACY ENHANCEMENTS
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_state TEXT NOT NULL DEFAULT 'active'
    CHECK (account_state IN ('active', 'email_verification_pending', 'restricted', 'suspended', 'deleted', 'recovery_pending')),
  ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS who_can_find TEXT NOT NULL DEFAULT 'everyone'
    CHECK (who_can_find IN ('everyone', 'contacts', 'nobody')),
  ADD COLUMN IF NOT EXISTS who_can_request TEXT NOT NULL DEFAULT 'everyone'
    CHECK (who_can_request IN ('everyone', 'nobody')),
  ADD COLUMN IF NOT EXISTS who_can_see_avatar TEXT NOT NULL DEFAULT 'everyone'
    CHECK (who_can_see_avatar IN ('everyone', 'contacts', 'nobody')),
  ADD COLUMN IF NOT EXISTS who_can_call TEXT NOT NULL DEFAULT 'contacts'
    CHECK (who_can_call IN ('everyone', 'contacts', 'nobody')),
  ADD COLUMN IF NOT EXISTS who_can_invite_group TEXT NOT NULL DEFAULT 'contacts'
    CHECK (who_can_invite_group IN ('everyone', 'contacts', 'nobody'));

-- 2. USER SESSIONS & DEVICES (Remote logout & active device listing)
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

-- 3. CONTACTS & CONNECTION REQUESTS
CREATE TABLE IF NOT EXISTS public.connection_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT no_self_request CHECK (sender_id <> receiver_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_pending_request
  ON public.connection_requests(sender_id, receiver_id) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_conn_req_receiver ON public.connection_requests(receiver_id, status);
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

CREATE INDEX IF NOT EXISTS idx_contacts_user ON public.contacts(user_id);
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own contacts" ON public.contacts;
CREATE POLICY "Users manage own contacts" ON public.contacts
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 4. CONVERSATION & GROUP ENHANCEMENTS
ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS is_private BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS announcement_only BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS pinned_message_ids UUID[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS settings JSONB NOT NULL DEFAULT '{"who_can_invite":"admins","who_can_send":"all","who_can_edit_info":"admins","who_can_pin":"admins","who_can_call":"all"}'::jsonb;

-- 5. MESSAGE EDITS AUDIT TRAIL
CREATE TABLE IF NOT EXISTS public.message_edits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  editor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  previous_content TEXT NOT NULL,
  edited_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_message_edits_msg ON public.message_edits(message_id);
ALTER TABLE public.message_edits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Conversation members view edits" ON public.message_edits;
CREATE POLICY "Conversation members view edits" ON public.message_edits
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.messages m
      JOIN public.conversation_members cm ON cm.conversation_id = m.conversation_id
      WHERE m.id = message_edits.message_id AND cm.user_id = auth.uid()
    )
  );

-- 6. CALLS & CALL INVITATIONS
CREATE TABLE IF NOT EXISTS public.calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
  caller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  callee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  call_type TEXT NOT NULL CHECK (call_type IN ('audio', 'video')),
  state TEXT NOT NULL DEFAULT 'initiating'
    CHECK (state IN ('idle','initiating','ringing','accepted','connecting','connected','reconnecting','declined','busy','missed','cancelled','ended','failed')),
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

-- 7. GROUP CONFERENCING & BREAKOUT ROOMS
CREATE TABLE IF NOT EXISTS public.conference_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  meeting_type TEXT NOT NULL DEFAULT 'video'
    CHECK (meeting_type IN ('audio', 'video', 'group_discussion', 'team_meeting', 'study_meeting', 'presentation')),
  host_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  max_participants INTEGER NOT NULL DEFAULT 25 CHECK (max_participants BETWEEN 2 AND 100),
  is_locked BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('scheduled', 'active', 'ended')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_conf_host ON public.conference_rooms(host_id, status);
ALTER TABLE public.conference_rooms ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.conference_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conference_id UUID NOT NULL REFERENCES public.conference_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'participant' CHECK (role IN ('host', 'co_host', 'participant')),
  invite_status TEXT NOT NULL DEFAULT 'invited' CHECK (invite_status IN ('invited', 'accepted', 'declined', 'joined', 'left', 'removed')),
  is_muted_by_host BOOLEAN NOT NULL DEFAULT FALSE,
  hand_raised BOOLEAN NOT NULL DEFAULT FALSE,
  breakout_room_id UUID,
  joined_at TIMESTAMPTZ,
  UNIQUE(conference_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_conf_members_user ON public.conference_members(user_id, invite_status);
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
    EXISTS (SELECT 1 FROM public.conference_rooms cr WHERE cr.id = conference_id AND cr.host_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.conference_members cm2 WHERE cm2.conference_id = conference_id AND cm2.user_id = auth.uid())
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

-- 8. NOTIFICATIONS & PREFERENCES
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('message', 'group_message', 'connection_request', 'incoming_call', 'missed_call', 'conference_invite', 'security', 'announcement')),
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

-- 9. ADMIN AUDIT LOGS & PLATFORM SETTINGS
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

-- 10. SERVER-SIDE CALL ELIGIBILITY RPC
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

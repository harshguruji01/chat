import { supabase } from '../lib/supabase';
import type { BreakoutRoom, ConferenceMember, ConferenceRoom, MeetingType } from '../types';

const LOCAL_CONF_KEY = 'guruchat_conferences';

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'GC-';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function createConferenceRoom(params: {
  hostId: string;
  title: string;
  description?: string;
  meetingType: MeetingType;
  scheduledAt?: string;
  durationMinutes: number;
  maxParticipants: number;
  inviteeIds: string[];
}): Promise<{ room?: ConferenceRoom; error?: string }> {
  const roomCode = generateRoomCode();
  const payload = {
    room_code: roomCode,
    title: params.title.trim(),
    description: params.description?.trim() || null,
    meeting_type: params.meetingType,
    host_id: params.hostId,
    scheduled_at: params.scheduledAt || new Date().toISOString(),
    duration_minutes: params.durationMinutes,
    max_participants: params.maxParticipants,
    status: 'active' as const,
  };

  try {
    const { data, error } = await supabase
      .from('conference_rooms')
      .insert(payload)
      .select('*')
      .single();

    if (!error && data) {
      const membersToInsert = [
        { conference_id: data.id, user_id: params.hostId, role: 'host', invite_status: 'accepted' },
        ...params.inviteeIds
          .filter((id) => id !== params.hostId)
          .map((id) => ({ conference_id: data.id, user_id: id, role: 'participant', invite_status: 'invited' })),
      ];
      await supabase.from('conference_members').insert(membersToInsert);
      return { room: data as ConferenceRoom };
    }
  } catch {}

  const localRoom: ConferenceRoom = {
    id: `conf-${Date.now()}`,
    ...payload,
    is_locked: false,
    created_at: new Date().toISOString(),
    members: [
      {
        id: `cm-host-${Date.now()}`,
        conference_id: '',
        user_id: params.hostId,
        role: 'host',
        invite_status: 'accepted',
        is_muted_by_host: false,
        hand_raised: false,
      },
    ],
  };
  try {
    const list: ConferenceRoom[] = JSON.parse(localStorage.getItem(LOCAL_CONF_KEY) || '[]');
    list.unshift(localRoom);
    localStorage.setItem(LOCAL_CONF_KEY, JSON.stringify(list.slice(0, 30)));
  } catch {}
  return { room: localRoom };
}

export async function listMyConferences(userId: string): Promise<ConferenceRoom[]> {
  try {
    const { data, error } = await supabase
      .from('conference_rooms')
      .select('*, host_profile:host_id(*), members:conference_members(*, profile:user_id(*))')
      .neq('status', 'ended')
      .order('scheduled_at', { ascending: false })
      .limit(30);
    if (!error && data) return data as ConferenceRoom[];
  } catch {}

  try {
    const list: ConferenceRoom[] = JSON.parse(localStorage.getItem(LOCAL_CONF_KEY) || '[]');
    return list.filter((r) => r.status !== 'ended' && (r.host_id === userId || r.members?.some((m) => m.user_id === userId)));
  } catch {
    return [];
  }
}

export async function joinConferenceByCode(roomCode: string, userId: string): Promise<{ room?: ConferenceRoom; error?: string }> {
  const clean = roomCode.trim().toUpperCase();
  try {
    const { data, error } = await supabase
      .from('conference_rooms')
      .select('*, members:conference_members(*, profile:user_id(*))')
      .eq('room_code', clean)
      .neq('status', 'ended')
      .maybeSingle();

    if (!error && data) {
      if (data.is_locked && data.host_id !== userId) {
        return { error: 'This meeting is locked by the host.' };
      }
      const members = (data.members || []) as ConferenceMember[];
      if (members.length >= data.max_participants && !members.some((m) => m.user_id === userId)) {
        return { error: 'Meeting has reached its maximum participant limit.' };
      }
      await supabase.from('conference_members').upsert(
        { conference_id: data.id, user_id: userId, invite_status: 'joined', joined_at: new Date().toISOString() },
        { onConflict: 'conference_id,user_id' }
      );
      return { room: data as ConferenceRoom };
    }
  } catch {}

  try {
    const list: ConferenceRoom[] = JSON.parse(localStorage.getItem(LOCAL_CONF_KEY) || '[]');
    const found = list.find((r) => r.room_code === clean && r.status !== 'ended');
    if (found) return { room: found };
  } catch {}
  return { error: 'Authorized meeting not found or has ended.' };
}

export async function endConferenceForAll(conferenceId: string): Promise<void> {
  try {
    await supabase
      .from('conference_rooms')
      .update({ status: 'ended', ended_at: new Date().toISOString() })
      .eq('id', conferenceId);
  } catch {}
  try {
    const list: ConferenceRoom[] = JSON.parse(localStorage.getItem(LOCAL_CONF_KEY) || '[]');
    localStorage.setItem(
      LOCAL_CONF_KEY,
      JSON.stringify(list.map((r) => (r.id === conferenceId ? { ...r, status: 'ended' } : r)))
    );
  } catch {}
}

export async function toggleConferenceLock(conferenceId: string, isLocked: boolean): Promise<void> {
  try {
    await supabase.from('conference_rooms').update({ is_locked: isLocked }).eq('id', conferenceId);
  } catch {}
}

export async function createBreakoutRoom(conferenceId: string, name: string): Promise<BreakoutRoom> {
  const fallback: BreakoutRoom = {
    id: `br-${Date.now()}`,
    conference_id: conferenceId,
    name,
    is_closed: false,
    created_at: new Date().toISOString(),
  };
  try {
    const { data, error } = await supabase
      .from('breakout_rooms')
      .insert({ conference_id: conferenceId, name })
      .select('*')
      .single();
    if (!error && data) return data as BreakoutRoom;
  } catch {}
  return fallback;
}

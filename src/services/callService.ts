import { supabase } from '../lib/supabase';
import { isOfficialWebOrigin } from '../config/environment';
import { getActivePlatformPolicies } from '../config/platformCapabilities';
import type { CallLifecycleState, CallRecord, Profile, VideoQualityMode } from '../types';

const LOCAL_CALLS_KEY = 'guruchat_call_history';

export async function verifyCallEligibility(
  callerProfile: Profile | null,
  targetUserId: string,
  isBlocked: boolean
): Promise<{ eligible: boolean; reason?: string }> {
  if (!isOfficialWebOrigin()) {
    return { eligible: false, reason: 'Calls are only permitted from official Guru Chat clients.' };
  }
  if (!callerProfile) {
    return { eligible: false, reason: 'Please sign in to place calls.' };
  }
  if (callerProfile.is_suspended || (callerProfile.account_state && callerProfile.account_state !== 'active')) {
    return { eligible: false, reason: 'Your account is not eligible for calling.' };
  }
  if (isBlocked) {
    return { eligible: false, reason: 'Cannot call a blocked user.' };
  }

  const policies = getActivePlatformPolicies();
  if (policies.features?.calling === false) {
    return { eligible: false, reason: 'Calling is currently disabled by platform policy.' };
  }

  try {
    const { data, error } = await supabase.rpc('check_call_eligibility', {
      target_user_id: targetUserId,
    });
    if (!error && data && typeof data === 'object' && 'eligible' in data) {
      return data as { eligible: boolean; reason?: string };
    }
  } catch {
    // Fallback if RPC not yet deployed
  }
  return { eligible: true };
}

export async function createCallRecord(params: {
  callerId: string;
  calleeId: string;
  callType: 'audio' | 'video';
  roomId: string;
  conversationId?: string | null;
}): Promise<string> {
  const fallbackId = `call-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  try {
    const { data, error } = await supabase
      .from('calls')
      .insert({
        caller_id: params.callerId,
        callee_id: params.calleeId,
        call_type: params.callType,
        room_id: params.roomId,
        conversation_id: params.conversationId || null,
        state: 'initiating',
      })
      .select('id')
      .single();
    if (!error && data?.id) return data.id;
  } catch {}

  try {
    const list: CallRecord[] = JSON.parse(localStorage.getItem(LOCAL_CALLS_KEY) || '[]');
    list.unshift({
      id: fallbackId,
      caller_id: params.callerId,
      callee_id: params.calleeId,
      call_type: params.callType,
      state: 'initiating',
      room_id: params.roomId,
      conversation_id: params.conversationId || null,
      started_at: new Date().toISOString(),
      duration_seconds: 0,
    });
    localStorage.setItem(LOCAL_CALLS_KEY, JSON.stringify(list.slice(0, 100)));
  } catch {}
  return fallbackId;
}

export async function updateCallRecordState(
  callId: string,
  state: CallLifecycleState,
  durationSeconds?: number,
  endReason?: string
): Promise<void> {
  const isTerminal = ['declined', 'busy', 'missed', 'cancelled', 'ended', 'failed'].includes(state);
  const patch: Record<string, unknown> = { state };
  if (state === 'connected') patch.connected_at = new Date().toISOString();
  if (isTerminal) patch.ended_at = new Date().toISOString();
  if (typeof durationSeconds === 'number') patch.duration_seconds = durationSeconds;
  if (endReason) patch.end_reason = endReason;

  try {
    await supabase.from('calls').update(patch).eq('id', callId);
  } catch {}

  try {
    const list: CallRecord[] = JSON.parse(localStorage.getItem(LOCAL_CALLS_KEY) || '[]');
    localStorage.setItem(
      LOCAL_CALLS_KEY,
      JSON.stringify(list.map((c) => (c.id === callId ? { ...c, ...patch } : c)))
    );
  } catch {}
}

export async function listCallHistory(userId: string): Promise<CallRecord[]> {
  try {
    const { data, error } = await supabase
      .from('calls')
      .select('*, caller_profile:caller_id(*), callee_profile:callee_id(*)')
      .or(`caller_id.eq.${userId},callee_id.eq.${userId}`)
      .order('started_at', { ascending: false })
      .limit(50);
    if (!error && data) return data as CallRecord[];
  } catch {}

  try {
    const list: CallRecord[] = JSON.parse(localStorage.getItem(LOCAL_CALLS_KEY) || '[]');
    return list.filter((c) => c.caller_id === userId || c.callee_id === userId);
  } catch {
    return [];
  }
}

export function getVideoConstraints(quality: VideoQualityMode): MediaTrackConstraints {
  switch (quality) {
    case 'data_saver':
      return { width: { ideal: 320 }, height: { ideal: 240 }, frameRate: { ideal: 15, max: 15 } };
    case 'high':
      return { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30, max: 30 } };
    case 'standard':
    default:
      return { width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 24, max: 24 } };
  }
}

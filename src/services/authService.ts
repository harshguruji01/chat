import { Capacitor } from '@capacitor/core';
import { supabase } from '../lib/supabase';
import type { Profile, UserSessionRecord } from '../types';
import type { User } from '@supabase/supabase-js';

const LOCAL_SESSIONS_KEY = 'guruchat_device_sessions';

function detectDeviceInfo(): { device_name: string; platform: 'web' | 'android' | 'ios' | 'desktop'; user_agent: string } {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown';
  if (Capacitor.isNativePlatform()) {
    const plat = Capacitor.getPlatform() === 'ios' ? 'ios' : 'android';
    return {
      device_name: plat === 'android' ? 'Guru Chat Android App' : 'Guru Chat iOS App',
      platform: plat,
      user_agent: ua,
    };
  }
  const browser = /Edg/i.test(ua)
    ? 'Edge'
    : /Firefox/i.test(ua)
      ? 'Firefox'
      : /Chrome/i.test(ua)
        ? 'Chrome'
        : /Safari/i.test(ua)
          ? 'Safari'
          : 'Web Browser';
  const os = /Android/i.test(ua)
    ? 'Android'
    : /iPhone|iPad/i.test(ua)
      ? 'iOS'
      : /Linux/i.test(ua)
        ? 'Linux'
        : /Mac/i.test(ua)
          ? 'macOS'
          : /Windows/i.test(ua)
            ? 'Windows'
            : 'Desktop';
  return {
    device_name: `${browser} on ${os}`,
    platform: 'web',
    user_agent: ua.slice(0, 180),
  };
}

export async function registerCurrentDeviceSession(userId: string): Promise<string | null> {
  const info = detectDeviceInfo();
  const existingId = sessionStorage.getItem('guruchat_current_session_id');
  if (existingId) {
    supabase
      .from('user_sessions')
      .update({ last_active_at: new Date().toISOString() })
      .eq('id', existingId)
      .then(() => {});
    return existingId;
  }

  try {
    const { data, error } = await supabase
      .from('user_sessions')
      .insert({
        user_id: userId,
        device_name: info.device_name,
        platform: info.platform,
        user_agent: info.user_agent,
      })
      .select('id')
      .single();

    if (!error && data?.id) {
      sessionStorage.setItem('guruchat_current_session_id', data.id);
      return data.id;
    }
  } catch {
    // Fallback to local session tracking if migration not yet applied
  }

  const fallbackId = `local-${Date.now()}`;
  sessionStorage.setItem('guruchat_current_session_id', fallbackId);
  try {
    const list: UserSessionRecord[] = JSON.parse(localStorage.getItem(LOCAL_SESSIONS_KEY) || '[]');
    list.unshift({
      id: fallbackId,
      user_id: userId,
      device_name: info.device_name,
      platform: info.platform,
      user_agent: info.user_agent,
      is_revoked: false,
      last_active_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    });
    localStorage.setItem(LOCAL_SESSIONS_KEY, JSON.stringify(list.slice(0, 10)));
  } catch {}
  return fallbackId;
}

export async function listUserSessions(userId: string): Promise<UserSessionRecord[]> {
  try {
    const { data, error } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_revoked', false)
      .order('last_active_at', { ascending: false });
    if (!error && data) return data as UserSessionRecord[];
  } catch {}

  try {
    const list: UserSessionRecord[] = JSON.parse(localStorage.getItem(LOCAL_SESSIONS_KEY) || '[]');
    return list.filter((s) => s.user_id === userId && !s.is_revoked);
  } catch {
    return [];
  }
}

export async function revokeDeviceSession(sessionId: string): Promise<{ error?: string }> {
  try {
    const { error } = await supabase
      .from('user_sessions')
      .update({ is_revoked: true })
      .eq('id', sessionId);
    if (!error) return {};
  } catch {}

  try {
    const list: UserSessionRecord[] = JSON.parse(localStorage.getItem(LOCAL_SESSIONS_KEY) || '[]');
    const updated = list.filter((s) => s.id !== sessionId);
    localStorage.setItem(LOCAL_SESSIONS_KEY, JSON.stringify(updated));
  } catch {}
  return {};
}

export function getEffectiveAccountState(profile: Profile | null, user: User | null): {
  allowed: boolean;
  state: string;
  reason?: string;
} {
  if (!user) return { allowed: false, state: 'unauthenticated', reason: 'Please sign in to continue.' };
  if (profile?.is_suspended || profile?.account_state === 'suspended') {
    return { allowed: false, state: 'suspended', reason: 'Your account has been suspended by an administrator.' };
  }
  if (profile?.account_state === 'deleted') {
    return { allowed: false, state: 'deleted', reason: 'This account is scheduled for deletion.' };
  }
  if (profile?.account_state === 'restricted') {
    return { allowed: false, state: 'restricted', reason: 'Your account has temporary messaging/calling restrictions.' };
  }
  if (profile?.account_state === 'email_verification_pending' || (user.email && !user.email_confirmed_at && user.app_metadata?.provider === 'email')) {
    return { allowed: true, state: 'email_verification_pending', reason: 'Please verify your email address for full access.' };
  }
  return { allowed: true, state: profile?.account_state || 'active' };
}

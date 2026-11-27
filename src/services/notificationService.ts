import { supabase } from '../lib/supabase';
import type { AppNotification, AppNotificationType, NotificationPreferences } from '../types';

const LOCAL_NOTIFS_KEY = 'guruchat_notifications';
const LOCAL_PREFS_KEY = 'guruchat_notification_prefs';

export const DEFAULT_NOTIFICATION_PREFS: Omit<NotificationPreferences, 'user_id'> = {
  messages_enabled: true,
  groups_enabled: true,
  calls_enabled: true,
  sound_enabled: true,
  vibration_enabled: true,
  quiet_hours_start: null,
  quiet_hours_end: null,
  preview_visible: true,
  muted_conversations: [],
};

export async function listUserNotifications(userId: string): Promise<AppNotification[]> {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);
    if (!error && data) return data as AppNotification[];
  } catch {}

  try {
    const local: AppNotification[] = JSON.parse(localStorage.getItem(LOCAL_NOTIFS_KEY) || '[]');
    return local.filter((n) => n.user_id === userId);
  } catch {
    return [];
  }
}

export async function pushNotificationRecord(
  userId: string,
  type: AppNotificationType,
  title: string,
  body: string,
  data: Record<string, unknown> = {}
): Promise<void> {
  try {
    const { error } = await supabase.from('notifications').insert({
      user_id: userId,
      type,
      title,
      body,
      data,
    });
    if (!error) return;
  } catch {}

  try {
    const local: AppNotification[] = JSON.parse(localStorage.getItem(LOCAL_NOTIFS_KEY) || '[]');
    local.unshift({
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      user_id: userId,
      type,
      title,
      body,
      data,
      is_read: false,
      created_at: new Date().toISOString(),
    });
    localStorage.setItem(LOCAL_NOTIFS_KEY, JSON.stringify(local.slice(0, 60)));
  } catch {}
}

export async function markNotificationRead(id: string): Promise<void> {
  try {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
  } catch {}
  try {
    const local: AppNotification[] = JSON.parse(localStorage.getItem(LOCAL_NOTIFS_KEY) || '[]');
    localStorage.setItem(
      LOCAL_NOTIFS_KEY,
      JSON.stringify(local.map((n) => (n.id === id ? { ...n, is_read: true } : n)))
    );
  } catch {}
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  try {
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId).eq('is_read', false);
  } catch {}
  try {
    const local: AppNotification[] = JSON.parse(localStorage.getItem(LOCAL_NOTIFS_KEY) || '[]');
    localStorage.setItem(
      LOCAL_NOTIFS_KEY,
      JSON.stringify(local.map((n) => (n.user_id === userId ? { ...n, is_read: true } : n)))
    );
  } catch {}
}

export async function getNotificationPreferences(userId: string): Promise<NotificationPreferences> {
  try {
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    if (!error && data) return data as NotificationPreferences;
  } catch {}

  try {
    const saved = localStorage.getItem(`${LOCAL_PREFS_KEY}_${userId}`);
    if (saved) return { user_id: userId, ...DEFAULT_NOTIFICATION_PREFS, ...JSON.parse(saved) };
  } catch {}
  return { user_id: userId, ...DEFAULT_NOTIFICATION_PREFS };
}

export async function saveNotificationPreferences(prefs: NotificationPreferences): Promise<{ error?: string }> {
  try {
    localStorage.setItem(`${LOCAL_PREFS_KEY}_${prefs.user_id}`, JSON.stringify(prefs));
  } catch {}

  try {
    const { error } = await supabase
      .from('notification_preferences')
      .upsert({ ...prefs, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
    if (error) return { error: error.message };
  } catch {}
  return {};
}

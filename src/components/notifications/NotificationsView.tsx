import React, { useState, useEffect, useCallback } from 'react';
import {
  Bell,
  CheckCheck,
  Sliders,
  Smartphone,
  Laptop,
  LogOut,
  PhoneMissed,
  MessageSquare,
  UserPlus,
  Video,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../common/Toast';
import { OutlinedButton } from '../common/OutlinedButton';
import {
  listUserNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getNotificationPreferences,
  saveNotificationPreferences,
} from '../../services/notificationService';
import { listUserSessions, revokeDeviceSession } from '../../services/authService';
import { requestNotificationPermission } from '../../lib/notifications';
import type { AppNotification, NotificationPreferences, UserSessionRecord } from '../../types';

interface NotificationsViewProps {
  onNavigateTab?: (tab: 'chat' | 'contacts' | 'calls' | 'conferences') => void;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({ onNavigateTab }) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [subTab, setSubTab] = useState<'inbox' | 'preferences' | 'devices'>('inbox');
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const [sessions, setSessions] = useState<UserSessionRecord[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const loadAll = useCallback(async () => {
    if (!user) return;
    const [notifs, userPrefs, devSessions] = await Promise.all([
      listUserNotifications(user.id),
      getNotificationPreferences(user.id),
      listUserSessions(user.id),
    ]);
    setNotifications(notifs);
    setPrefs(userPrefs);
    setSessions(devSessions);
  }, [user]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleNotificationClick = async (n: AppNotification) => {
    await markNotificationRead(n.id);
    setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)));
    if (onNavigateTab) {
      if (n.type === 'connection_request') onNavigateTab('contacts');
      else if (n.type === 'missed_call' || n.type === 'incoming_call') onNavigateTab('calls');
      else if (n.type === 'conference_invite') onNavigateTab('conferences');
      else if (n.type === 'message' || n.type === 'group_message') onNavigateTab('chat');
    }
  };

  const getIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'missed_call':
      case 'incoming_call':
        return <PhoneMissed size={18} color="var(--color-danger)" />;
      case 'connection_request':
        return <UserPlus size={18} color="var(--color-cyan)" />;
      case 'conference_invite':
        return <Video size={18} color="var(--color-violet)" />;
      case 'security':
        return <ShieldAlert size={18} color="var(--color-warning)" />;
      default:
        return <MessageSquare size={18} color="var(--color-primary)" />;
    }
  };

  const currentSessionId = sessionStorage.getItem('guruchat_current_session_id');

  return (
    <div style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-app)', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '18px 24px 12px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-card)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Bell size={22} color="var(--color-primary)" />
            <h2 style={{ fontFamily: 'var(--font-brand)', fontSize: '1.3rem', fontWeight: 800, margin: 0 }}>
              Notifications &amp; Devices
            </h2>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <OutlinedButton
              size="sm"
              variant="secondary"
              onClick={async () => {
                const ok = await requestNotificationPermission();
                showToast(ok ? 'System notifications enabled!' : 'Permission was not granted.', ok ? 'success' : 'info');
              }}
            >
              Enable Push
            </OutlinedButton>
            {user && notifications.some((n) => !n.is_read) && (
              <OutlinedButton
                size="sm"
                variant="primary"
                onClick={async () => {
                  await markAllNotificationsRead(user.id);
                  setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
                }}
                icon={<CheckCheck size={14} />}
              >
                Mark All Read
              </OutlinedButton>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {[
            { id: 'inbox', label: 'Inbox', icon: <Bell size={14} /> },
            { id: 'preferences', label: 'Preferences', icon: <Sliders size={14} /> },
            { id: 'devices', label: `Active Devices (${sessions.length})`, icon: <Smartphone size={14} /> },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setSubTab(t.id as any)}
              style={{
                padding: '7px 14px',
                borderRadius: 'var(--radius-full)',
                border: subTab === t.id ? '1px solid var(--color-primary)' : '1px solid var(--border-color)',
                background: subTab === t.id ? 'var(--color-primary-light)' : 'var(--bg-input)',
                color: subTab === t.id ? 'var(--color-primary)' : 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: '0.82rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              {t.icon}
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '18px 24px', maxWidth: '860px', width: '100%', margin: '0 auto' }}>
        {subTab === 'inbox' && (
          notifications.length === 0 ? (
            <div className="card" style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Bell size={34} style={{ marginBottom: '10px', opacity: 0.6 }} />
              <div>You&apos;re all caught up! New messages, calls, and invites appear here.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className="card"
                  style={{
                    padding: '14px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    cursor: 'pointer',
                    borderColor: n.is_read ? 'var(--border-color)' : 'var(--color-primary)',
                    background: n.is_read ? 'var(--bg-card)' : 'rgba(99, 102, 241, 0.06)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '10px',
                        background: 'var(--bg-input)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {getIcon(n.type)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>{n.title}</div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{n.body}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {subTab === 'preferences' && prefs && (
          <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {[
              { key: 'messages_enabled', label: 'Direct Message Notifications', desc: 'Alert on new 1:1 messages' },
              { key: 'groups_enabled', label: 'Group Notifications', desc: 'Alert on group messages and @mentions' },
              { key: 'calls_enabled', label: 'Incoming Call Alerts', desc: 'Ring & show call notifications for voice/video' },
              { key: 'sound_enabled', label: 'Notification Sounds', desc: 'Play audio cues for incoming events' },
              { key: 'vibration_enabled', label: 'Vibration (Android)', desc: 'Haptic feedback for incoming messages & calls' },
              { key: 'preview_visible', label: 'Show Message Preview', desc: 'Display sender message snippet in system banners' },
            ].map((item) => (
              <div
                key={item.key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-input)',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{item.label}</div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>{item.desc}</div>
                </div>
                <input
                  type="checkbox"
                  checked={Boolean((prefs as any)[item.key])}
                  onChange={(e) => setPrefs({ ...prefs, [item.key]: e.target.checked })}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary)', cursor: 'pointer' }}
                />
              </div>
            ))}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Quiet Hours Start
                </label>
                <input
                  type="time"
                  className="input-field"
                  value={prefs.quiet_hours_start || ''}
                  onChange={(e) => setPrefs({ ...prefs, quiet_hours_start: e.target.value || null })}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Quiet Hours End
                </label>
                <input
                  type="time"
                  className="input-field"
                  value={prefs.quiet_hours_end || ''}
                  onChange={(e) => setPrefs({ ...prefs, quiet_hours_end: e.target.value || null })}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <OutlinedButton
                variant="primary"
                isLoading={isSaving}
                onClick={async () => {
                  setIsSaving(true);
                  const res = await saveNotificationPreferences(prefs);
                  setIsSaving(false);
                  if (res.error) showToast(res.error, 'error');
                  else showToast('Notification preferences saved!', 'success');
                }}
              >
                Save Preferences
              </OutlinedButton>
            </div>
          </div>
        )}

        {subTab === 'devices' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {sessions.map((s) => {
              const isCurrent = s.id === currentSessionId;
              return (
                <div key={s.id} className="card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {s.platform === 'android' ? <Smartphone size={20} color="var(--color-cyan)" /> : <Laptop size={20} color="var(--color-primary)" />}
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>
                        {s.device_name} {isCurrent && <span style={{ color: 'var(--color-success)', fontSize: '0.75rem' }}>(This device)</span>}
                      </div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                        Last active: {new Date(s.last_active_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  {!isCurrent && (
                    <OutlinedButton
                      size="sm"
                      variant="danger"
                      onClick={async () => {
                        await revokeDeviceSession(s.id);
                        setSessions((prev) => prev.filter((x) => x.id !== s.id));
                        showToast('Device session revoked.', 'info');
                      }}
                      icon={<LogOut size={14} />}
                    >
                      Remote Logout
                    </OutlinedButton>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

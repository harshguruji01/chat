import React, { useState, useEffect, useCallback } from 'react';
import { Phone, Video, PhoneIncoming, PhoneOutgoing, PhoneMissed, Clock, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCall } from '../../context/CallContext';
import { Avatar } from '../common/Avatar';
import { OutlinedButton } from '../common/OutlinedButton';
import { listCallHistory } from '../../services/callService';
import type { CallRecord } from '../../types';

export const CallsView: React.FC = () => {
  const { user } = useAuth();
  const { startCall } = useCall();
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [filter, setFilter] = useState<'all' | 'missed' | 'incoming' | 'outgoing'>('all');
  const [isLoading, setIsLoading] = useState(true);

  const loadCalls = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    const data = await listCallHistory(user.id);
    setCalls(data);
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    loadCalls();
  }, [loadCalls]);

  const filtered = calls.filter((c) => {
    if (!user) return false;
    if (filter === 'missed') return c.state === 'missed' || c.state === 'declined';
    if (filter === 'incoming') return c.callee_id === user.id;
    if (filter === 'outgoing') return c.caller_id === user.id;
    return true;
  });

  const formatDur = (sec: number) => {
    if (!sec) return '0s';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  return (
    <div style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-app)', overflow: 'hidden' }}>
      <div style={{ padding: '18px 24px 12px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-card)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Phone size={22} color="var(--color-primary)" />
            <h2 style={{ fontFamily: 'var(--font-brand)', fontSize: '1.3rem', fontWeight: 800, margin: 0 }}>
              Calls &amp; History
            </h2>
          </div>
          <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <ShieldCheck size={14} color="var(--color-success)" />
            Authenticated WebRTC Only
          </span>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: 'Recent Calls' },
            { id: 'missed', label: 'Missed' },
            { id: 'incoming', label: 'Incoming' },
            { id: 'outgoing', label: 'Outgoing' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setFilter(t.id as any)}
              style={{
                padding: '7px 14px',
                borderRadius: 'var(--radius-full)',
                border: filter === t.id ? '1px solid var(--color-primary)' : '1px solid var(--border-color)',
                background: filter === t.id ? 'var(--color-primary-light)' : 'var(--bg-input)',
                color: filter === t.id ? 'var(--color-primary)' : 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: '0.82rem',
                cursor: 'pointer',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '18px 24px', maxWidth: '860px', width: '100%', margin: '0 auto' }}>
        {isLoading ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px' }}>Loading call history...</p>
        ) : filtered.length === 0 ? (
          <div className="card" style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Phone size={34} style={{ marginBottom: '10px', opacity: 0.6 }} />
            <div>No {filter === 'all' ? '' : filter} calls recorded yet.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filtered.map((c) => {
              const isOutgoing = c.caller_id === user?.id;
              const partner = isOutgoing ? c.callee_profile : c.caller_profile;
              const isMissed = c.state === 'missed' || c.state === 'declined' || c.state === 'failed';
              return (
                <div
                  key={c.id}
                  className="card"
                  style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Avatar src={partner?.avatar_url} name={partner?.display_name || 'GuruChat User'} size="md" />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: isMissed ? 'var(--color-danger)' : 'var(--text-primary)' }}>
                        {partner?.display_name || 'Guru Chat User'}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                        {isMissed ? (
                          <PhoneMissed size={12} color="var(--color-danger)" />
                        ) : isOutgoing ? (
                          <PhoneOutgoing size={12} color="var(--color-success)" />
                        ) : (
                          <PhoneIncoming size={12} color="var(--color-cyan)" />
                        )}
                        <span style={{ textTransform: 'capitalize' }}>
                          {c.call_type} • {c.state}
                        </span>
                        {c.duration_seconds > 0 && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            <Clock size={11} /> {formatDur(c.duration_seconds)}
                          </span>
                        )}
                        <span>• {new Date(c.started_at).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {partner && (
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <OutlinedButton size="sm" variant="secondary" onClick={() => startCall(partner, 'audio')} icon={<Phone size={14} />} title="Voice Call" />
                      <OutlinedButton size="sm" variant="primary" onClick={() => startCall(partner, 'video')} icon={<Video size={14} />} title="Video Call" />
                    </div>
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

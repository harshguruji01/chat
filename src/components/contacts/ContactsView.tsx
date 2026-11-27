import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  UserPlus,
  UserCheck,
  UserX,
  Search,
  Ban,
  MessageCircle,
  Phone,
  Video,
  Check,
  X,
  Clock,
  Shield,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { useCall } from '../../context/CallContext';
import { useToast } from '../common/Toast';
import { Avatar } from '../common/Avatar';
import { OutlinedButton } from '../common/OutlinedButton';
import {
  listMyContacts,
  listConnectionRequests,
  searchUsersDirectory,
  sendConnectionRequest,
  respondToConnectionRequest,
  removeContactConnection,
} from '../../services/contactService';
import { supabase } from '../../lib/supabase';
import type { ConnectionRequest, ContactRecord, Profile } from '../../types';

interface ContactsViewProps {
  onStartChat: () => void;
  onViewProfile: (userId: string) => void;
}

type ContactSubTab = 'contacts' | 'incoming' | 'sent' | 'search' | 'blocked';

export const ContactsView: React.FC<ContactsViewProps> = ({ onStartChat, onViewProfile }) => {
  const { user } = useAuth();
  const { startChatWithUser, blockedUserIds, unblockUser, isUserBlocked } = useChat();
  const { startCall } = useCall();
  const { showToast } = useToast();

  const [subTab, setSubTab] = useState<ContactSubTab>('contacts');
  const [contacts, setContacts] = useState<ContactRecord[]>([]);
  const [incoming, setIncoming] = useState<ConnectionRequest[]>([]);
  const [sent, setSent] = useState<ConnectionRequest[]>([]);
  const [blockedProfiles, setBlockedProfiles] = useState<Profile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadDirectory = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const [cList, reqs] = await Promise.all([
        listMyContacts(user.id),
        listConnectionRequests(user.id),
      ]);
      setContacts(cList);
      setIncoming(reqs.incoming);
      setSent(reqs.sent);

      if (blockedUserIds.length > 0) {
        const { data } = await supabase.from('profiles').select('*').in('id', blockedUserIds);
        if (data) setBlockedProfiles(data as Profile[]);
      } else {
        setBlockedProfiles([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [user, blockedUserIds]);

  useEffect(() => {
    loadDirectory();
  }, [loadDirectory]);

  useEffect(() => {
    if (!user || !searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      const { results } = await searchUsersDirectory(searchQuery, user.id);
      setSearchResults(results);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, user]);

  const handleMessage = async (target: Profile) => {
    const { error } = await startChatWithUser(target);
    if (error) showToast(error, 'error');
    else onStartChat();
  };

  const handleCall = async (target: Profile, type: 'audio' | 'video') => {
    if (isUserBlocked(target.id)) {
      showToast('Cannot call a blocked user.', 'error');
      return;
    }
    await startCall(target, type);
  };

  const handleSendRequest = async (target: Profile) => {
    if (!user) return;
    const { error } = await sendConnectionRequest(user.id, target);
    if (error) showToast(error, 'error');
    else {
      showToast(`Connection request sent to @${target.username}`, 'success');
      loadDirectory();
    }
  };

  const handleRespond = async (req: ConnectionRequest, action: 'accepted' | 'rejected' | 'cancelled') => {
    const { error } = await respondToConnectionRequest(req, action);
    if (error) showToast(error, 'error');
    else {
      showToast(
        action === 'accepted'
          ? 'Connection accepted!'
          : action === 'rejected'
            ? 'Request declined.'
            : 'Request cancelled.',
        'info'
      );
      loadDirectory();
    }
  };

  const handleRemoveContact = async (contactId: string) => {
    if (!user) return;
    await removeContactConnection(user.id, contactId);
    showToast('Contact removed.', 'info');
    loadDirectory();
  };

  const tabs: { id: ContactSubTab; label: string; count?: number }[] = [
    { id: 'contacts', label: 'My Contacts', count: contacts.length },
    { id: 'incoming', label: 'Incoming', count: incoming.length },
    { id: 'sent', label: 'Sent', count: sent.length },
    { id: 'search', label: 'Find Users' },
    { id: 'blocked', label: 'Blocked', count: blockedProfiles.length },
  ];

  return (
    <div style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-app)', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '18px 24px 12px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-card)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Users size={22} color="var(--color-primary)" />
            <h2 style={{ fontFamily: 'var(--font-brand)', fontSize: '1.3rem', fontWeight: 800, margin: 0 }}>
              Contacts &amp; Directory
            </h2>
          </div>
          <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Shield size={13} color="var(--color-success)" />
            Privacy Protected
          </span>
        </div>

        {/* Sub-tabs */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setSubTab(t.id)}
              style={{
                padding: '7px 14px',
                borderRadius: 'var(--radius-full)',
                border: subTab === t.id ? '1px solid var(--color-primary)' : '1px solid var(--border-color)',
                background: subTab === t.id ? 'var(--color-primary-light)' : 'var(--bg-input)',
                color: subTab === t.id ? 'var(--color-primary)' : 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: '0.82rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span>{t.label}</span>
              {typeof t.count === 'number' && t.count > 0 && (
                <span
                  style={{
                    padding: '1px 6px',
                    borderRadius: '999px',
                    background: subTab === t.id ? 'var(--color-primary)' : 'var(--border-color)',
                    color: subTab === t.id ? '#fff' : 'var(--text-primary)',
                    fontSize: '0.72rem',
                  }}
                >
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '18px 24px', maxWidth: '860px', width: '100%', margin: '0 auto' }}>
        {subTab === 'search' && (
          <div style={{ marginBottom: '18px' }}>
            <div style={{ position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="input-field"
                placeholder="Search by exact @username, display name, or GuruChat ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '42px', width: '100%' }}
              />
            </div>
          </div>
        )}

        {isLoading && subTab !== 'search' ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '32px' }}>Loading directory...</p>
        ) : null}

        {/* MY CONTACTS */}
        {subTab === 'contacts' && (
          contacts.length === 0 ? (
            <div className="card" style={{ padding: '32px', textAlign: 'center' }}>
              <Users size={36} color="var(--text-muted)" style={{ marginBottom: '10px' }} />
              <h3 style={{ margin: '0 0 6px' }}>No Contacts Yet</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '14px' }}>
                Find friends by username or GuruChat ID without sharing your phone address book.
              </p>
              <OutlinedButton variant="primary" onClick={() => setSubTab('search')} icon={<UserPlus size={16} />}>
                Find Users
              </OutlinedButton>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {contacts.map((c) => {
                const p = c.profile;
                if (!p) return null;
                return (
                  <div
                    key={c.id}
                    className="card"
                    style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}
                  >
                    <div
                      onClick={() => onViewProfile(p.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', minWidth: 0 }}
                    >
                      <Avatar src={p.avatar_url} name={p.display_name} size="md" isOnline={p.show_online_status} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{p.display_name}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>@{p.username} • {p.user_code}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <OutlinedButton size="sm" variant="primary" onClick={() => handleMessage(p)} icon={<MessageCircle size={14} />}>
                        Chat
                      </OutlinedButton>
                      <OutlinedButton size="sm" variant="secondary" onClick={() => handleCall(p, 'audio')} title="Voice Call" icon={<Phone size={14} />} />
                      <OutlinedButton size="sm" variant="secondary" onClick={() => handleCall(p, 'video')} title="Video Call" icon={<Video size={14} />} />
                      <OutlinedButton size="sm" variant="danger" onClick={() => handleRemoveContact(p.id)} title="Remove Contact" icon={<UserX size={14} />} />
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}

        {/* INCOMING REQUESTS */}
        {subTab === 'incoming' && (
          incoming.length === 0 ? (
            <div className="card" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No incoming connection requests.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {incoming.map((req) => (
                <div key={req.id} className="card" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Avatar src={req.sender?.avatar_url} name={req.sender?.display_name || 'User'} size="md" />
                    <div>
                      <div style={{ fontWeight: 700 }}>{req.sender?.display_name || 'Guru Chat User'}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>@{req.sender?.username}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <OutlinedButton size="sm" variant="primary" onClick={() => handleRespond(req, 'accepted')} icon={<Check size={14} />}>
                      Accept
                    </OutlinedButton>
                    <OutlinedButton size="sm" variant="danger" onClick={() => handleRespond(req, 'rejected')} icon={<X size={14} />}>
                      Reject
                    </OutlinedButton>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* SENT REQUESTS */}
        {subTab === 'sent' && (
          sent.length === 0 ? (
            <div className="card" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No pending sent requests.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {sent.map((req) => (
                <div key={req.id} className="card" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Avatar src={req.receiver?.avatar_url} name={req.receiver?.display_name || 'User'} size="md" />
                    <div>
                      <div style={{ fontWeight: 700 }}>{req.receiver?.display_name || 'User'}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={12} /> Pending approval
                      </div>
                    </div>
                  </div>
                  <OutlinedButton size="sm" variant="secondary" onClick={() => handleRespond(req, 'cancelled')} icon={<X size={14} />}>
                    Cancel
                  </OutlinedButton>
                </div>
              ))}
            </div>
          )
        )}

        {/* SEARCH USERS */}
        {subTab === 'search' && (
          searchResults.length === 0 ? (
            <div className="card" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
              {searchQuery.trim() ? 'No matching users found (respecting user privacy settings).' : 'Type a username, display name, or GuruChat ID above.'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {searchResults.map((p) => {
                const alreadyContact = contacts.some((c) => c.contact_id === p.id);
                const blocked = isUserBlocked(p.id);
                return (
                  <div key={p.id} className="card" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div onClick={() => onViewProfile(p.id)} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                      <Avatar src={p.who_can_see_avatar === 'nobody' ? null : p.avatar_url} name={p.display_name} size="md" />
                      <div>
                        <div style={{ fontWeight: 700 }}>{p.display_name}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>@{p.username} • {p.user_code}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {blocked ? (
                        <span style={{ fontSize: '0.78rem', color: 'var(--color-danger)', fontWeight: 600 }}>Blocked</span>
                      ) : alreadyContact ? (
                        <OutlinedButton size="sm" variant="primary" onClick={() => handleMessage(p)} icon={<UserCheck size={14} />}>
                          Message
                        </OutlinedButton>
                      ) : (
                        <>
                          <OutlinedButton size="sm" variant="secondary" onClick={() => handleSendRequest(p)} icon={<UserPlus size={14} />}>
                            Connect
                          </OutlinedButton>
                          <OutlinedButton size="sm" variant="primary" onClick={() => handleMessage(p)} icon={<MessageCircle size={14} />}>
                            Chat
                          </OutlinedButton>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}

        {/* BLOCKED USERS */}
        {subTab === 'blocked' && (
          blockedProfiles.length === 0 ? (
            <div className="card" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Ban size={30} style={{ marginBottom: '8px' }} />
              <div>No blocked users.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {blockedProfiles.map((b) => (
                <div key={b.id} className="card" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Avatar src={b.avatar_url} name={b.display_name} size="md" />
                    <div>
                      <div style={{ fontWeight: 700 }}>{b.display_name}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>@{b.username}</div>
                    </div>
                  </div>
                  <OutlinedButton
                    size="sm"
                    variant="danger"
                    onClick={async () => {
                      await unblockUser(b.id);
                      showToast(`Unblocked @${b.username}`, 'success');
                      loadDirectory();
                    }}
                  >
                    Unblock
                  </OutlinedButton>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
};

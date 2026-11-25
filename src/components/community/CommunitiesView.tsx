import React, { useState } from 'react';
import {
  Users,
  Search,
  Plus,
  ShieldCheck,
  Check,
  ArrowRight,
  MessageSquare,
  Lock,
  Globe,
} from 'lucide-react';
import type { Community } from '../../types';
import { OutlinedButton } from '../common/OutlinedButton';
import { Modal } from '../common/Modal';
import { useToast } from '../common/Toast';
import { useChat } from '../../context/ChatContext';
import { triggerHaptics } from '../../lib/utils';

const INITIAL_COMMUNITIES: Community[] = [
  {
    id: 'comm-1',
    name: 'GuruChat Creators & Developers',
    description: 'Official community for developers, engineers, and creators building on GuruChat & webguruji.online ecosystem.',
    avatar_url: null,
    creator_id: 'hg-official',
    is_private: false,
    member_count: 1240,
    groups_count: 4,
    created_at: '2026-01-10T00:00:00Z',
    is_joined: true,
    groups: [
      { id: 'g1', name: '📢 Official Announcements', member_count: 1240 },
      { id: 'g2', name: '💬 General Tech Discussion', member_count: 890 },
      { id: 'g3', name: '⚡ WebRTC & Realtime Hub', member_count: 530 },
      { id: 'g4', name: '🛠️ Bug Reports & Feedback', member_count: 410 },
    ],
  },
  {
    id: 'comm-2',
    name: 'AI Innovations & Learning',
    description: 'Explore generative AI models, prompt engineering, agentic systems, and practical artificial intelligence tools.',
    avatar_url: null,
    creator_id: 'ai-lead',
    is_private: false,
    member_count: 3820,
    groups_count: 3,
    created_at: '2026-02-01T00:00:00Z',
    is_joined: false,
    groups: [
      { id: 'g5', name: '🤖 Daily AI Insights', member_count: 3820 },
      { id: 'g6', name: '💡 Prompt Sharing & Tips', member_count: 2150 },
      { id: 'g7', name: '📚 Research Papers & Tutorials', member_count: 1640 },
    ],
  },
  {
    id: 'comm-3',
    name: 'Study & Exam Aspirants Club',
    description: 'Dedicated study groups for technology students, competitive exams, coding challenges, and daily focus sessions.',
    avatar_url: null,
    creator_id: 'study-guru',
    is_private: false,
    member_count: 5410,
    groups_count: 4,
    created_at: '2026-01-20T00:00:00Z',
    is_joined: false,
    groups: [
      { id: 'g8', name: '🎯 Daily Goals & Check-ins', member_count: 5410 },
      { id: 'g9', name: '💻 Computer Science & Coding', member_count: 3200 },
      { id: 'g10', name: '📖 Notes & Study Resources', member_count: 4100 },
      { id: 'g11', name: '☕ Late Night Study Lounge', member_count: 1890 },
    ],
  },
  {
    id: 'comm-4',
    name: 'HarshGuruJi Daily Motivation & Lifestyle',
    description: 'Daily inspirational thoughts, life wisdom, habit mastery, and positive discussions by HarshGuruJi.',
    avatar_url: null,
    creator_id: 'harshguruji-official',
    is_private: false,
    member_count: 8920,
    groups_count: 2,
    created_at: '2026-01-01T00:00:00Z',
    is_joined: true,
    groups: [
      { id: 'g12', name: '🌅 Morning Mindset & Quotes', member_count: 8920 },
      { id: 'g13', name: '🧘 Healthy Living & Habits', member_count: 4210 },
    ],
  },
];

export const CommunitiesView: React.FC = () => {
  const { showToast } = useToast();
  const { createGroup } = useChat();

  const [communities, setCommunities] = useState<Community[]>(() => {
    try {
      const stored = localStorage.getItem('guruchat_communities_v1');
      return stored ? JSON.parse(stored) : INITIAL_COMMUNITIES;
    } catch {
      return INITIAL_COMMUNITIES;
    }
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'joined'>('all');
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New community form state
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newIsPrivate, setNewIsPrivate] = useState(false);

  const saveCommunities = (updated: Community[]) => {
    setCommunities(updated);
    try {
      localStorage.setItem('guruchat_communities_v1', JSON.stringify(updated));
    } catch {}
  };

  const handleToggleJoin = (commId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    triggerHaptics(15);
    const updated = communities.map((c) => {
      if (c.id === commId) {
        const nextJoined = !c.is_joined;
        showToast(
          nextJoined ? `Joined "${c.name}"!` : `Left "${c.name}"`,
          nextJoined ? 'success' : 'info'
        );
        return {
          ...c,
          is_joined: nextJoined,
          member_count: nextJoined ? c.member_count + 1 : Math.max(1, c.member_count - 1),
        };
      }
      return c;
    });
    saveCommunities(updated);
    if (selectedCommunity?.id === commId) {
      setSelectedCommunity(updated.find((c) => c.id === commId) || null);
    }
  };

  const handleCreateCommunity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      showToast('Please enter a community name.', 'error');
      return;
    }

    const newComm: Community = {
      id: `comm-${Date.now()}`,
      name: newTitle.trim(),
      description: newDesc.trim() || 'A new community on GuruChat.',
      avatar_url: null,
      creator_id: 'me',
      is_private: newIsPrivate,
      member_count: 1,
      groups_count: 1,
      created_at: new Date().toISOString(),
      is_joined: true,
      groups: [{ id: `g-${Date.now()}`, name: '💬 General Discussion', member_count: 1 }],
    };

    saveCommunities([newComm, ...communities]);
    setShowCreateModal(false);
    setNewTitle('');
    setNewDesc('');
    setNewIsPrivate(false);
    showToast(`Community "${newComm.name}" created!`, 'success');
  };

  const handleEnterGroup = async (groupName: string) => {
    showToast(`Entering ${groupName}...`, 'info');
    // Create or select conversation for this group
    await createGroup(`${selectedCommunity?.name}: ${groupName}`, null, []);
    setSelectedCommunity(null);
  };

  const filtered = communities.filter((c) => {
    if (activeTab === 'joined' && !c.is_joined) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q);
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-app)', overflowY: 'auto' }}>
      {/* Header */}
      <div
        style={{
          padding: '24px 20px 16px',
          background: 'var(--bg-card)',
          borderBottom: '1px solid var(--border-color)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={24} color="var(--color-primary)" />
              Communities
            </h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
              Connect with multiple topic groups under shared interest communities
            </p>
          </div>
          <OutlinedButton variant="primary" size="sm" onClick={() => setShowCreateModal(true)}>
            <Plus size={15} style={{ marginRight: '4px' }} /> Create
          </OutlinedButton>
        </div>

        {/* Search & Tabs */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search communities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px 9px 36px',
                borderRadius: '10px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-input)',
                color: 'var(--text-primary)',
                fontSize: '0.88rem',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={() => setActiveTab('all')}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
                background: activeTab === 'all' ? 'var(--color-primary)' : 'var(--bg-secondary)',
                color: activeTab === 'all' ? '#fff' : 'var(--text-secondary)',
              }}
            >
              Explore
            </button>
            <button
              onClick={() => setActiveTab('joined')}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
                background: activeTab === 'joined' ? 'var(--color-primary)' : 'var(--bg-secondary)',
                color: activeTab === 'joined' ? '#fff' : 'var(--text-secondary)',
              }}
            >
              Joined
            </button>
          </div>
        </div>
      </div>

      {/* Communities Grid */}
      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '800px', width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Users size={48} style={{ opacity: 0.3, marginBottom: '12px' }} />
            <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.1rem' }}>No communities found</h3>
            <p style={{ fontSize: '0.88rem', marginTop: '6px' }}>
              {activeTab === 'joined' ? 'You have not joined any community yet.' : 'Try a different search query or create your own.'}
            </p>
          </div>
        ) : (
          filtered.map((comm) => (
            <div
              key={comm.id}
              onClick={() => setSelectedCommunity(comm)}
              className="card"
              style={{
                padding: '18px 20px',
                borderRadius: '16px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '14px',
                      background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontSize: '1.2rem',
                      fontWeight: 800,
                      flexShrink: 0,
                      boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
                    }}
                  >
                    {comm.name.charAt(0)}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {comm.name}
                      </h3>
                      {comm.is_private ? (
                        <span title="Private" style={{ display: 'inline-flex', alignItems: 'center' }}>
                          <Lock size={14} color="var(--text-muted)" />
                        </span>
                      ) : (
                        <span title="Public Community" style={{ display: 'inline-flex', alignItems: 'center' }}>
                          <Globe size={14} color="var(--color-primary)" />
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {comm.member_count.toLocaleString()} members • {comm.groups_count} groups
                    </span>
                  </div>
                </div>

                <OutlinedButton
                  size="sm"
                  variant={comm.is_joined ? 'secondary' : 'primary'}
                  onClick={(e) => handleToggleJoin(comm.id, e)}
                  style={{ minWidth: '84px' }}
                >
                  {comm.is_joined ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Check size={14} color="var(--color-success)" /> Joined
                    </span>
                  ) : (
                    'Join'
                  )}
                </OutlinedButton>
              </div>

              <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {comm.description}
              </p>

              {/* Sub-groups badges */}
              {comm.groups && comm.groups.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', paddingTop: '6px', borderTop: '1px solid var(--border-color)' }}>
                  {comm.groups.slice(0, 3).map((grp) => (
                    <span
                      key={grp.id}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '20px',
                        background: 'var(--bg-secondary)',
                        fontSize: '0.75rem',
                        color: 'var(--text-secondary)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <MessageSquare size={11} color="var(--color-primary)" />
                      {grp.name}
                    </span>
                  ))}
                  {comm.groups.length > 3 && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', alignSelf: 'center' }}>
                      +{comm.groups.length - 3} more
                    </span>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Community Detail Modal */}
      {selectedCommunity && (
        <Modal
          isOpen={Boolean(selectedCommunity)}
          onClose={() => setSelectedCommunity(null)}
          title={selectedCommunity.name}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ margin: 0, fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {selectedCommunity.description}
            </p>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '10px 14px', background: 'var(--bg-card)', borderRadius: '10px' }}>
              <ShieldCheck size={20} color="var(--color-primary)" />
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Created under <strong>HarshGuruJi Ecosystem</strong> • Verified Safe Community
              </div>
            </div>

            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0 0 10px', color: 'var(--text-primary)' }}>
                Groups in this Community
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {selectedCommunity.groups?.map((grp) => (
                  <div
                    key={grp.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    <div>
                      <span style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {grp.name}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {grp.member_count.toLocaleString()} members
                      </span>
                    </div>

                    <OutlinedButton
                      size="sm"
                      variant="primary"
                      onClick={() => handleEnterGroup(grp.name)}
                    >
                      <ArrowRight size={14} style={{ marginRight: '4px' }} /> Enter
                    </OutlinedButton>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <OutlinedButton
                variant={selectedCommunity.is_joined ? 'secondary' : 'primary'}
                onClick={() => handleToggleJoin(selectedCommunity.id)}
              >
                {selectedCommunity.is_joined ? 'Leave Community' : 'Join Community'}
              </OutlinedButton>
              <OutlinedButton variant="secondary" onClick={() => setSelectedCommunity(null)}>
                Close
              </OutlinedButton>
            </div>
          </div>
        </Modal>
      )}

      {/* Create Community Modal */}
      {showCreateModal && (
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Create New Community"
        >
          <form onSubmit={handleCreateCommunity} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Community Name *
              </label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Flutter & Mobile Masters"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-input)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Description
              </label>
              <textarea
                rows={3}
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="What is this community about?"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-input)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.88rem', color: 'var(--text-primary)' }}>
              <input
                type="checkbox"
                checked={newIsPrivate}
                onChange={(e) => setNewIsPrivate(e.target.checked)}
              />
              Make this a Private Community (Invite-only)
            </label>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <OutlinedButton variant="secondary" onClick={() => setShowCreateModal(false)} type="button">
                Cancel
              </OutlinedButton>
              <OutlinedButton variant="primary" type="submit">
                Create Community
              </OutlinedButton>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

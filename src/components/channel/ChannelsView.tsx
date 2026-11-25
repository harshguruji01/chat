import React, { useState } from 'react';
import {
  Radio,
  Search,
  Plus,
  Check,
  Eye,
  Heart,
  Share2,
  Pin,
  ShieldCheck,
} from 'lucide-react';
import type { Channel, ChannelPost } from '../../types';
import { OutlinedButton } from '../common/OutlinedButton';
import { Modal } from '../common/Modal';
import { useToast } from '../common/Toast';
import { triggerHaptics, copyToClipboard } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';

const INITIAL_CHANNELS: Channel[] = [
  {
    id: 'ch-1',
    title: 'GuruChat Official Updates',
    handle: '@guruchatofficial',
    description: 'Product changelogs, new feature announcements, roadmap updates, and tips for GuruChat users.',
    avatar_url: null,
    banner_url: null,
    subscribers_count: 14500,
    is_verified: true,
    creator_name: 'HarshGuruJi',
    created_at: '2026-01-01T00:00:00Z',
    is_subscribed: true,
    pinned_announcement: '🚀 GuruChat 2.0 is live! Featuring advanced real-time messaging, document sharing, voice notes, and platform policy controls.',
    posts: [
      {
        id: 'cp-1',
        channel_id: 'ch-1',
        title: 'Welcome to GuruChat 2.0',
        content: 'We are thrilled to launch GuruChat 2.0 developed by HarshGuruJi! Enjoy lightning-fast chat, seamless Web + Android sync, rich media compression, and end-to-end privacy controls.',
        views_count: 8200,
        likes_count: 1240,
        created_at: '2026-02-15T10:00:00Z',
      },
      {
        id: 'cp-2',
        channel_id: 'ch-1',
        title: 'New: Safe Link Previews & Document Sharing',
        content: 'You can now share PDFs, documents, sheets, and safe link previews directly inside private and group chats with zero code execution risk.',
        views_count: 5400,
        likes_count: 890,
        created_at: '2026-02-20T14:30:00Z',
      },
    ],
  },
  {
    id: 'ch-2',
    title: 'HarshGuruJi Tech & AI Digest',
    handle: '@harshguruji_tech',
    description: 'Curated technology news, artificial intelligence breakthroughs, coding hacks, and web development resources.',
    avatar_url: null,
    banner_url: null,
    subscribers_count: 9820,
    is_verified: true,
    creator_name: 'HarshGuruJi',
    created_at: '2026-01-15T00:00:00Z',
    is_subscribed: true,
    pinned_announcement: '⚡ Explore our official web portals at https://webguruji.online and https://guruchat.webguruji.online',
    posts: [
      {
        id: 'cp-3',
        channel_id: 'ch-2',
        title: 'The Future of Real-Time Social Messaging',
        content: 'Building low-latency apps requires truthful delivery states, instant optimistic feedback, and strong fallback synchronization for offline resilience.',
        views_count: 6100,
        likes_count: 940,
        created_at: '2026-02-18T08:00:00Z',
      },
    ],
  },
  {
    id: 'ch-3',
    title: 'Daily Motivation & Mindset',
    handle: '@daily_guru_quotes',
    description: 'Wake up with clarity, purpose, and focus. Handpicked motivational quotes and life lessons every morning.',
    avatar_url: null,
    banner_url: null,
    subscribers_count: 22400,
    is_verified: true,
    creator_name: 'HarshGuruJi',
    created_at: '2026-01-05T00:00:00Z',
    is_subscribed: false,
    pinned_announcement: '🌅 "Small daily disciplines repeated consistently lead to monumental success."',
    posts: [
      {
        id: 'cp-4',
        channel_id: 'ch-3',
        title: 'The Power of Focus',
        content: 'जब आप अपने लक्ष्य पर अटूट ध्यान केंद्रित करते हैं, तो कोई भी रुकावट आपको रोक नहीं सकती। आज का दिन आपके सपनों को समर्पित करें।',
        views_count: 15300,
        likes_count: 3200,
        created_at: '2026-02-22T06:00:00Z',
      },
    ],
  },
];

export const ChannelsView: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [channels, setChannels] = useState<Channel[]>(() => {
    try {
      const stored = localStorage.getItem('guruchat_channels_v1');
      return stored ? JSON.parse(stored) : INITIAL_CHANNELS;
    } catch {
      return INITIAL_CHANNELS;
    }
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showNewPostModal, setShowNewPostModal] = useState(false);

  // New channel state
  const [newTitle, setNewTitle] = useState('');
  const [newHandle, setNewHandle] = useState('');
  const [newDesc, setNewDesc] = useState('');

  // New post state
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');

  const saveChannels = (updated: Channel[]) => {
    setChannels(updated);
    try {
      localStorage.setItem('guruchat_channels_v1', JSON.stringify(updated));
    } catch {}
  };

  const handleToggleSubscribe = (chId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    triggerHaptics(15);
    const updated = channels.map((c) => {
      if (c.id === chId) {
        const nextSub = !c.is_subscribed;
        showToast(
          nextSub ? `Subscribed to ${c.title}!` : `Unsubscribed from ${c.title}`,
          nextSub ? 'success' : 'info'
        );
        return {
          ...c,
          is_subscribed: nextSub,
          subscribers_count: nextSub ? c.subscribers_count + 1 : Math.max(1, c.subscribers_count - 1),
        };
      }
      return c;
    });
    saveChannels(updated);
    if (selectedChannel?.id === chId) {
      setSelectedChannel(updated.find((c) => c.id === chId) || null);
    }
  };

  const handleCreateChannel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      showToast('Channel title is required.', 'error');
      return;
    }

    const cleanHandle = (newHandle.trim().startsWith('@') ? newHandle.trim() : `@${newHandle.trim()}`).toLowerCase();
    const newCh: Channel = {
      id: `ch-${Date.now()}`,
      title: newTitle.trim(),
      handle: cleanHandle || `@channel_${Date.now().toString().slice(-4)}`,
      description: newDesc.trim() || 'A new public channel on GuruChat.',
      avatar_url: null,
      banner_url: null,
      subscribers_count: 1,
      is_verified: false,
      creator_name: user?.email?.split('@')[0] || 'Member',
      created_at: new Date().toISOString(),
      is_subscribed: true,
      posts: [],
    };

    saveChannels([newCh, ...channels]);
    setShowCreateModal(false);
    setNewTitle('');
    setNewHandle('');
    setNewDesc('');
    showToast(`Channel "${newCh.title}" created successfully!`, 'success');
  };

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChannel || !newPostContent.trim()) {
      showToast('Post content is required.', 'error');
      return;
    }

    const newPost: ChannelPost = {
      id: `cp-${Date.now()}`,
      channel_id: selectedChannel.id,
      title: newPostTitle.trim() || undefined,
      content: newPostContent.trim(),
      views_count: 1,
      likes_count: 0,
      created_at: new Date().toISOString(),
    };

    const updated = channels.map((c) => {
      if (c.id === selectedChannel.id) {
        return { ...c, posts: [newPost, ...(c.posts || [])] };
      }
      return c;
    });

    saveChannels(updated);
    setSelectedChannel(updated.find((c) => c.id === selectedChannel.id) || null);
    setShowNewPostModal(false);
    setNewPostTitle('');
    setNewPostContent('');
    showToast('Post published to channel!', 'success');
  };

  const handleSharePost = async (post: ChannelPost) => {
    await copyToClipboard(`${post.title ? post.title + '\n' : ''}${post.content}\n\nVia ${selectedChannel?.title || 'GuruChat Channel'} https://guruchat.webguruji.online`);
    showToast('Channel post link copied to clipboard!', 'success');
  };

  const filtered = channels.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return c.title.toLowerCase().includes(q) || c.handle.toLowerCase().includes(q) || c.description.toLowerCase().includes(q);
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
              <Radio size={24} color="var(--color-primary)" />
              Channels
            </h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
              Follow public channels for official updates, news, and knowledge
            </p>
          </div>
          <OutlinedButton variant="primary" size="sm" onClick={() => setShowCreateModal(true)}>
            <Plus size={15} style={{ marginRight: '4px' }} /> Create Channel
          </OutlinedButton>
        </div>

        {/* Search */}
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search channels..."
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
      </div>

      {/* Main Channel Layout */}
      {selectedChannel ? (
        <div style={{ padding: '20px', maxWidth: '780px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Back button */}
          <button
            onClick={() => setSelectedChannel(null)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-primary)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.9rem',
              fontWeight: 600,
              padding: 0,
            }}
          >
            ← Back to all channels
          </button>

          {/* Channel Banner Box */}
          <div className="card" style={{ padding: '20px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    width: '54px',
                    height: '54px',
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, #EC4899 0%, #8B5CF6 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: '1.4rem',
                    fontWeight: 800,
                  }}
                >
                  {selectedChannel.title.charAt(0)}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {selectedChannel.title}
                    </h2>
                    {selectedChannel.is_verified && (
                      <span title="Verified Channel" style={{ display: 'inline-flex', alignItems: 'center' }}>
                        <ShieldCheck size={18} color="var(--color-primary)" />
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {selectedChannel.handle} • {selectedChannel.subscribers_count.toLocaleString()} subscribers
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <OutlinedButton
                  variant={selectedChannel.is_subscribed ? 'secondary' : 'primary'}
                  onClick={() => handleToggleSubscribe(selectedChannel.id)}
                >
                  {selectedChannel.is_subscribed ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Check size={14} color="var(--color-success)" /> Subscribed
                    </span>
                  ) : (
                    'Subscribe'
                  )}
                </OutlinedButton>
                <OutlinedButton variant="secondary" onClick={() => setShowNewPostModal(true)}>
                  <Plus size={14} style={{ marginRight: '4px' }} /> Post
                </OutlinedButton>
              </div>
            </div>

            <p style={{ margin: '14px 0 0', fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {selectedChannel.description}
            </p>

            {selectedChannel.pinned_announcement && (
              <div
                style={{
                  marginTop: '14px',
                  padding: '10px 14px',
                  background: 'rgba(56, 189, 248, 0.08)',
                  borderLeft: '4px solid var(--color-primary)',
                  borderRadius: '8px',
                  fontSize: '0.86rem',
                  color: 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                }}
              >
                <Pin size={16} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{selectedChannel.pinned_announcement}</span>
              </div>
            )}
          </div>

          {/* Channel Feed Posts */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '8px 0 0', color: 'var(--text-primary)' }}>
              Latest Updates ({selectedChannel.posts?.length || 0})
            </h3>

            {(!selectedChannel.posts || selectedChannel.posts.length === 0) ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No announcements posted in this channel yet.
              </div>
            ) : (
              selectedChannel.posts.map((post) => (
                <div key={post.id} className="card" style={{ padding: '16px 18px', borderRadius: '14px' }}>
                  {post.title && (
                    <h4 style={{ margin: '0 0 8px', fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {post.title}
                    </h4>
                  )}
                  <p style={{ margin: 0, fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                    {post.content}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '14px', paddingTop: '10px', borderTop: '1px solid var(--border-color)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Eye size={13} /> {post.views_count.toLocaleString()} views
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Heart size={13} color="#EC4899" /> {post.likes_count.toLocaleString()}
                      </span>
                    </div>

                    <button
                      onClick={() => handleSharePost(post)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--color-primary)',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                      }}
                    >
                      <Share2 size={13} /> Share
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        /* Channel Directory List */
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '800px', width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
          {filtered.map((ch) => (
            <div
              key={ch.id}
              onClick={() => setSelectedChannel(ch)}
              className="card"
              style={{
                padding: '16px 20px',
                borderRadius: '16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '14px',
                transition: 'transform 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '14px',
                    background: 'linear-gradient(135deg, #EC4899 0%, #8B5CF6 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: '1.2rem',
                    fontWeight: 800,
                    flexShrink: 0,
                  }}
                >
                  {ch.title.charAt(0)}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {ch.title}
                    </h3>
                    {ch.is_verified && <ShieldCheck size={16} color="var(--color-primary)" />}
                  </div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {ch.handle} • {ch.subscribers_count.toLocaleString()} subscribers
                  </span>
                  <p style={{ margin: '4px 0 0', fontSize: '0.84rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {ch.description}
                  </p>
                </div>
              </div>

              <OutlinedButton
                size="sm"
                variant={ch.is_subscribed ? 'secondary' : 'primary'}
                onClick={(e) => handleToggleSubscribe(ch.id, e)}
                style={{ minWidth: '92px', flexShrink: 0 }}
              >
                {ch.is_subscribed ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Check size={14} color="var(--color-success)" /> Subscribed
                  </span>
                ) : (
                  'Subscribe'
                )}
              </OutlinedButton>
            </div>
          ))}
        </div>
      )}

      {/* Create Channel Modal */}
      {showCreateModal && (
        <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create Channel">
          <form onSubmit={handleCreateChannel} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Channel Title *
              </label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Daily Tech Insights"
                style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Handle
              </label>
              <input
                type="text"
                value={newHandle}
                onChange={(e) => setNewHandle(e.target.value)}
                placeholder="e.g. @dailytech"
                style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }}
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
                placeholder="Describe what your subscribers will receive..."
                style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <OutlinedButton variant="secondary" onClick={() => setShowCreateModal(false)} type="button">
                Cancel
              </OutlinedButton>
              <OutlinedButton variant="primary" type="submit">
                Create Channel
              </OutlinedButton>
            </div>
          </form>
        </Modal>
      )}

      {/* New Post Modal */}
      {showNewPostModal && selectedChannel && (
        <Modal isOpen={showNewPostModal} onClose={() => setShowNewPostModal(false)} title={`Post to ${selectedChannel.title}`}>
          <form onSubmit={handleCreatePost} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Headline / Title (Optional)
              </label>
              <input
                type="text"
                value={newPostTitle}
                onChange={(e) => setNewPostTitle(e.target.value)}
                placeholder="e.g. Major Announcement!"
                style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Post Message *
              </label>
              <textarea
                rows={4}
                required
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                placeholder="Share news, updates or links with your subscribers..."
                style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <OutlinedButton variant="secondary" onClick={() => setShowNewPostModal(false)} type="button">
                Cancel
              </OutlinedButton>
              <OutlinedButton variant="primary" type="submit">
                Publish Post
              </OutlinedButton>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

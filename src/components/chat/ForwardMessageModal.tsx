import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { OutlinedButton } from '../common/OutlinedButton';
import { Avatar } from '../common/Avatar';
import { Search, Send, Check } from 'lucide-react';
import type { Message, Conversation } from '../../types';
import { useChat } from '../../context/ChatContext';
import { useToast } from '../common/Toast';

interface ForwardMessageModalProps {
  isOpen: boolean;
  message: Message | null;
  onClose: () => void;
}

export const ForwardMessageModal: React.FC<ForwardMessageModalProps> = ({
  isOpen,
  message,
  onClose,
}) => {
  const { conversations, forwardMessage } = useChat();
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [forwardingIds, setForwardingIds] = useState<Record<string, boolean>>({});
  const [forwardedIds, setForwardedIds] = useState<Record<string, boolean>>({});

  if (!isOpen || !message) return null;

  const filteredConversations = conversations.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    if (c.is_group) {
      return (c.title || '').toLowerCase().includes(q);
    }
    const other = c.other_member;
    return (
      (other?.display_name || '').toLowerCase().includes(q) ||
      (other?.username || '').toLowerCase().includes(q) ||
      (other?.user_code || '').toLowerCase().includes(q)
    );
  });

  const handleForwardTo = async (conv: Conversation) => {
    setForwardingIds((prev) => ({ ...prev, [conv.id]: true }));
    const res = await forwardMessage(message, conv.id);
    setForwardingIds((prev) => ({ ...prev, [conv.id]: false }));

    if (res.error) {
      showToast(res.error, 'error');
    } else {
      setForwardedIds((prev) => ({ ...prev, [conv.id]: true }));
      showToast(`Message forwarded to ${conv.is_group ? conv.title : conv.other_member?.display_name || 'chat'}!`, 'success');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Forward Message">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '480px' }}>
        {/* Search bar */}
        <div style={{ position: 'relative' }}>
          <Search
            size={16}
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
          />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px 10px 36px',
              borderRadius: '10px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-input, rgba(255,255,255,0.05))',
              color: 'var(--text-primary)',
              fontSize: '0.9rem',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Message preview snippet */}
        <div
          style={{
            padding: '8px 12px',
            borderRadius: '8px',
            background: 'var(--bg-secondary, rgba(255,255,255,0.04))',
            borderLeft: '3px solid var(--color-primary)',
            fontSize: '0.85rem',
            color: 'var(--text-secondary)',
            maxHeight: '60px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          <strong>Forwarding:</strong>{' '}
          {message.content || (message.type === 'image' ? '📷 Photo' : message.type === 'voice' ? '🎤 Voice note' : message.type === 'video' ? '📹 Video' : message.type === 'document' ? `📄 ${message.file_name || 'Document'}` : 'Attachment')}
        </div>

        {/* Conversations list */}
        <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '280px' }}>
          {filteredConversations.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              No chats found.
            </div>
          ) : (
            filteredConversations.map((c) => {
              const title = c.is_group ? c.title || 'Group Chat' : c.other_member?.display_name || c.other_member?.username || 'Member';
              const avatar = c.is_group ? c.avatar_url : c.other_member?.avatar_url;
              const isSent = forwardedIds[c.id];
              const isSending = forwardingIds[c.id];

              return (
                <div
                  key={c.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: '10px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                    <Avatar src={avatar} name={title} size="md" />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {title}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {c.is_group ? 'Group' : `@${c.other_member?.username || ''}`}
                      </span>
                    </div>
                  </div>

                  <OutlinedButton
                    size="sm"
                    variant={isSent ? 'secondary' : 'primary'}
                    disabled={isSent || isSending}
                    onClick={() => handleForwardTo(c)}
                    style={{ minWidth: '78px' }}
                  >
                    {isSent ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Check size={14} color="var(--color-success)" /> Sent
                      </span>
                    ) : isSending ? (
                      'Sending...'
                    ) : (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Send size={13} /> Send
                      </span>
                    )}
                  </OutlinedButton>
                </div>
              );
            })
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
          <OutlinedButton variant="secondary" onClick={onClose}>
            Done
          </OutlinedButton>
        </div>
      </div>
    </Modal>
  );
};

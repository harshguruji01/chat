import React, { useState } from 'react';
import { Image as ImageIcon, Video, FileText, Download, ExternalLink } from 'lucide-react';
import { Modal } from '../common/Modal';
import type { Message } from '../../types';

interface MediaGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  messages: Message[];
  conversationTitle?: string;
}

export const MediaGalleryModal: React.FC<MediaGalleryModalProps> = ({
  isOpen,
  onClose,
  messages,
  conversationTitle,
}) => {
  const [filter, setFilter] = useState<'all' | 'image' | 'video' | 'document'>('all');

  const mediaItems = messages.filter((m) => {
    if (m.deleted_for_everyone || !m.media_url) return false;
    if (filter === 'all') return ['image', 'video', 'document'].includes(m.type);
    return m.type === filter;
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Media Gallery${conversationTitle ? ` — ${conversationTitle}` : ''}`} maxWidth="680px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {(['all', 'image', 'video', 'document'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                border: filter === tab ? '1px solid var(--color-primary)' : '1px solid var(--border-color)',
                background: filter === tab ? 'var(--color-primary-light)' : 'var(--bg-input)',
                color: filter === tab ? 'var(--color-primary)' : 'var(--text-secondary)',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {tab === 'all' ? 'All Media' : `${tab}s`}
            </button>
          ))}
        </div>

        {mediaItems.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No shared media found in this conversation.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '12px', maxHeight: '420px', overflowY: 'auto' }}>
            {mediaItems.map((m) => (
              <div
                key={m.id}
                style={{
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-input)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {m.type === 'image' && m.media_url ? (
                  <img
                    src={m.media_url}
                    alt={m.file_name || 'Shared photo'}
                    style={{ width: '100%', height: '120px', objectFit: 'cover' }}
                  />
                ) : m.type === 'video' && m.media_url ? (
                  <div style={{ height: '120px', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                    <Video size={28} color="#38BDF8" />
                  </div>
                ) : (
                  <div style={{ height: '120px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px' }}>
                    <FileText size={28} color="var(--color-primary)" />
                    <span style={{ fontSize: '0.75rem', textAlign: 'center', wordBreak: 'break-all' }}>
                      {m.file_name || 'Document'}
                    </span>
                  </div>
                )}

                <div style={{ padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.74rem', borderTop: '1px solid var(--border-color)' }}>
                  <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {m.type === 'image' ? <ImageIcon size={12} /> : m.type === 'video' ? <Video size={12} /> : <FileText size={12} />}
                    {new Date(m.created_at).toLocaleDateString()}
                  </span>
                  {m.media_url && (
                    <a
                      href={m.media_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: 'var(--color-primary)', display: 'inline-flex', alignItems: 'center', gap: '3px', textDecoration: 'none', fontWeight: 600 }}
                    >
                      {m.type === 'document' ? <Download size={12} /> : <ExternalLink size={12} />}
                      Open
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
};

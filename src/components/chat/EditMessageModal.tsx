import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { OutlinedButton } from '../common/OutlinedButton';
import type { Message } from '../../types';
import { useChat } from '../../context/ChatContext';
import { useToast } from '../common/Toast';

interface EditMessageModalProps {
  isOpen: boolean;
  message: Message | null;
  onClose: () => void;
}

export const EditMessageModal: React.FC<EditMessageModalProps> = ({
  isOpen,
  message,
  onClose,
}) => {
  const { editMessage } = useChat();
  const { showToast } = useToast();
  const [newContent, setNewContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (message) {
      setNewContent(message.content || '');
    }
  }, [message]);

  if (!isOpen || !message) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) {
      showToast('Message cannot be empty.', 'error');
      return;
    }
    if (newContent.trim() === message.content.trim()) {
      onClose();
      return;
    }

    setIsSubmitting(true);
    const res = await editMessage(message.id, newContent.trim());
    setIsSubmitting(false);

    if (res.error) {
      showToast(res.error, 'error');
    } else {
      showToast('Message edited successfully.', 'success');
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Message">
      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label
            style={{
              display: 'block',
              fontSize: '0.85rem',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              marginBottom: '8px',
            }}
          >
            Edit your message
          </label>
          <textarea
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            rows={4}
            maxLength={2000}
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: '12px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-input, rgba(255,255,255,0.05))',
              color: 'var(--text-primary)',
              fontSize: '0.95rem',
              resize: 'vertical',
              outline: 'none',
              fontFamily: 'inherit',
              boxSizing: 'border-box',
            }}
            placeholder="Type your message..."
            autoFocus
          />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '4px', textAlign: 'right' }}>
            {newContent.length} / 2000
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <OutlinedButton variant="secondary" onClick={onClose} type="button">
            Cancel
          </OutlinedButton>
          <OutlinedButton variant="primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </OutlinedButton>
        </div>
      </form>
    </Modal>
  );
};

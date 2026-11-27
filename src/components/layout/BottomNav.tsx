import React from 'react';
import { MessageSquare, Users, Phone, Bell, User, Crown } from 'lucide-react';
import type { TabType } from '../../types';
import { useChat } from '../../context/ChatContext';
import { useLanguage } from '../../context/LanguageContext';
import { usePremium } from '../../context/PremiumContext';

interface BottomNavProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onSelectTab }) => {
  const { conversations } = useChat();
  const { t } = useLanguage();
  const { isPremium } = usePremium();

  const totalUnread = conversations.reduce((acc, c) => acc + (c.unread_count || 0), 0);

  return (
    <nav className="bottom-nav">
      {/* 1. Chats */}
      <button
        className={`bottom-nav-item ${activeTab === 'chat' ? 'active' : ''}`}
        onClick={() => onSelectTab('chat')}
        title={t('chats')}
      >
        <div style={{ position: 'relative', display: 'inline-flex' }}>
          <MessageSquare size={21} />
          {totalUnread > 0 && <span className="bottom-nav-badge">{totalUnread}</span>}
        </div>
        <span>{t('chats')}</span>
      </button>

      {/* 2. Contacts */}
      <button
        className={`bottom-nav-item ${activeTab === 'contacts' ? 'active' : ''}`}
        onClick={() => onSelectTab('contacts')}
        title="Contacts"
      >
        <Users size={21} />
        <span>Contacts</span>
      </button>

      {/* 3. Calls */}
      <button
        className={`bottom-nav-item ${activeTab === 'calls' ? 'active' : ''}`}
        onClick={() => onSelectTab('calls')}
        title="Calls"
      >
        <Phone size={21} />
        <span>Calls</span>
      </button>

      {/* 4. Notifications */}
      <button
        className={`bottom-nav-item ${activeTab === 'notifications' ? 'active' : ''}`}
        onClick={() => onSelectTab('notifications')}
        title="Notifications"
      >
        <Bell size={21} />
        <span>Alerts</span>
      </button>

      {/* 5. Profile */}
      <button
        className={`bottom-nav-item ${activeTab === 'profile' ? 'active' : ''}`}
        onClick={() => onSelectTab('profile')}
        title={t('profile')}
      >
        <div style={{ position: 'relative', display: 'inline-flex' }}>
          <User size={21} />
          {isPremium && (
            <span
              style={{
                position: 'absolute',
                top: '-4px',
                right: '-6px',
                width: '13px',
                height: '13px',
                borderRadius: '50%',
                background: '#f59e0b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1.5px solid var(--bg-card)',
                boxShadow: '0 0 6px rgba(245, 158, 11, 0.6)',
              }}
            >
              <Crown size={8} color="#fff" />
            </span>
          )}
        </div>
        <span>{t('profile')}</span>
      </button>
    </nav>
  );
};

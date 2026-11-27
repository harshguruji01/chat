import React, { useState } from 'react';
import {
  Globe,
  Smartphone,
  ShieldCheck,
  Video,
  MessageSquare,
  Users,
  ArrowRight,
  Download,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { APP_IDENTITY } from '../../config/environment';
import { Modal } from '../common/Modal';
import brandLogo from '../../assets/guruchat.png';

interface PublicLandingScreenProps {
  onOpenWebApp: () => void;
  onSignInWithGoogle: () => void;
  onCreateAccount: () => void;
}

export const PublicLandingScreen: React.FC<PublicLandingScreenProps> = ({
  onOpenWebApp,
  onSignInWithGoogle,
  onCreateAccount,
}) => {
  const [showAndroidModal, setShowAndroidModal] = useState(false);

  return (
    <div
      style={{
        height: '100%',
        width: '100%',
        background: 'var(--bg-app)',
        backgroundImage:
          'radial-gradient(ellipse at 15% 10%, rgba(59, 130, 246, 0.16) 0%, transparent 45%), radial-gradient(ellipse at 85% 90%, rgba(6, 182, 212, 0.14) 0%, transparent 45%)',
        color: 'var(--text-primary)',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
      }}
    >
      {/* Top Bar */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '18px 28px',
          borderBottom: '1px solid var(--border-color)',
          backdropFilter: 'blur(12px)',
          background: 'rgba(15, 22, 35, 0.55)',
          position: 'sticky',
          top: 0,
          zIndex: 20,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img
            src={brandLogo || './guruchat.png'}
            alt="Guru Chat"
            style={{ width: '38px', height: '38px', borderRadius: '10px', objectFit: 'contain' }}
          />
          <div>
            <div style={{ fontFamily: 'var(--font-brand)', fontWeight: 800, fontSize: '1.25rem', lineHeight: 1.1 }}>
              Guru <span style={{ color: 'var(--color-cyan)' }}>Chat</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{APP_IDENTITY.brand}</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => setShowAndroidModal(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '7px',
              padding: '9px 14px',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--border-color-hover)',
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              fontSize: '0.84rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Smartphone size={15} color="var(--color-cyan)" />
            <span>Get Android App</span>
          </button>
          <button
            onClick={onOpenWebApp}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '7px',
              padding: '9px 18px',
              borderRadius: 'var(--radius-full)',
              border: 'none',
              background: 'var(--gradient-brand)',
              color: '#fff',
              fontSize: '0.84rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: 'var(--shadow-glow)',
            }}
          >
            <span>Open Web App</span>
            <ArrowRight size={15} />
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main
        style={{
          flex: 1,
          maxWidth: '1120px',
          width: '100%',
          margin: '0 auto',
          padding: '48px 24px 64px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: '28px',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 14px',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(99, 102, 241, 0.14)',
            border: '1px solid rgba(99, 102, 241, 0.35)',
            color: '#A5B4FC',
            fontSize: '0.78rem',
            fontWeight: 700,
            letterSpacing: '0.4px',
          }}
        >
          <Sparkles size={14} />
          <span>GURU CHAT v{APP_IDENTITY.version} • ANDROID & WEB UNIFIED</span>
        </div>

        <h1
          style={{
            fontFamily: 'var(--font-brand)',
            fontSize: 'clamp(2.1rem, 5vw, 3.6rem)',
            fontWeight: 800,
            lineHeight: 1.12,
            letterSpacing: '-1px',
            maxWidth: '780px',
          }}
        >
          Real-Time Messaging, Voice, Video &{' '}
          <span
            style={{
              background: 'var(--gradient-brand)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Group Conferencing
          </span>
        </h1>

        <p style={{ maxWidth: '640px', color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: 1.6 }}>
          One verified Guru Chat account across Web and Android. Connect securely with contacts, share media and
          voice notes, place HD voice & video calls, and host multi-user conferences.
        </p>

        {/* Primary Entry CTAs */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', justifyContent: 'center', marginTop: '6px' }}>
          <button
            onClick={onOpenWebApp}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              padding: '14px 26px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              background: 'var(--gradient-brand)',
              color: '#fff',
              fontSize: '0.98rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: 'var(--shadow-glow)',
            }}
          >
            <Globe size={18} />
            <span>OPEN WEB APP</span>
          </button>

          <button
            onClick={() => setShowAndroidModal(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              padding: '14px 26px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color-hover)',
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              fontSize: '0.98rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <Smartphone size={18} color="var(--color-cyan)" />
            <span>GET ANDROID APP (v{APP_IDENTITY.version})</span>
          </button>
        </div>

        {/* Quick Auth Shortcuts */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
          <button
            onClick={onSignInWithGoogle}
            style={{
              padding: '9px 16px',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--border-color)',
              background: 'rgba(255,255,255,0.03)',
              color: 'var(--text-secondary)',
              fontSize: '0.84rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Sign in with Google
          </button>
          <button
            onClick={onCreateAccount}
            style={{
              padding: '9px 16px',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--border-color)',
              background: 'rgba(255,255,255,0.03)',
              color: 'var(--text-secondary)',
              fontSize: '0.84rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Create Account with Email
          </button>
        </div>

        {/* Feature Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
            gap: '16px',
            width: '100%',
            marginTop: '24px',
            textAlign: 'left',
          }}
        >
          {[
            {
              icon: <MessageSquare size={20} color="#6366F1" />,
              title: 'Realtime Messaging',
              desc: 'Instant delivery, replies, reactions, editing, pinned messages, and offline sync.',
            },
            {
              icon: <Video size={20} color="#06B6D4" />,
              title: 'HD Voice & Video Calls',
              desc: 'Authenticated 1:1 WebRTC calls between Android and Web with TURN fallback.',
            },
            {
              icon: <Users size={20} color="#8B5CF6" />,
              title: 'Group Conferencing',
              desc: 'Scheduled & instant meetings with host controls, raise hand, screen share & breakout rooms.',
            },
            {
              icon: <ShieldCheck size={20} color="#10B981" />,
              title: 'Verified Identity & Privacy',
              desc: 'No guest calling, granular contact privacy, blocking, and session management.',
            },
          ].map((item) => (
            <div
              key={item.title}
              style={{
                padding: '20px',
                borderRadius: 'var(--radius-lg)',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  background: 'rgba(99, 102, 241, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {item.icon}
              </div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>{item.title}</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer
        style={{
          padding: '18px 24px',
          borderTop: '1px solid var(--border-color)',
          textAlign: 'center',
          fontSize: '0.8rem',
          color: 'var(--text-muted)',
        }}
      >
        Guru Chat • {APP_IDENTITY.brand} • Official Web Client: {APP_IDENTITY.officialWebUrl}
      </footer>

      {/* Android App Download Modal */}
      <Modal isOpen={showAndroidModal} onClose={() => setShowAndroidModal(false)} title="Get Guru Chat Android App">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div
            style={{
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--gradient-surface)',
              border: '1px solid var(--border-color-hover)',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
            }}
          >
            <img
              src={brandLogo || './guruchat.png'}
              alt="Guru Chat"
              style={{ width: '48px', height: '48px', borderRadius: '12px' }}
            />
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>Guru Chat for Android</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                Version {APP_IDENTITY.version} • Package {APP_IDENTITY.androidPackageId}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.86rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
              <CheckCircle2 size={16} color="var(--color-success)" />
              <span>Requires Android 7.0 (API 24) or higher</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
              <CheckCircle2 size={16} color="var(--color-success)" />
              <span>Permissions: Camera, Microphone & Notifications (requested on use)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
              <CheckCircle2 size={16} color="var(--color-success)" />
              <span>Unified account sync with {APP_IDENTITY.officialWebUrl}</span>
            </div>
          </div>

          <a
            href={APP_IDENTITY.androidApkUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px 20px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--gradient-brand)',
              color: '#fff',
              fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            <Download size={18} />
            <span>Download Official Android Build</span>
          </a>
        </div>
      </Modal>
    </div>
  );
};

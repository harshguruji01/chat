import React, { useState } from 'react';
import { User, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { OutlinedButton } from '../common/OutlinedButton';
import { BrandHeader } from '../common/BrandHeader';
import { Modal } from '../common/Modal';
import { useToast } from '../common/Toast';
import brandLogo from '../../assets/guruchat.png';

interface LoginScreenProps {
  onGoToRegister: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onGoToRegister }) => {
  const { signIn, signInWithGoogle, resetPassword } = useAuth();
  const { showToast } = useToast();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      showToast('Please enter your username/email/phone and password.', 'error');
      return;
    }

    setIsLoading(true);
    const { error } = await signIn(identifier, password);
    setIsLoading(false);

    if (error) {
      showToast(error, 'error');
    } else {
      showToast('Welcome back to GuruChat!', 'success');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.includes('@')) {
      showToast('Please enter a valid email address.', 'error');
      return;
    }
    setIsResetting(true);
    const { error } = await resetPassword(resetEmail);
    setIsResetting(false);
    if (error) {
      showToast(error, 'error');
    } else {
      setIsForgotPasswordOpen(false);
      showToast('Password reset link sent to your email!', 'success');
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '32px 20px',
        backgroundColor: 'var(--bg-app)',
        backgroundImage: 'radial-gradient(ellipse at top, rgba(99, 102, 241, 0.12) 0%, transparent 70%)',
        overflowY: 'auto',
      }}
    >
      <div
        className="card fade-in-up auth-desktop-wrapper"
        style={{
          width: '100%',
          maxWidth: '920px',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          flexDirection: 'row',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          padding: 0,
          border: '1px solid var(--border-color)',
        }}
      >
        {/* Left Web Showcase Panel (Desktop only) */}
        <div
          className="auth-web-showcase"
          style={{
            flex: '1 1 48%',
            background: 'linear-gradient(145deg, #0F1626 0%, #172138 100%)',
            padding: '40px 36px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            borderRight: '1px solid var(--border-color)',
            color: '#F8FAFC',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '28px' }}>
              <img
                src={brandLogo || './guruchat.png'}
                alt="GuruChat Logo"
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '14px',
                  boxShadow: '0 4px 20px rgba(99, 102, 241, 0.4)',
                  objectFit: 'contain',
                }}
              />
              <div>
                <h1 style={{ fontFamily: 'var(--font-brand)', fontSize: '1.75rem', fontWeight: 800, margin: 0, letterSpacing: '-0.5px' }}>
                  Guru<span style={{ color: 'var(--color-primary)' }}>Chat</span> <span style={{ fontSize: '0.9rem', color: '#94A3B8', fontWeight: 500 }}>Web</span>
                </h1>
                <p style={{ fontSize: '0.82rem', color: '#94A3B8', margin: 0 }}>Connect. Chat. Share. • By HarshGuruJi</p>
              </div>
            </div>

            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '12px', color: '#FFFFFF' }}>
              Chat directly from your browser
            </h2>
            <p style={{ color: '#94A3B8', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '28px' }}>
              Aap apne <strong>Unique User ID</strong> ya username se login karke bina kisi rukawat ke direct website se chat kar sakte hain. Saara data app ke saath real-time sync hota hai.
            </p>

            {/* Feature Highlights */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ background: 'rgba(99, 102, 241, 0.2)', padding: '8px', borderRadius: '10px', color: '#818CF8' }}>
                  🆔
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>Unique ID Se Instant Login</div>
                  <div style={{ fontSize: '0.8rem', color: '#94A3B8' }}>Apna 8-digit unique ID (jaise HG8X29K4) daalein aur turant login karein</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ background: 'rgba(16, 185, 129, 0.2)', padding: '8px', borderRadius: '10px', color: '#34D399' }}>
                  ⚡
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>Web & Android Live Sync</div>
                  <div style={{ fontSize: '0.8rem', color: '#94A3B8' }}>Mobile phone, tablet aur browser par real-time instant messaging</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ background: 'rgba(236, 72, 153, 0.2)', padding: '8px', borderRadius: '10px', color: '#F472B6' }}>
                  🎙️
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>Voice Notes, Video & Emojis</div>
                  <div style={{ fontSize: '0.8rem', color: '#94A3B8' }}>High-definition voice notes with waveform, videos aur rich emojis</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ background: 'rgba(245, 158, 11, 0.2)', padding: '8px', borderRadius: '10px', color: '#FBBF24' }}>
                  🕒
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>30-Day Auto Cleanup</div>
                  <div style={{ fontSize: '0.8rem', color: '#94A3B8' }}>Purane messages 30 din baad automatically safely delete ho jaate hain</div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '36px', paddingTop: '18px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: '#94A3B8' }}>
            <span>Made by <strong>HarshGuruJi</strong></span>
            <a href="https://www.webguruji.online" target="_blank" rel="noopener noreferrer" style={{ color: '#818CF8', textDecoration: 'none', fontWeight: 600 }}>
              www.webguruji.online ↗
            </a>
          </div>
        </div>

        {/* Right Auth Form Panel */}
        <div
          style={{
            flex: '1 1 52%',
            padding: '40px 32px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            background: 'var(--bg-card)',
          }}
        >
          {/* Mobile Header (Shown on small screens) */}
          <div className="auth-mobile-header" style={{ display: 'none', marginBottom: '20px' }}>
            <BrandHeader size="md" />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)' }}>Welcome to GuruChat</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: '4px' }}>
              Apne <strong>User ID (HG...)</strong>, Username, ya Email se login karein
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ width: '100%' }}>
            <div className="input-group">
              <label className="input-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>User ID, Username, ya Email</span>
                <span style={{ fontSize: '0.74rem', color: 'var(--color-primary)', fontWeight: 600 }}>
                  🆔 ID Login Supported
                </span>
              </label>
              <div className="input-wrapper">
                <User size={18} className="input-icon-left" />
                <input
                  type="text"
                  className="input-field has-left-icon"
                  placeholder="e.g. HG8X29K4, harsh, or user@email.com"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  autoCapitalize="none"
                  autoComplete="username"
                  required
                />
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                💡 Tip: Aap apna 8-character Unique ID (jaise <strong>HG8X29K4</strong>) enter karke direct login kar sakte hain.
              </div>
            </div>

            <div className="input-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="input-label">Password</label>
                <button
                  type="button"
                  onClick={() => setIsForgotPasswordOpen(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-primary)',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  Forgot?
                </button>
              </div>
              <div className="input-wrapper">
                <Lock size={18} className="input-icon-left" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input-field has-left-icon"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="input-icon-right"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <OutlinedButton
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              style={{ width: '100%', marginTop: '12px' }}
              icon={<ArrowRight size={18} />}
            >
              Login to GuruChat Web
            </OutlinedButton>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', margin: '16px 0', gap: '10px' }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>OR</span>
              <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
            </div>

            {/* Google OAuth Button */}
            <button
              type="button"
              onClick={async () => {
                const res = await signInWithGoogle();
                if (res?.error) showToast(res.error, 'error');
              }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                padding: '11px',
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-input)',
                color: 'var(--text-primary)',
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background 0.15s ease',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>
          </form>

          <div
            style={{
              marginTop: '24px',
              paddingTop: '20px',
              borderTop: '1px solid var(--border-color)',
              width: '100%',
              textAlign: 'center',
              fontSize: '0.9rem',
              color: 'var(--text-secondary)',
            }}
          >
            Don't have an account?{' '}
            <button
              onClick={onGoToRegister}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-primary)',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Create Account
            </button>
          </div>

          <div style={{ marginTop: '20px', paddingTop: '14px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', textAlign: 'center', fontSize: '0.82rem', color: '#94a3b8' }}>
            <span>Platform Founder: </span>
            <a
              href="https://www.webguruji.online/owner.html"
              target="_blank"
              rel="noopener noreferrer"
              title="Meet the Owner: Harsh Patel"
              style={{
                fontWeight: 800,
                background: 'linear-gradient(90deg, #60a5fa, #a855f7, #ec4899, #f59e0b, #60a5fa)',
                backgroundSize: '200% auto',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              Harsh Patel <span style={{ color: '#ffd700', fontSize: '10px' }}>✓</span> ↗
            </a>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <Modal
        isOpen={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
        title="Reset Password"
      >
        <form onSubmit={handleResetPassword}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '16px' }}>
            Enter your registered email address. We'll send you a secure link to reset your password.
          </p>
          <div className="input-group">
            <label className="input-label">Email Address</label>
            <input
              type="email"
              className="input-field"
              placeholder="you@example.com"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              required
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <OutlinedButton
              type="button"
              variant="secondary"
              onClick={() => setIsForgotPasswordOpen(false)}
            >
              Cancel
            </OutlinedButton>
            <OutlinedButton
              type="submit"
              variant="primary"
              isLoading={isResetting}
            >
              Send Reset Link
            </OutlinedButton>
          </div>
        </form>
      </Modal>
    </div>
  );
};

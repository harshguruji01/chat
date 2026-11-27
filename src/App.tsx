import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './components/common/Toast';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PremiumProvider } from './context/PremiumContext';
import { ChatProvider } from './context/ChatContext';
import { CallProvider } from './context/CallContext';
import { SplashScreen } from './components/auth/SplashScreen';
import { PublicLandingScreen } from './components/auth/PublicLandingScreen';
import { LoginScreen } from './components/auth/LoginScreen';
import { RegisterScreen } from './components/auth/RegisterScreen';
import { MainLayout } from './components/layout/MainLayout';
import { LiveUpdateSync } from './components/common/LiveUpdateSync';
import { IncomingCallModal } from './components/call/IncomingCallModal';
import { ActiveCallModal } from './components/call/ActiveCallModal';
import { FloatingCallBubble } from './components/call/FloatingCallBubble';
import { AdminControlCenter } from './components/admin/AdminControlCenter';

const GuruChatApp: React.FC = () => {
  const { user, isLoading, signInWithGoogle } = useAuth();
  const [showSplash, setShowSplash] = useState(true);
  const [authView, setAuthView] = useState<'landing' | 'login' | 'register'>('landing');
  const [isAdminView, setIsAdminView] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.location.pathname.startsWith('/admin') ||
      window.location.hash.startsWith('#/admin')
    );
  });

  // Watch URL hash or popstate for /admin route
  useEffect(() => {
    const checkRoute = () => {
      const isRoute =
        window.location.pathname.startsWith('/admin') ||
        window.location.hash.startsWith('#/admin');
      setIsAdminView(isRoute);
    };

    window.addEventListener('popstate', checkRoute);
    window.addEventListener('hashchange', checkRoute);
    return () => {
      window.removeEventListener('popstate', checkRoute);
      window.removeEventListener('hashchange', checkRoute);
    };
  }, []);

  // Dedicated Route: guruchat.webguruji.online/admin
  if (isAdminView) {
    return (
      <AdminControlCenter
        onExit={() => {
          setIsAdminView(false);
          try {
            window.history.pushState(null, '', '/');
            window.location.hash = '';
          } catch {}
        }}
      />
    );
  }

  // While splash screen is animating, keep it on
  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  // If still loading session from Supabase
  if (isLoading) {
    return null;
  }

  // If user is not authenticated, show Public Landing, Login, or Register
  if (!user) {
    if (authView === 'landing') {
      return (
        <PublicLandingScreen
          onOpenWebApp={() => setAuthView('login')}
          onSignInWithGoogle={() => {
            signInWithGoogle().catch(() => setAuthView('login'));
          }}
          onCreateAccount={() => setAuthView('register')}
        />
      );
    }
    return authView === 'login' ? (
      <LoginScreen onGoToRegister={() => setAuthView('register')} />
    ) : (
      <RegisterScreen onGoToLogin={() => setAuthView('login')} />
    );
  }

  // Main Application (Chat, Communities, Channels, Nearby, Search, Profile)
  return (
    <>
      <MainLayout />
      <IncomingCallModal />
      <ActiveCallModal />
      <FloatingCallBubble />
    </>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <LanguageProvider>
          <AuthProvider>
            <PremiumProvider>
              <ChatProvider>
                <CallProvider>
                  <LiveUpdateSync />
                  <GuruChatApp />
                </CallProvider>
              </ChatProvider>
            </PremiumProvider>
          </AuthProvider>
        </LanguageProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}


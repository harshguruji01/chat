import { Capacitor } from '@capacitor/core';

export type AppEnvironment = 'development' | 'staging' | 'production';

export const APP_IDENTITY = {
  name: 'Guru Chat',
  shortName: 'GuruChat',
  brand: 'By HarshGuruJi',
  developer: 'HarshGuruJi',
  tagline: 'Connect. Chat. Call. Meet.',
  version: '3.0.0',
  versionCode: 300,
  officialWebUrl: 'https://chat.webguruji.online/',
  legacyWebUrl: 'https://guruchat.webguruji.online/',
  developerUrl: 'https://www.webguruji.online',
  androidPackageId: 'com.harshguruji.guruchat',
  androidMinSdk: 24,
  androidTargetSdk: 35,
  androidApkUrl:
    import.meta.env.VITE_ANDROID_APK_URL ||
    'https://github.com/harshguruji/guruchat/releases/latest',
} as const;

export function getAppEnvironment(): AppEnvironment {
  const env = (import.meta.env.VITE_APP_ENV || import.meta.env.MODE || 'production').toLowerCase();
  if (env === 'development' || env === 'dev') return 'development';
  if (env === 'staging' || env === 'stage') return 'staging';
  return 'production';
}

export function isOfficialWebOrigin(): boolean {
  if (typeof window === 'undefined') return true;
  if (Capacitor.isNativePlatform()) return true;
  const host = window.location.hostname.toLowerCase();
  return (
    host === 'chat.webguruji.online' ||
    host === 'guruchat.webguruji.online' ||
    host === 'webguruji.online' ||
    host.endsWith('.webguruji.online') ||
    host === 'localhost' ||
    host === '127.0.0.1'
  );
}

export function getOAuthRedirectUrl(): string {
  if (Capacitor.isNativePlatform()) {
    return 'com.harshguruji.guruchat://login-callback';
  }
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/`;
  }
  return APP_IDENTITY.officialWebUrl;
}

export function getIceServers(): RTCIceServer[] {
  const servers: RTCIceServer[] = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
  ];

  const turnUrl = import.meta.env.VITE_TURN_URL;
  const turnUser = import.meta.env.VITE_TURN_USERNAME;
  const turnCred = import.meta.env.VITE_TURN_CREDENTIAL;
  if (turnUrl && turnUser && turnCred) {
    servers.push({
      urls: turnUrl.split(',').map((u: string) => u.trim()),
      username: turnUser,
      credential: turnCred,
    });
  }
  return servers;
}

export const LIVEKIT_CONFIG = {
  url: import.meta.env.VITE_LIVEKIT_URL || '',
  isConfigured: Boolean(import.meta.env.VITE_LIVEKIT_URL),
};

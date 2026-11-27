import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

test('PWA manifest and service worker exist and are valid', () => {
  const manifestPath = path.join(root, 'public', 'manifest.webmanifest');
  assert.ok(fs.existsSync(manifestPath), 'manifest.webmanifest must exist');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  assert.equal(manifest.name, 'Guru Chat');
  assert.equal(manifest.display, 'standalone');

  const swPath = path.join(root, 'public', 'sw.js');
  assert.ok(fs.existsSync(swPath), 'sw.js must exist');
  const swContent = fs.readFileSync(swPath, 'utf8');
  assert.ok(swContent.includes('supabase.co'), 'sw.js must bypass caching for supabase.co');
});

test('SQL migration includes all required normalized modules', () => {
  const sqlPath = path.join(root, 'supabase', 'migrations', '001_guruchat_ultra_upgrade.sql');
  assert.ok(fs.existsSync(sqlPath), 'SQL migration must exist');
  const sql = fs.readFileSync(sqlPath, 'utf8');
  for (const table of [
    'user_sessions',
    'connection_requests',
    'contacts',
    'message_edits',
    'calls',
    'conference_rooms',
    'conference_members',
    'breakout_rooms',
    'notifications',
    'notification_preferences',
    'admin_audit_logs',
    'platform_settings',
    'check_call_eligibility',
  ]) {
    assert.ok(sql.includes(table), `Migration must define ${table}`);
  }
});

test('AndroidManifest configures deep links, allowBackup=false, and notifications', () => {
  const manifestXml = fs.readFileSync(
    path.join(root, 'android', 'app', 'src', 'main', 'AndroidManifest.xml'),
    'utf8'
  );
  assert.ok(manifestXml.includes('android:allowBackup="false"'), 'allowBackup must be false for security');
  assert.ok(manifestXml.includes('chat.webguruji.online'), 'Deep link host must be configured');
  assert.ok(manifestXml.includes('POST_NOTIFICATIONS'), 'POST_NOTIFICATIONS permission must be declared');
});

test('Security: no hardcoded secrets in environment config', () => {
  const envCfg = fs.readFileSync(path.join(root, 'src', 'config', 'environment.ts'), 'utf8');
  assert.ok(!envCfg.includes('GOCSPX-'), 'OAuth client secret must never be in frontend source');
  assert.ok(envCfg.includes('https://chat.webguruji.online/'), 'Official web URL must be configured');
});

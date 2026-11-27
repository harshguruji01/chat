import { supabase } from '../lib/supabase';
import type { ConnectionRequest, ContactRecord, Profile } from '../types';

const LOCAL_REQUESTS_KEY = 'guruchat_connection_requests';
const LOCAL_CONTACTS_KEY = 'guruchat_contacts';

let lastSearchTimestamp = 0;

export async function searchUsersDirectory(
  query: string,
  currentUserId: string
): Promise<{ results: Profile[]; rateLimited?: boolean }> {
  const now = Date.now();
  if (now - lastSearchTimestamp < 250) {
    return { results: [], rateLimited: true };
  }
  lastSearchTimestamp = now;

  const cleanQ = query.replace(/^@/, '').trim();
  if (!cleanQ) return { results: [] };

  const { data, error } = await supabase
    .from('profiles')
    .select('id, user_code, username, display_name, avatar_url, bio, status_message, is_private, who_can_find, who_can_request, who_can_see_avatar, who_can_call, who_can_invite_group, show_online_status, last_seen, is_suspended, role, created_at, updated_at, is_premium')
    .neq('id', currentUserId)
    .eq('is_suspended', false)
    .or(`user_code.ilike.%${cleanQ}%,username.ilike.%${cleanQ}%,display_name.ilike.%${cleanQ}%`)
    .limit(20);

  if (error || !data) return { results: [] };

  // Respect privacy settings: filter out users who set who_can_find = 'nobody'
  const filtered = (data as Profile[]).filter((p) => p.who_can_find !== 'nobody');
  return { results: filtered };
}

export async function listMyContacts(userId: string): Promise<ContactRecord[]> {
  try {
    const { data, error } = await supabase
      .from('contacts')
      .select('*, profile:contact_id(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (!error && data && data.length > 0) {
      return data as ContactRecord[];
    }
  } catch {}

  // Backward-compatible fallback: derive contacts from accepted follows
  const { data: followsData } = await supabase
    .from('follows')
    .select('id, follower_id, following_id, created_at, profile:following_id(*)')
    .eq('follower_id', userId)
    .eq('status', 'accepted');

  const fromFollows: ContactRecord[] = (followsData || []).map((f: any) => ({
    id: f.id,
    user_id: f.follower_id,
    contact_id: f.following_id,
    is_favorite: false,
    created_at: f.created_at,
    profile: f.profile as Profile,
  }));

  try {
    const local: ContactRecord[] = JSON.parse(localStorage.getItem(LOCAL_CONTACTS_KEY) || '[]');
    const merged = [...fromFollows];
    local.filter((c) => c.user_id === userId).forEach((c) => {
      if (!merged.some((m) => m.contact_id === c.contact_id)) merged.push(c);
    });
    return merged;
  } catch {
    return fromFollows;
  }
}

export async function listConnectionRequests(userId: string): Promise<{
  incoming: ConnectionRequest[];
  sent: ConnectionRequest[];
}> {
  try {
    const { data, error } = await supabase
      .from('connection_requests')
      .select('*, sender:sender_id(*), receiver:receiver_id(*)')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (!error && data) {
      return {
        incoming: (data as ConnectionRequest[]).filter((r) => r.receiver_id === userId),
        sent: (data as ConnectionRequest[]).filter((r) => r.sender_id === userId),
      };
    }
  } catch {}

  try {
    const local: ConnectionRequest[] = JSON.parse(localStorage.getItem(LOCAL_REQUESTS_KEY) || '[]');
    return {
      incoming: local.filter((r) => r.receiver_id === userId && r.status === 'pending'),
      sent: local.filter((r) => r.sender_id === userId && r.status === 'pending'),
    };
  } catch {
    return { incoming: [], sent: [] };
  }
}

export async function sendConnectionRequest(
  senderId: string,
  receiver: Profile,
  message?: string
): Promise<{ error?: string }> {
  if (receiver.who_can_request === 'nobody') {
    return { error: 'This user is not accepting connection requests.' };
  }

  try {
    const { error } = await supabase.from('connection_requests').insert({
      sender_id: senderId,
      receiver_id: receiver.id,
      status: 'pending',
      message: message || null,
    });
    if (!error) return {};
  } catch {}

  try {
    const local: ConnectionRequest[] = JSON.parse(localStorage.getItem(LOCAL_REQUESTS_KEY) || '[]');
    if (local.some((r) => r.sender_id === senderId && r.receiver_id === receiver.id && r.status === 'pending')) {
      return { error: 'Connection request already pending.' };
    }
    local.unshift({
      id: `req-${Date.now()}`,
      sender_id: senderId,
      receiver_id: receiver.id,
      status: 'pending',
      message: message || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      receiver,
    });
    localStorage.setItem(LOCAL_REQUESTS_KEY, JSON.stringify(local));
  } catch {}
  return {};
}

export async function respondToConnectionRequest(
  request: ConnectionRequest,
  action: 'accepted' | 'rejected' | 'cancelled'
): Promise<{ error?: string }> {
  try {
    const { error } = await supabase
      .from('connection_requests')
      .update({ status: action, updated_at: new Date().toISOString() })
      .eq('id', request.id);

    if (!error && action === 'accepted') {
      await supabase.from('contacts').upsert([
        { user_id: request.sender_id, contact_id: request.receiver_id },
        { user_id: request.receiver_id, contact_id: request.sender_id },
      ]);
      return {};
    }
    if (!error) return {};
  } catch {}

  try {
    const local: ConnectionRequest[] = JSON.parse(localStorage.getItem(LOCAL_REQUESTS_KEY) || '[]');
    const updated = local.map((r) => (r.id === request.id ? { ...r, status: action } : r));
    localStorage.setItem(LOCAL_REQUESTS_KEY, JSON.stringify(updated));
    if (action === 'accepted') {
      const contacts: ContactRecord[] = JSON.parse(localStorage.getItem(LOCAL_CONTACTS_KEY) || '[]');
      contacts.unshift({
        id: `c-${Date.now()}`,
        user_id: request.receiver_id,
        contact_id: request.sender_id,
        is_favorite: false,
        created_at: new Date().toISOString(),
        profile: request.sender,
      });
      localStorage.setItem(LOCAL_CONTACTS_KEY, JSON.stringify(contacts));
    }
  } catch {}
  return {};
}

export async function removeContactConnection(userId: string, contactId: string): Promise<{ error?: string }> {
  try {
    await supabase.from('contacts').delete().eq('user_id', userId).eq('contact_id', contactId);
    await supabase.from('follows').delete().eq('follower_id', userId).eq('following_id', contactId);
  } catch {}

  try {
    const contacts: ContactRecord[] = JSON.parse(localStorage.getItem(LOCAL_CONTACTS_KEY) || '[]');
    localStorage.setItem(
      LOCAL_CONTACTS_KEY,
      JSON.stringify(contacts.filter((c) => !(c.user_id === userId && c.contact_id === contactId)))
    );
  } catch {}
  return {};
}

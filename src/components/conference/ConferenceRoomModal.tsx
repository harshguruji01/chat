import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  MonitorUp,
  Hand,
  Users,
  MessageSquare,
  PhoneOff,
  Lock,
  Unlock,
  Pin,
  Send,
  Layers,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../common/Toast';
import { supabase } from '../../lib/supabase';
import { getIceServers } from '../../config/environment';
import { endConferenceForAll, toggleConferenceLock, createBreakoutRoom } from '../../services/conferenceService';
import type { BreakoutRoom, ConferenceRoom } from '../../types';
import { Avatar } from '../common/Avatar';

interface ConferenceRoomModalProps {
  room: ConferenceRoom;
  onClose: () => void;
}

interface ChatMsg {
  id: string;
  senderName: string;
  text: string;
  time: string;
}

export const ConferenceRoomModal: React.FC<ConferenceRoomModalProps> = ({ room, onClose }) => {
  const { user, profile } = useAuth();
  const { showToast } = useToast();

  const [micOn, setMicOn] = useState(false);
  const [camOn, setCamOn] = useState(false);
  const [screenSharing, setScreenSharing] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [isLocked, setIsLocked] = useState(room.is_locked);
  const [durationSec, setDurationSec] = useState(0);
  const [sidePanel, setSidePanel] = useState<'none' | 'participants' | 'chat' | 'breakout'>('none');
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [pinnedUserId, setPinnedUserId] = useState<string | null>(null);
  const [breakoutRooms, setBreakoutRooms] = useState<BreakoutRoom[]>([]);
  const [newBreakoutName, setNewBreakoutName] = useState('');
  const [onlinePeers, setOnlinePeers] = useState<{ userId: string; name: string; handRaised?: boolean; micOn?: boolean; camOn?: boolean }[]>([]);
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const channelRef = useRef<any>(null);

  const isHost = user?.id === room.host_id;

  // Call duration timer
  useEffect(() => {
    const t = setInterval(() => setDurationSec((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // Cleanup all media tracks on unmount
  useEffect(() => {
    return () => {
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
      peersRef.current.forEach((pc) => pc.close());
      peersRef.current.clear();
    };
  }, []);

  // Realtime room signaling & presence
  useEffect(() => {
    if (!user) return;
    const ch = supabase.channel(`guruchat-conf-${room.id}`, {
      config: { presence: { key: user.id } },
    });

    const createPeer = (peerId: string, initiator: boolean) => {
      if (peersRef.current.has(peerId)) return peersRef.current.get(peerId)!;
      const pc = new RTCPeerConnection({ iceServers: getIceServers() });
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((tr) => pc.addTrack(tr, localStreamRef.current!));
      }
      pc.onicecandidate = (e) => {
        if (e.candidate) {
          ch.send({
            type: 'broadcast',
            event: 'rtc_signal',
            payload: { to: peerId, from: user.id, candidate: e.candidate },
          }).catch(() => {});
        }
      };
      pc.ontrack = (e) => {
        if (e.streams[0]) {
          setRemoteStreams((prev) => ({ ...prev, [peerId]: e.streams[0] }));
        }
      };
      if (initiator) {
        pc.createOffer()
          .then((offer) => pc.setLocalDescription(offer).then(() => offer))
          .then((offer) =>
            ch.send({ type: 'broadcast', event: 'rtc_signal', payload: { to: peerId, from: user.id, sdp: offer } })
          )
          .catch(() => {});
      }
      peersRef.current.set(peerId, pc);
      return pc;
    };

    ch.on('presence', { event: 'sync' }, () => {
      const state = ch.presenceState();
      const list: any[] = [];
      Object.entries(state).forEach(([uid, arr]: [string, any]) => {
        const meta = arr?.[0] || {};
        list.push({ userId: uid, name: meta.name || 'Participant', handRaised: meta.handRaised, micOn: meta.micOn, camOn: meta.camOn });
        if (uid !== user.id && user.id < uid && !peersRef.current.has(uid)) {
          createPeer(uid, true);
        }
      });
      setOnlinePeers(list);
    })
      .on('broadcast', { event: 'rtc_signal' }, async ({ payload }) => {
        if (!payload || payload.to !== user.id) return;
        const pc = createPeer(payload.from, false);
        try {
          if (payload.sdp) {
            await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
            if (payload.sdp.type === 'offer') {
              const ans = await pc.createAnswer();
              await pc.setLocalDescription(ans);
              ch.send({ type: 'broadcast', event: 'rtc_signal', payload: { to: payload.from, from: user.id, sdp: ans } }).catch(() => {});
            }
          } else if (payload.candidate) {
            await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
          }
        } catch {}
      })
      .on('broadcast', { event: 'conf_chat' }, ({ payload }) => {
        if (payload) setChatMessages((prev) => [...prev, payload]);
      })
      .on('broadcast', { event: 'host_action' }, ({ payload }) => {
        if (payload?.action === 'end_all') {
          showToast('Host ended the meeting.', 'info');
          onClose();
        } else if (payload?.action === 'mute_user' && payload?.targetId === user.id) {
          localStreamRef.current?.getAudioTracks().forEach((t) => (t.enabled = false));
          setMicOn(false);
          showToast('You were muted by the host.', 'info');
        } else if (payload?.action === 'remove_user' && payload?.targetId === user.id) {
          showToast('You were removed from the meeting.', 'error');
          onClose();
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await ch.track({
            name: profile?.display_name || 'GuruChat User',
            handRaised,
            micOn,
            camOn,
          });
        }
      });

    channelRef.current = ch;
    return () => {
      supabase.removeChannel(ch);
      channelRef.current = null;
    };
  }, [room.id, user, profile?.display_name, onClose, showToast]);

  const syncPresence = (next: { handRaised?: boolean; micOn?: boolean; camOn?: boolean }) => {
    channelRef.current?.track({
      name: profile?.display_name || 'GuruChat User',
      handRaised: next.handRaised ?? handRaised,
      micOn: next.micOn ?? micOn,
      camOn: next.camOn ?? camOn,
    });
  };

  const toggleMic = async () => {
    if (!micOn) {
      try {
        const stream = localStreamRef.current || (await navigator.mediaDevices.getUserMedia({ audio: true }));
        localStreamRef.current = stream;
        if (stream.getAudioTracks().length === 0) {
          const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          audioStream.getAudioTracks().forEach((t) => stream.addTrack(t));
        }
        stream.getAudioTracks().forEach((t) => (t.enabled = true));
        setMicOn(true);
        syncPresence({ micOn: true });
      } catch {
        showToast('Microphone permission denied.', 'error');
      }
    } else {
      localStreamRef.current?.getAudioTracks().forEach((t) => (t.enabled = false));
      setMicOn(false);
      syncPresence({ micOn: false });
    }
  };

  const toggleCam = async () => {
    if (!camOn) {
      try {
        const camStream = await navigator.mediaDevices.getUserMedia({ video: true });
        const track = camStream.getVideoTracks()[0];
        if (!localStreamRef.current) localStreamRef.current = new MediaStream();
        localStreamRef.current.addTrack(track);
        if (localVideoRef.current) localVideoRef.current.srcObject = localStreamRef.current;
        peersRef.current.forEach((pc) => pc.addTrack(track, localStreamRef.current!));
        setCamOn(true);
        syncPresence({ camOn: true });
      } catch {
        showToast('Camera permission denied.', 'error');
      }
    } else {
      localStreamRef.current?.getVideoTracks().forEach((t) => {
        t.stop();
        localStreamRef.current?.removeTrack(t);
      });
      setCamOn(false);
      syncPresence({ camOn: false });
    }
  };

  const toggleScreenShare = async () => {
    if (!screenSharing) {
      if (!navigator.mediaDevices?.getDisplayMedia) {
        showToast('Screen sharing is not supported on this browser/device.', 'error');
        return;
      }
      try {
        const disp = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = disp;
        const track = disp.getVideoTracks()[0];
        track.onended = () => setScreenSharing(false);
        if (localVideoRef.current) localVideoRef.current.srcObject = disp;
        peersRef.current.forEach((pc) => pc.addTrack(track, disp));
        setScreenSharing(true);
      } catch {
        showToast('Screen sharing cancelled.', 'info');
      }
    } else {
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
      setScreenSharing(false);
    }
  };

  const sendMeetingChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const msg: ChatMsg = {
      id: `cm-${Date.now()}`,
      senderName: profile?.display_name || 'You',
      text: chatInput.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setChatMessages((prev) => [...prev, msg]);
    channelRef.current?.send({ type: 'broadcast', event: 'conf_chat', payload: msg }).catch(() => {});
    setChatInput('');
  };

  const formatTimer = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99995,
        background: '#080B12',
        color: '#F8FAFC',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Top Bar */}
      <div
        style={{
          padding: '12px 20px',
          borderBottom: '1px solid rgba(148,163,184,0.16)',
          background: '#0F1623',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ShieldCheck size={18} color="#10B981" />
          <div>
            <div style={{ fontWeight: 700, fontSize: '1rem' }}>{room.title}</div>
            <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
              Code: {room.room_code} • {formatTimer(durationSec)} • {onlinePeers.length || 1} participant(s)
              {screenSharing && ' • Sharing Screen'}
            </div>
          </div>
        </div>

        {isHost && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={async () => {
                const next = !isLocked;
                setIsLocked(next);
                await toggleConferenceLock(room.id, next);
                showToast(next ? 'Meeting locked' : 'Meeting unlocked', 'info');
              }}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1px solid rgba(148,163,184,0.2)',
                background: isLocked ? 'rgba(245,158,11,0.18)' : 'transparent',
                color: '#fff',
                fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              {isLocked ? <Lock size={14} /> : <Unlock size={14} />}
              {isLocked ? 'Locked' : 'Lock'}
            </button>

            <button
              onClick={async () => {
                channelRef.current?.send({ type: 'broadcast', event: 'host_action', payload: { action: 'end_all' } }).catch(() => {});
                await endConferenceForAll(room.id);
                onClose();
              }}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                border: 'none',
                background: '#EF4444',
                color: '#fff',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              End for All
            </button>
          </div>
        )}
      </div>

      {/* Main Grid + Side Drawer */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div
          style={{
            flex: 1,
            padding: '16px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '14px',
            overflowY: 'auto',
            alignContent: 'center',
          }}
        >
          {/* Local Tile */}
          <div
            style={{
              background: '#141C2B',
              borderRadius: '16px',
              border: pinnedUserId === user?.id ? '2px solid #06B6D4' : '1px solid rgba(148,163,184,0.16)',
              minHeight: '220px',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            {camOn || screenSharing ? (
              <video ref={localVideoRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <Avatar src={profile?.avatar_url} name={profile?.display_name || 'You'} size="xl" />
            )}
            <div style={{ position: 'absolute', bottom: '10px', left: '12px', fontSize: '0.8rem', background: 'rgba(0,0,0,0.6)', padding: '4px 10px', borderRadius: '999px' }}>
              {profile?.display_name || 'You'} (You) {handRaised ? '✋' : ''} {!micOn ? '🔇' : ''}
            </div>
          </div>

          {/* Remote Peer Tiles */}
          {onlinePeers
            .filter((p) => p.userId !== user?.id)
            .map((p) => {
              const stream = remoteStreams[p.userId];
              return (
                <div
                  key={p.userId}
                  style={{
                    background: '#141C2B',
                    borderRadius: '16px',
                    border: pinnedUserId === p.userId ? '2px solid #06B6D4' : '1px solid rgba(148,163,184,0.16)',
                    minHeight: '220px',
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                  }}
                >
                  {stream ? (
                    <video
                      autoPlay
                      playsInline
                      ref={(el) => {
                        if (el && el.srcObject !== stream) el.srcObject = stream;
                      }}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <Avatar name={p.name} size="xl" />
                  )}
                  <button
                    onClick={() => setPinnedUserId(pinnedUserId === p.userId ? null : p.userId)}
                    style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '8px', padding: '6px', color: '#fff', cursor: 'pointer' }}
                    title="Pin Participant"
                  >
                    <Pin size={14} />
                  </button>
                  <div style={{ position: 'absolute', bottom: '10px', left: '12px', fontSize: '0.8rem', background: 'rgba(0,0,0,0.6)', padding: '4px 10px', borderRadius: '999px' }}>
                    {p.name} {p.handRaised ? '✋' : ''} {!p.micOn ? '🔇' : ''}
                  </div>
                </div>
              );
            })}
        </div>

        {/* Side Drawer */}
        {sidePanel !== 'none' && (
          <div style={{ width: '320px', borderLeft: '1px solid rgba(148,163,184,0.16)', background: '#0F1623', display: 'flex', flexDirection: 'column', padding: '14px' }}>
            <h4 style={{ margin: '0 0 12px', textTransform: 'capitalize' }}>{sidePanel}</h4>

            {sidePanel === 'participants' && (
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {onlinePeers.map((p) => (
                  <div key={p.userId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', background: '#141C2B', borderRadius: '10px', fontSize: '0.84rem' }}>
                    <span>{p.name} {p.handRaised ? '✋' : ''}</span>
                    {isHost && p.userId !== user?.id && (
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          onClick={() => channelRef.current?.send({ type: 'broadcast', event: 'host_action', payload: { action: 'mute_user', targetId: p.userId } })}
                          style={{ fontSize: '0.72rem', padding: '3px 7px', borderRadius: '6px', border: 'none', background: '#334155', color: '#fff', cursor: 'pointer' }}
                        >
                          Mute
                        </button>
                        <button
                          onClick={() => channelRef.current?.send({ type: 'broadcast', event: 'host_action', payload: { action: 'remove_user', targetId: p.userId } })}
                          style={{ fontSize: '0.72rem', padding: '3px 7px', borderRadius: '6px', border: 'none', background: '#EF4444', color: '#fff', cursor: 'pointer' }}
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {sidePanel === 'chat' && (
              <>
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px' }}>
                  {chatMessages.map((m) => (
                    <div key={m.id} style={{ padding: '8px 10px', borderRadius: '10px', background: '#141C2B', fontSize: '0.82rem' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.74rem', color: '#38BDF8' }}>{m.senderName} • {m.time}</div>
                      <div>{m.text}</div>
                    </div>
                  ))}
                </div>
                <form onSubmit={sendMeetingChat} style={{ display: 'flex', gap: '6px' }}>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Message meeting..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    style={{ flex: 1, padding: '8px' }}
                  />
                  <button type="submit" style={{ padding: '8px 12px', borderRadius: '8px', border: 'none', background: '#6366F1', color: '#fff', cursor: 'pointer' }}>
                    <Send size={14} />
                  </button>
                </form>
              </>
            )}

            {sidePanel === 'breakout' && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {isHost && (
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="Room name..."
                      value={newBreakoutName}
                      onChange={(e) => setNewBreakoutName(e.target.value)}
                      style={{ flex: 1, padding: '8px' }}
                    />
                    <button
                      onClick={async () => {
                        if (!newBreakoutName.trim()) return;
                        const br = await createBreakoutRoom(room.id, newBreakoutName.trim());
                        setBreakoutRooms((prev) => [...prev, br]);
                        setNewBreakoutName('');
                      }}
                      style={{ padding: '8px 12px', borderRadius: '8px', border: 'none', background: '#6366F1', color: '#fff', cursor: 'pointer' }}
                    >
                      Add
                    </button>
                  </div>
                )}
                {breakoutRooms.length === 0 ? (
                  <p style={{ fontSize: '0.82rem', color: '#94A3B8' }}>No breakout rooms created yet.</p>
                ) : (
                  breakoutRooms.map((b) => (
                    <div key={b.id} style={{ padding: '10px', borderRadius: '10px', background: '#141C2B', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.86rem' }}>{b.name}</span>
                      <span style={{ fontSize: '0.72rem', color: '#10B981' }}>Active</span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div
        style={{
          padding: '14px 20px',
          borderTop: '1px solid rgba(148,163,184,0.16)',
          background: '#0F1623',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap',
        }}
      >
        <button onClick={toggleMic} style={{ padding: '12px', borderRadius: '50%', border: 'none', background: micOn ? '#1E293B' : '#EF4444', color: '#fff', cursor: 'pointer' }} title="Microphone">
          {micOn ? <Mic size={20} /> : <MicOff size={20} />}
        </button>
        <button onClick={toggleCam} style={{ padding: '12px', borderRadius: '50%', border: 'none', background: camOn ? '#1E293B' : '#334155', color: '#fff', cursor: 'pointer' }} title="Camera">
          {camOn ? <Video size={20} /> : <VideoOff size={20} />}
        </button>
        <button onClick={toggleScreenShare} style={{ padding: '12px', borderRadius: '50%', border: 'none', background: screenSharing ? '#06B6D4' : '#1E293B', color: '#fff', cursor: 'pointer' }} title="Share Screen">
          <MonitorUp size={20} />
        </button>
        <button
          onClick={() => {
            const next = !handRaised;
            setHandRaised(next);
            syncPresence({ handRaised: next });
          }}
          style={{ padding: '12px', borderRadius: '50%', border: 'none', background: handRaised ? '#F59E0B' : '#1E293B', color: '#fff', cursor: 'pointer' }}
          title="Raise Hand"
        >
          <Hand size={20} />
        </button>
        <button onClick={() => setSidePanel(sidePanel === 'participants' ? 'none' : 'participants')} style={{ padding: '12px', borderRadius: '50%', border: 'none', background: sidePanel === 'participants' ? '#6366F1' : '#1E293B', color: '#fff', cursor: 'pointer' }} title="Participants">
          <Users size={20} />
        </button>
        <button onClick={() => setSidePanel(sidePanel === 'chat' ? 'none' : 'chat')} style={{ padding: '12px', borderRadius: '50%', border: 'none', background: sidePanel === 'chat' ? '#6366F1' : '#1E293B', color: '#fff', cursor: 'pointer' }} title="Meeting Chat">
          <MessageSquare size={20} />
        </button>
        <button onClick={() => setSidePanel(sidePanel === 'breakout' ? 'none' : 'breakout')} style={{ padding: '12px', borderRadius: '50%', border: 'none', background: sidePanel === 'breakout' ? '#6366F1' : '#1E293B', color: '#fff', cursor: 'pointer' }} title="Breakout Rooms">
          <Layers size={20} />
        </button>
        <button onClick={onClose} style={{ padding: '12px 20px', borderRadius: '999px', border: 'none', background: '#EF4444', color: '#fff', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <PhoneOff size={18} />
          <span>Leave</span>
        </button>
      </div>
    </div>
  );
};

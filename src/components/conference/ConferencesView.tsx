import React, { useState, useEffect, useCallback } from 'react';
import {
  Video,
  Plus,
  Users,
  Calendar,
  Clock,
  Lock,
  ArrowRight,
  KeyRound,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../common/Toast';
import { Modal } from '../common/Modal';
import { OutlinedButton } from '../common/OutlinedButton';
import {
  createConferenceRoom,
  listMyConferences,
  joinConferenceByCode,
} from '../../services/conferenceService';
import { listMyContacts } from '../../services/contactService';
import type { ConferenceRoom, ContactRecord, MeetingType } from '../../types';
import { ConferenceRoomModal } from './ConferenceRoomModal';

export const ConferencesView: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [rooms, setRooms] = useState<ConferenceRoom[]>([]);
  const [contacts, setContacts] = useState<ContactRecord[]>([]);
  const [activeRoom, setActiveRoom] = useState<ConferenceRoom | null>(null);
  const [joinCode, setJoinCode] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Create form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [meetingType, setMeetingType] = useState<MeetingType>('video');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [maxParticipants, setMaxParticipants] = useState(25);
  const [selectedInvitees, setSelectedInvitees] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  const loadRooms = useCallback(async () => {
    if (!user) return;
    const [rList, cList] = await Promise.all([
      listMyConferences(user.id),
      listMyContacts(user.id),
    ]);
    setRooms(rList);
    setContacts(cList);
  }, [user]);

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title.trim()) {
      showToast('Please enter a meeting title.', 'error');
      return;
    }
    setIsCreating(true);
    const { room, error } = await createConferenceRoom({
      hostId: user.id,
      title,
      description,
      meetingType,
      durationMinutes,
      maxParticipants,
      inviteeIds: selectedInvitees,
    });
    setIsCreating(false);
    if (error || !room) {
      showToast(error || 'Failed to create meeting.', 'error');
      return;
    }
    setShowCreateModal(false);
    setTitle('');
    setDescription('');
    setSelectedInvitees([]);
    setActiveRoom(room);
    loadRooms();
  };

  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !joinCode.trim()) return;
    const { room, error } = await joinConferenceByCode(joinCode, user.id);
    if (error || !room) {
      showToast(error || 'Unable to join meeting.', 'error');
      return;
    }
    setJoinCode('');
    setActiveRoom(room);
  };

  return (
    <div style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-app)', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '18px 24px 14px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-card)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Video size={22} color="var(--color-cyan)" />
            <div>
              <h2 style={{ fontFamily: 'var(--font-brand)', fontSize: '1.3rem', fontWeight: 800, margin: 0 }}>
                Group Conferencing
              </h2>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <ShieldCheck size={12} color="var(--color-success)" />
                Authenticated SFU/WebRTC Meetings • No anonymous guest access
              </div>
            </div>
          </div>

          <OutlinedButton variant="primary" onClick={() => setShowCreateModal(true)} icon={<Plus size={16} />}>
            Create Meeting
          </OutlinedButton>
        </div>

        {/* Join by Code Bar */}
        <form onSubmit={handleJoinByCode} style={{ display: 'flex', gap: '8px', marginTop: '14px', maxWidth: '460px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <KeyRound size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="input-field"
              placeholder="Enter authorized meeting code (e.g. GC-XXXXXX)"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              style={{ paddingLeft: '36px', width: '100%' }}
            />
          </div>
          <OutlinedButton type="submit" variant="secondary" icon={<ArrowRight size={15} />}>
            Join
          </OutlinedButton>
        </form>
      </div>

      {/* Meetings List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '18px 24px', maxWidth: '900px', width: '100%', margin: '0 auto' }}>
        {rooms.length === 0 ? (
          <div className="card" style={{ padding: '40px 24px', textAlign: 'center' }}>
            <Users size={38} color="var(--color-primary)" style={{ marginBottom: '12px' }} />
            <h3 style={{ margin: '0 0 6px' }}>No Active or Scheduled Meetings</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '16px' }}>
              Start an audio conference, video conference, study meeting, or presentation with your authorized Guru Chat contacts.
            </p>
            <OutlinedButton variant="primary" onClick={() => setShowCreateModal(true)} icon={<Plus size={16} />}>
              Start New Meeting
            </OutlinedButton>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
            {rooms.map((r) => (
              <div key={r.id} className="card" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                  <div>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        padding: '3px 8px',
                        borderRadius: 'var(--radius-full)',
                        background: 'var(--color-primary-light)',
                        color: 'var(--color-primary)',
                      }}
                    >
                      {r.meeting_type.replace('_', ' ')}
                    </span>
                    <h3 style={{ margin: '8px 0 4px', fontSize: '1.05rem', fontWeight: 700 }}>{r.title}</h3>
                  </div>
                  {r.is_locked && <Lock size={16} color="var(--color-warning)" />}
                </div>

                {r.description && (
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>{r.description}</p>
                )}

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <KeyRound size={12} /> {r.room_code}
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={12} /> {r.duration_minutes}m
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={12} /> {new Date(r.scheduled_at).toLocaleDateString()}
                  </span>
                </div>

                <OutlinedButton variant="primary" onClick={() => setActiveRoom(r)} icon={<Video size={15} />}>
                  Join Meeting
                </OutlinedButton>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Meeting Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create Authorized Meeting" maxWidth="540px">
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label className="input-label">Meeting Title *</label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. Architecture Sync or Study Group"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="input-label">Description</label>
            <textarea
              className="input-field"
              rows={2}
              placeholder="Agenda or topic..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
            <div>
              <label className="input-label">Type</label>
              <select
                className="input-field"
                value={meetingType}
                onChange={(e) => setMeetingType(e.target.value as MeetingType)}
              >
                <option value="video">Video Conference</option>
                <option value="audio">Audio Conference</option>
                <option value="team_meeting">Team Meeting</option>
                <option value="study_meeting">Study Meeting</option>
                <option value="group_discussion">Group Discussion</option>
                <option value="presentation">Presentation</option>
              </select>
            </div>
            <div>
              <label className="input-label">Duration (min)</label>
              <input
                type="number"
                className="input-field"
                min={15}
                max={240}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="input-label">Max Limit</label>
              <input
                type="number"
                className="input-field"
                min={2}
                max={100}
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(Number(e.target.value))}
              />
            </div>
          </div>

          {contacts.length > 0 && (
            <div>
              <label className="input-label">Invite Contacts ({selectedInvitees.length} selected)</label>
              <div style={{ maxHeight: '140px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', padding: '8px', borderRadius: 'var(--radius-md)', background: 'var(--bg-input)' }}>
                {contacts.map((c) => {
                  const p = c.profile;
                  if (!p) return null;
                  const checked = selectedInvitees.includes(p.id);
                  return (
                    <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.84rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedInvitees((prev) => [...prev, p.id]);
                          else setSelectedInvitees((prev) => prev.filter((id) => id !== p.id));
                        }}
                      />
                      <span>{p.display_name} (@{p.username})</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
            <OutlinedButton variant="secondary" type="button" onClick={() => setShowCreateModal(false)}>
              Cancel
            </OutlinedButton>
            <OutlinedButton variant="primary" type="submit" isLoading={isCreating}>
              Launch Meeting
            </OutlinedButton>
          </div>
        </form>
      </Modal>

      {/* Active Conference Room */}
      {activeRoom && (
        <ConferenceRoomModal
          room={activeRoom}
          onClose={() => {
            setActiveRoom(null);
            loadRooms();
          }}
        />
      )}
    </div>
  );
};

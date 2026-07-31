import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Search, Users, MessageCircle, Hash, User, Send, Check, CheckCheck, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import {
  fetchChannelsForUser,
  getOrCreateBatchChannels,
  getOrCreateDMChannel,
  fetchMessages,
  sendMessage,
  subscribeToMessages,
  markChannelAsRead,
  markMessageAsRead,
  subscribeToTyping,
  broadcastTyping,
  searchUsers,
} from '../lib/chat';
import type { ChannelWithMeta, Message } from '../lib/chat';

const COLORS = {
  bg: '#FBFBF9',
  text: '#0D1E14',
  textMuted: '#4A5D53',
  sage: '#CCDAC6',
  lavender: '#D9CFF5',
  blue: '#C7E4F2',
  terracotta: '#8A4A38',
  white: '#FFFFFF',
  border: '#0D1E14',
  warning: '#FFD166',
};

const Chat: React.FC = () => {
  const navigate = useNavigate();
  const { channelId: urlChannelId } = useParams<{ channelId?: string }>();
  const [searchParams] = useSearchParams();

  // Auth & Profile
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentProfile, setCurrentProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Channels
  const [channels, setChannels] = useState<ChannelWithMeta[]>([]);
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const [channelsLoading, setChannelsLoading] = useState(true);

  // Messages
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);

  // Typing
  const [typingUsers, setTypingUsers] = useState<{ userId: string; userName: string }[]>([]);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingChannelRef = useRef<any>(null);

  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearch, setShowSearch] = useState(false);

  // Realtime subscription ref
  const messageSubRef = useRef<any>(null);

  // Sidebar mobile toggle
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate('/auth'); return; }

      setCurrentUser(session.user);

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profile) {
        setCurrentProfile(profile);
        await getOrCreateBatchChannels({
          id: session.user.id,
          graduation_year: profile.graduation_year,
          branch: profile.branch,
        });
      }

      let userChannels = await fetchChannelsForUser(session.user.id);
      const seen = new Set();
      userChannels = userChannels.filter(ch => {
        const duplicate = seen.has(ch.id);
        seen.add(ch.id);
        return !duplicate;
      });
      const nameSeen = new Set();
      userChannels = userChannels.filter(ch => {
        if (ch.type === 'dm') return true;
        const duplicate = nameSeen.has(ch.name);
        nameSeen.add(ch.name);
        return !duplicate;
      });

      setChannels(userChannels);
      setChannelsLoading(false);

      const dmUserId = searchParams.get('dm');
      if (dmUserId && dmUserId !== session.user.id) {
        const { data: dmProfile } = await supabase.from('profiles').select('full_name').eq('id', dmUserId).single();
        const dmChannel = await getOrCreateDMChannel(session.user.id, dmUserId, dmProfile?.full_name || 'User');
        if (dmChannel) {
          const refreshed = await fetchChannelsForUser(session.user.id);
          setChannels(refreshed);
          setActiveChannelId(dmChannel.id);
          setLoading(false);
          return;
        }
      }

      if (urlChannelId) {
        setActiveChannelId(urlChannelId);
      } else if (userChannels.length > 0) {
        setActiveChannelId(userChannels[0].id);
      }

      setLoading(false);
    };
    init();
  }, [navigate, urlChannelId, searchParams]);

  useEffect(() => {
    if (!activeChannelId || !currentUser) return;

    const loadMessages = async () => {
      setMessagesLoading(true);
      const msgs = await fetchMessages(activeChannelId);
      setMessages(msgs);
      setMessagesLoading(false);

      await markChannelAsRead(activeChannelId, currentUser.id);

      for (const msg of msgs) {
        if (msg.sender_id !== currentUser.id && !msg.read_by?.includes(currentUser.id)) {
          await markMessageAsRead(msg.id, currentUser.id);
        }
      }

      setChannels(prev => prev.map(ch =>
        ch.id === activeChannelId ? { ...ch, unread_count: 0 } : ch
      ));
    };

    loadMessages();

    if (messageSubRef.current) {
      supabase.removeChannel(messageSubRef.current);
    }
    messageSubRef.current = subscribeToMessages(activeChannelId, async (newMsg) => {
      const { data: senderProfile } = await supabase.from('profiles').select('full_name').eq('id', newMsg.sender_id).single();
      const enriched: Message = { ...newMsg, sender_name: senderProfile?.full_name || 'Unknown' };
      setMessages(prev => [...prev, enriched]);

      if (newMsg.sender_id !== currentUser.id) {
        await markMessageAsRead(newMsg.id, currentUser.id);
        await markChannelAsRead(activeChannelId, currentUser.id);
      }
    });

    if (typingChannelRef.current) {
      supabase.removeChannel(typingChannelRef.current);
    }
    typingChannelRef.current = subscribeToTyping(activeChannelId, currentUser.id, setTypingUsers);

    return () => {
      if (messageSubRef.current) supabase.removeChannel(messageSubRef.current);
      if (typingChannelRef.current) supabase.removeChannel(typingChannelRef.current);
    };
  }, [activeChannelId, currentUser]);

  const handleSend = useCallback(async (text: string) => {
    if (!activeChannelId || !currentUser || !text.trim()) return;
    await sendMessage(activeChannelId, currentUser.id, text.trim());
    if (typingChannelRef.current) {
      await broadcastTyping(typingChannelRef.current, currentUser.id, currentProfile?.full_name || 'User', false);
    }
  }, [activeChannelId, currentUser, currentProfile]);

  const handleTyping = useCallback(() => {
    if (!typingChannelRef.current || !currentUser) return;
    broadcastTyping(typingChannelRef.current, currentUser.id, currentProfile?.full_name || 'User', true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      if (typingChannelRef.current) {
        broadcastTyping(typingChannelRef.current, currentUser.id, currentProfile?.full_name || 'User', false);
      }
    }, 2000);
  }, [currentUser, currentProfile]);

  useEffect(() => {
    if (!searchQuery.trim() || !currentUser) {
      setSearchResults([]);
      return;
    }
    const timeout = setTimeout(async () => {
      const results = await searchUsers(searchQuery, currentUser.id);
      setSearchResults(results);
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchQuery, currentUser]);

  const handleStartDM = async (otherUser: any) => {
    if (!currentUser) return;
    const channel = await getOrCreateDMChannel(currentUser.id, otherUser.id, otherUser.full_name);
    if (channel) {
      setShowSearch(false);
      setSearchQuery('');
      const userChannels = await fetchChannelsForUser(currentUser.id);
      setChannels(userChannels);
      setActiveChannelId(channel.id);
    }
  };

  const activeChannel = channels.find(ch => ch.id === activeChannelId);

  const getChannelDisplayName = (ch: ChannelWithMeta) => {
    if (ch.type === 'dm') return ch.dm_partner_name || 'Direct Message';
    return ch.name;
  };

  const getChannelIcon = (ch: ChannelWithMeta) => {
    if (ch.type === 'dm') return <User size={16} strokeWidth={2.5} />;
    if (ch.type === 'batch_branch') return <Hash size={16} strokeWidth={2.5} />;
    return <Users size={16} strokeWidth={2.5} />;
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const groupMessagesByDate = (msgs: Message[]) => {
    const groups: { date: string; messages: Message[] }[] = [];
    let currentDate = '';
    for (const msg of msgs) {
      const d = new Date(msg.created_at).toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric',
      });
      if (d !== currentDate) {
        currentDate = d;
        groups.push({ date: d, messages: [msg] });
      } else {
        groups[groups.length - 1].messages.push(msg);
      }
    }
    return groups;
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: COLORS.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '36px', height: '36px', border: `4px solid ${COLORS.border}`, borderTopColor: COLORS.sage, borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  const messageGroups = groupMessagesByDate(messages);

  return (
    <div style={{ minHeight: '100vh', background: COLORS.bg, display: 'flex', flexDirection: 'column', fontFamily: '"Inter", sans-serif' }}>
      {/* Header */}
      <header style={{
        padding: '1.25rem 2rem',
        background: COLORS.white,
        borderBottom: `2px solid ${COLORS.border}`,
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}>
        <button 
          onClick={() => navigate('/dashboard')} 
          style={{ 
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.5rem 1rem', borderRadius: '99px',
            background: COLORS.white, border: `2px solid ${COLORS.border}`,
            color: COLORS.text, fontWeight: 800, cursor: 'pointer',
            boxShadow: '4px 4px 0px rgba(13,30,20,1)', textTransform: 'uppercase', fontSize: '0.8125rem'
          }}
        >
          <ArrowLeft size={16} strokeWidth={2.5} /> Back
        </button>
        <h1 style={{ fontSize: '1.5rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 900, color: COLORS.text, textTransform: 'uppercase', letterSpacing: '-0.02em' }}>
          <MessageCircle size={24} strokeWidth={2.5} color={COLORS.text} /> Messages
        </h1>
      </header>

      {/* Main Chat Layout */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', height: 'calc(100vh - 85px)' }}>
        {/* Sidebar */}
        <aside style={{
          width: '340px', minWidth: '340px', background: COLORS.white,
          borderRight: `2px solid ${COLORS.border}`, display: 'flex', flexDirection: 'column',
          transition: 'transform 0.3s ease', transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)'
        }}>
          {/* Search */}
          <div style={{ padding: '1.5rem', borderBottom: `2px solid ${COLORS.border}` }}>
            <div style={{ position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: COLORS.text }} strokeWidth={2.5} />
              <input
                type="text"
                placeholder="Find a classmate..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setShowSearch(true); }}
                onFocus={() => setShowSearch(true)}
                style={{
                  width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', 
                  borderRadius: '99px', border: `2px solid ${COLORS.border}`,
                  background: COLORS.bg, color: COLORS.text, fontWeight: 700,
                  outline: 'none', fontSize: '0.875rem'
                }}
              />
            </div>
          </div>

          {/* Search Results */}
          {showSearch && searchQuery.trim() && (
            <div style={{ background: COLORS.bg, borderBottom: `2px solid ${COLORS.border}`, maxHeight: '300px', overflowY: 'auto' }}>
              {searchResults.length === 0 ? (
                <div style={{ padding: '1.5rem', textAlign: 'center', color: COLORS.textMuted, fontWeight: 600, fontSize: '0.875rem' }}>No users found</div>
              ) : (
                searchResults.map(user => (
                  <button
                    key={user.id}
                    onClick={() => handleStartDM(user)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', width: '100%',
                      textAlign: 'left', border: 'none', background: 'transparent', cursor: 'pointer',
                      borderBottom: `1px solid ${COLORS.border}`
                    }}
                  >
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: COLORS.lavender, color: COLORS.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, border: `2px solid ${COLORS.border}`, flexShrink: 0 }}>
                      {user.full_name.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.9375rem', color: COLORS.text }}>{user.full_name}</div>
                      <div style={{ fontSize: '0.75rem', color: COLORS.textMuted, fontWeight: 600, textTransform: 'uppercase' }}>
                        {user.graduation_year ? `Class of ${user.graduation_year}` : user.user_type}
                        {user.branch ? ` • ${user.branch}` : ''}
                      </div>
                    </div>
                  </button>
                ))
              )}
              <button 
                onClick={() => { setShowSearch(false); setSearchQuery(''); }}
                style={{ display: 'block', width: '100%', padding: '0.75rem', textAlign: 'center', fontSize: '0.8125rem', color: COLORS.text, fontWeight: 800, background: COLORS.white, border: 'none', borderTop: `2px solid ${COLORS.border}`, cursor: 'pointer', textTransform: 'uppercase' }}
              >
                Close
              </button>
            </div>
          )}

          {/* Channel List */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 0' }}>
            {channelsLoading ? (
              <div style={{ padding: '2rem', display: 'flex', justifyContent: 'center' }}>
                <div style={{ width: '24px', height: '24px', border: `3px solid ${COLORS.border}`, borderTopColor: COLORS.sage, borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              </div>
            ) : channels.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', padding: '4rem 2rem', color: COLORS.textMuted, textAlign: 'center' }}>
                <MessageCircle size={48} strokeWidth={1.5} style={{ opacity: 0.5 }} />
                <div>
                  <p style={{ fontWeight: 800, color: COLORS.text, fontSize: '1.125rem', margin: '0 0 0.25rem' }}>No conversations</p>
                  <p style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Search for classmates to start chatting</p>
                </div>
              </div>
            ) : (
              <>
                {/* Group Channels */}
                {channels.filter(ch => ch.type !== 'dm').length > 0 && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{ padding: '0 1.5rem 0.5rem', fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', color: COLORS.textMuted, letterSpacing: '0.05em' }}>Group Channels</div>
                    {channels.filter(ch => ch.type !== 'dm').map(ch => (
                      <button
                        key={ch.id}
                        onClick={() => { setActiveChannelId(ch.id); setSidebarOpen(false); }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.875rem 1.5rem', width: '100%',
                          textAlign: 'left', border: 'none', cursor: 'pointer',
                          background: activeChannelId === ch.id ? COLORS.sage : 'transparent',
                          borderLeft: activeChannelId === ch.id ? `4px solid ${COLORS.border}` : '4px solid transparent',
                          borderTop: `1px solid ${COLORS.bg}`, borderBottom: `1px solid ${COLORS.bg}`
                        }}
                      >
                        <div style={{ 
                          width: '40px', height: '40px', borderRadius: '12px', background: activeChannelId === ch.id ? COLORS.white : COLORS.bg, 
                          border: `2px solid ${COLORS.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: COLORS.text, flexShrink: 0,
                          boxShadow: activeChannelId === ch.id ? 'none' : '2px 2px 0px rgba(13,30,20,1)'
                        }}>
                          {getChannelIcon(ch)}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 900, fontSize: '0.9375rem', color: COLORS.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{getChannelDisplayName(ch)}</div>
                          {ch.last_message && (
                            <div style={{ fontSize: '0.8125rem', color: activeChannelId === ch.id ? COLORS.text : COLORS.textMuted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 600, marginTop: '0.125rem' }}>
                              {ch.last_message.length > 40 ? ch.last_message.slice(0, 40) + '...' : ch.last_message}
                            </div>
                          )}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.375rem', flexShrink: 0 }}>
                          {ch.last_message_at && (
                            <span style={{ fontSize: '0.75rem', color: activeChannelId === ch.id ? COLORS.text : COLORS.textMuted, fontWeight: 700 }}>{formatTime(ch.last_message_at)}</span>
                          )}
                          {(ch.unread_count ?? 0) > 0 && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0 6px', minWidth: '20px', height: '20px', borderRadius: '10px', background: COLORS.warning, color: COLORS.text, fontSize: '0.6875rem', fontWeight: 900, border: `2px solid ${COLORS.border}` }}>
                              {ch.unread_count}
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* DM Channels */}
                {channels.filter(ch => ch.type === 'dm').length > 0 && (
                  <div>
                    <div style={{ padding: '0 1.5rem 0.5rem', fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', color: COLORS.textMuted, letterSpacing: '0.05em' }}>Direct Messages</div>
                    {channels.filter(ch => ch.type === 'dm').map(ch => (
                      <button
                        key={ch.id}
                        onClick={() => { setActiveChannelId(ch.id); setSidebarOpen(false); }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.875rem 1.5rem', width: '100%',
                          textAlign: 'left', border: 'none', cursor: 'pointer',
                          background: activeChannelId === ch.id ? COLORS.lavender : 'transparent',
                          borderLeft: activeChannelId === ch.id ? `4px solid ${COLORS.border}` : '4px solid transparent',
                          borderTop: `1px solid ${COLORS.bg}`, borderBottom: `1px solid ${COLORS.bg}`
                        }}
                      >
                        <div style={{ 
                          width: '40px', height: '40px', borderRadius: '50%', background: activeChannelId === ch.id ? COLORS.white : COLORS.bg, 
                          border: `2px solid ${COLORS.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: COLORS.text, flexShrink: 0, fontWeight: 900, fontSize: '1.125rem',
                          boxShadow: activeChannelId === ch.id ? 'none' : '2px 2px 0px rgba(13,30,20,1)'
                        }}>
                          {(ch.dm_partner_name || '?').charAt(0)}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 900, fontSize: '0.9375rem', color: COLORS.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{getChannelDisplayName(ch)}</div>
                          {ch.last_message && (
                            <div style={{ fontSize: '0.8125rem', color: activeChannelId === ch.id ? COLORS.text : COLORS.textMuted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 600, marginTop: '0.125rem' }}>
                              {ch.last_message.length > 35 ? ch.last_message.slice(0, 35) + '...' : ch.last_message}
                            </div>
                          )}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.375rem', flexShrink: 0 }}>
                          {ch.last_message_at && (
                            <span style={{ fontSize: '0.75rem', color: activeChannelId === ch.id ? COLORS.text : COLORS.textMuted, fontWeight: 700 }}>{formatTime(ch.last_message_at)}</span>
                          )}
                          {(ch.unread_count ?? 0) > 0 && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0 6px', minWidth: '20px', height: '20px', borderRadius: '10px', background: COLORS.warning, color: COLORS.text, fontSize: '0.6875rem', fontWeight: 900, border: `2px solid ${COLORS.border}` }}>
                              {ch.unread_count}
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </aside>

        {/* Main Chat Area */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: COLORS.bg }}>
          {!activeChannelId ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', color: COLORS.text }}>
              <div style={{ width: '96px', height: '96px', borderRadius: '24px', background: COLORS.white, border: `4px solid ${COLORS.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '8px 8px 0px rgba(13,30,20,1)', marginBottom: '1rem' }}>
                <MessageCircle size={48} strokeWidth={2.5} color={COLORS.text} />
              </div>
              <h2 style={{ fontSize: '2rem', margin: 0, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.02em' }}>Messages</h2>
              <p style={{ fontSize: '1.125rem', color: COLORS.textMuted, fontWeight: 600 }}>Select a conversation to start chatting</p>
            </div>
          ) : (
            <>
              {/* Channel Header */}
              <div style={{ padding: '1.25rem 2rem', borderBottom: `2px solid ${COLORS.border}`, display: 'flex', alignItems: 'center', gap: '1rem', background: COLORS.white }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: COLORS.blue, border: `2px solid ${COLORS.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: COLORS.text, boxShadow: '4px 4px 0px rgba(13,30,20,1)' }}>
                  {activeChannel && getChannelIcon(activeChannel)}
                </div>
                <div>
                  <h2 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 900, color: COLORS.text, textTransform: 'uppercase' }}>
                    {activeChannel ? getChannelDisplayName(activeChannel) : 'Chat'}
                  </h2>
                  {activeChannel && activeChannel.type !== 'dm' && (
                    <span style={{ fontSize: '0.8125rem', color: COLORS.textMuted, fontWeight: 700, textTransform: 'uppercase' }}>
                      {activeChannel.type === 'batch_year' ? 'Batch Year Group' : 'Branch Group'}
                    </span>
                  )}
                </div>
                {activeChannel?.type === 'dm' && activeChannel.dm_partner_id && (
                  <button
                    style={{ 
                      marginLeft: 'auto', padding: '0.625rem 1.25rem', borderRadius: '99px',
                      background: COLORS.white, border: `2px solid ${COLORS.border}`,
                      color: COLORS.text, fontWeight: 800, cursor: 'pointer',
                      boxShadow: '4px 4px 0px rgba(13,30,20,1)', textTransform: 'uppercase', fontSize: '0.8125rem'
                    }}
                    onClick={() => navigate(`/profile/${activeChannel.dm_partner_id}`)}
                  >
                    View Profile
                  </button>
                )}
              </div>

              {/* Message Area */}
              <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                {messagesLoading ? (
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: '32px', height: '32px', border: `4px solid ${COLORS.border}`, borderTopColor: COLORS.sage, borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                  </div>
                ) : messages.length === 0 ? (
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: COLORS.textMuted, fontSize: '1.125rem', fontWeight: 700 }}>
                    <p>No messages yet. Be the first to say hello! 👋</p>
                  </div>
                ) : (
                  <div style={{ flex: 1, overflowY: 'auto', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {messageGroups.map((group) => (
                      <React.Fragment key={group.date}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '2rem 0' }}>
                          <span style={{ padding: '0.375rem 1rem', background: COLORS.white, border: `2px solid ${COLORS.border}`, borderRadius: '9999px', fontSize: '0.75rem', color: COLORS.text, fontWeight: 900, textTransform: 'uppercase', boxShadow: '2px 2px 0px rgba(13,30,20,1)' }}>
                            {group.date}
                          </span>
                        </div>
                        {group.messages.map((msg) => {
                          const isMine = msg.sender_id === currentUser?.id;
                          const isRead = msg.read_by && msg.read_by.length > (isMine ? 0 : -1);
                          return (
                            <div
                              key={msg.id}
                              style={{
                                display: 'flex', gap: '0.75rem', maxWidth: '75%', marginBottom: '0.5rem',
                                alignSelf: isMine ? 'flex-end' : 'flex-start',
                                flexDirection: isMine ? 'row-reverse' : 'row'
                              }}
                            >
                              {!isMine && (
                                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: COLORS.lavender, border: `2px solid ${COLORS.border}`, color: COLORS.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.875rem', flexShrink: 0, marginTop: '1.5rem', boxShadow: '2px 2px 0px rgba(13,30,20,1)' }}>
                                  {(msg.sender_name || '?').charAt(0)}
                                </div>
                              )}
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                {!isMine && activeChannel?.type !== 'dm' && (
                                  <div style={{ fontSize: '0.75rem', fontWeight: 900, color: COLORS.text, marginBottom: '0.25rem', paddingLeft: '0.25rem', textTransform: 'uppercase' }}>{msg.sender_name}</div>
                                )}
                                <div style={{
                                  padding: '1rem 1.25rem', borderRadius: '20px', lineHeight: 1.5, wordBreak: 'break-word',
                                  background: isMine ? COLORS.sage : COLORS.white,
                                  color: COLORS.text, border: `2px solid ${COLORS.border}`,
                                  boxShadow: '4px 4px 0px rgba(13,30,20,1)',
                                  borderBottomRightRadius: isMine ? '4px' : '20px',
                                  borderBottomLeftRadius: !isMine ? '4px' : '20px'
                                }}>
                                  <p style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>{msg.content}</p>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginTop: '0.5rem', justifyContent: 'flex-end' }}>
                                    <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: COLORS.text, opacity: 0.8 }}>
                                      {new Date(msg.created_at).toLocaleTimeString('en-US', {
                                        hour: 'numeric', minute: '2-digit', hour12: true,
                                      })}
                                    </span>
                                    {isMine && (
                                      <span style={{ display: 'flex', alignItems: 'center', color: COLORS.text }}>
                                        {isRead && msg.read_by.length > 0 ? (
                                          <CheckCheck size={16} strokeWidth={3} />
                                        ) : (
                                          <Check size={16} strokeWidth={3} />
                                        )}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </React.Fragment>
                    ))}

                    {/* Typing indicator */}
                    {typingUsers.length > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', color: COLORS.text, fontWeight: 700, fontSize: '0.875rem' }}>
                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                          <span style={{ width: '8px', height: '8px', background: COLORS.border, borderRadius: '50%', animation: 'bounce 1s infinite alternate' }}></span>
                          <span style={{ width: '8px', height: '8px', background: COLORS.border, borderRadius: '50%', animation: 'bounce 1s infinite alternate', animationDelay: '0.2s' }}></span>
                          <span style={{ width: '8px', height: '8px', background: COLORS.border, borderRadius: '50%', animation: 'bounce 1s infinite alternate', animationDelay: '0.4s' }}></span>
                        </div>
                        <span style={{ textTransform: 'uppercase' }}>
                          {typingUsers.map(u => u.userName).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Message Input */}
              <div style={{ padding: '1.5rem 2rem', background: COLORS.white, borderTop: `2px solid ${COLORS.border}` }}>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const input = e.currentTarget.querySelector('input') as HTMLInputElement;
                    if (input.value.trim()) {
                      handleSend(input.value);
                      input.value = '';
                    }
                  }}
                  style={{ display: 'flex', gap: '1rem' }}
                >
                  <input
                    type="text"
                    placeholder="Type a message..."
                    onChange={handleTyping}
                    autoFocus
                    style={{ 
                      flex: 1, padding: '1rem 1.5rem', 
                      borderRadius: '99px', border: `2px solid ${COLORS.border}`,
                      background: COLORS.bg, color: COLORS.text, fontWeight: 600,
                      outline: 'none', fontSize: '1rem'
                    }}
                  />
                  <button 
                    type="submit" 
                    style={{ 
                      width: '56px', height: '56px', borderRadius: '50%',
                      background: COLORS.warning, border: `2px solid ${COLORS.border}`,
                      color: COLORS.text, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                      boxShadow: '4px 4px 0px rgba(13,30,20,1)'
                    }}
                  >
                    <Send size={24} strokeWidth={2.5} style={{ transform: 'translateX(-2px)' }} />
                  </button>
                </form>
              </div>
            </>
          )}
        </main>
      </div>
      <style>{`
        @keyframes bounce {
          0% { transform: translateY(0); }
          100% { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  );
};

export default Chat;

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Search, Users, MessageCircle, Hash, User, Send, Check, CheckCheck, Circle, Loader2 } from 'lucide-react';
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

import '@chatscope/chat-ui-kit-styles/dist/default/styles.min.css';
import {
  MainContainer,
  ChatContainer,
  MessageList,
  MessageInput,
  ConversationList,
  Conversation,
  Avatar,
  TypingIndicator,
  MessageSeparator,
} from '@chatscope/chat-ui-kit-react';

// ─── Chat Page ───
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

  // ─── Init: Auth + Profile + Batch Channels ───
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
        // Auto-create/join batch channels
        await getOrCreateBatchChannels({
          id: session.user.id,
          graduation_year: profile.graduation_year,
          branch: profile.branch,
        });
      }

      // Fetch all channels
      let userChannels = await fetchChannelsForUser(session.user.id);

      // Deduplicate channels based on channel ID
      const seen = new Set();
      userChannels = userChannels.filter(ch => {
        const duplicate = seen.has(ch.id);
        seen.add(ch.id);
        return !duplicate;
      });
      
      // Additional deduplication for batch year / branch if duplicates exist in DB
      const nameSeen = new Set();
      userChannels = userChannels.filter(ch => {
        if (ch.type === 'dm') return true;
        const duplicate = nameSeen.has(ch.name);
        nameSeen.add(ch.name);
        return !duplicate;
      });

      setChannels(userChannels);
      setChannelsLoading(false);

      // Handle ?dm=userId from Directory/Profile "Message" buttons
      const dmUserId = searchParams.get('dm');
      if (dmUserId && dmUserId !== session.user.id) {
        // Get the target user's name
        const { data: dmProfile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', dmUserId)
          .single();

        const dmChannel = await getOrCreateDMChannel(
          session.user.id,
          dmUserId,
          dmProfile?.full_name || 'User'
        );
        if (dmChannel) {
          // Refresh channels and select the DM
          const refreshed = await fetchChannelsForUser(session.user.id);
          setChannels(refreshed);
          setActiveChannelId(dmChannel.id);
          setLoading(false);
          return;
        }
      }

      // Select channel from URL or first available
      if (urlChannelId) {
        setActiveChannelId(urlChannelId);
      } else if (userChannels.length > 0) {
        setActiveChannelId(userChannels[0].id);
      }

      setLoading(false);
    };
    init();
  }, [navigate, urlChannelId]);

  // ─── Load Messages when active channel changes ───
  useEffect(() => {
    if (!activeChannelId || !currentUser) return;

    const loadMessages = async () => {
      setMessagesLoading(true);
      const msgs = await fetchMessages(activeChannelId);
      setMessages(msgs);
      setMessagesLoading(false);

      // Mark as read
      await markChannelAsRead(activeChannelId, currentUser.id);

      // Mark each message as read
      for (const msg of msgs) {
        if (msg.sender_id !== currentUser.id && !msg.read_by?.includes(currentUser.id)) {
          await markMessageAsRead(msg.id, currentUser.id);
        }
      }

      // Update channel unread counts locally
      setChannels(prev => prev.map(ch =>
        ch.id === activeChannelId ? { ...ch, unread_count: 0 } : ch
      ));
    };

    loadMessages();

    // Subscribe to new messages
    if (messageSubRef.current) {
      supabase.removeChannel(messageSubRef.current);
    }
    messageSubRef.current = subscribeToMessages(activeChannelId, async (newMsg) => {
      // Enrich with sender name
      const { data: senderProfile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', newMsg.sender_id)
        .single();

      const enriched: Message = {
        ...newMsg,
        sender_name: senderProfile?.full_name || 'Unknown',
      };

      setMessages(prev => [...prev, enriched]);

      // If we're looking at this channel, mark as read
      if (newMsg.sender_id !== currentUser.id) {
        await markMessageAsRead(newMsg.id, currentUser.id);
        await markChannelAsRead(activeChannelId, currentUser.id);
      }
    });

    // Typing subscription
    if (typingChannelRef.current) {
      supabase.removeChannel(typingChannelRef.current);
    }
    typingChannelRef.current = subscribeToTyping(
      activeChannelId,
      currentUser.id,
      setTypingUsers
    );

    return () => {
      if (messageSubRef.current) {
        supabase.removeChannel(messageSubRef.current);
      }
      if (typingChannelRef.current) {
        supabase.removeChannel(typingChannelRef.current);
      }
    };
  }, [activeChannelId, currentUser]);

  // ─── Send Message ───
  const handleSend = useCallback(async (text: string) => {
    if (!activeChannelId || !currentUser || !text.trim()) return;

    await sendMessage(activeChannelId, currentUser.id, text.trim());

    // Stop typing indicator
    if (typingChannelRef.current) {
      await broadcastTyping(typingChannelRef.current, currentUser.id, currentProfile?.full_name || 'User', false);
    }
  }, [activeChannelId, currentUser, currentProfile]);

  // ─── Typing broadcast ───
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

  // ─── Search Users for DM ───
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
      // Refresh channel list
      const userChannels = await fetchChannelsForUser(currentUser.id);
      setChannels(userChannels);
      setActiveChannelId(channel.id);
    }
  };

  // ─── Helpers ───
  const activeChannel = channels.find(ch => ch.id === activeChannelId);

  const getChannelDisplayName = (ch: ChannelWithMeta) => {
    if (ch.type === 'dm') return ch.dm_partner_name || 'Direct Message';
    return ch.name;
  };

  const getChannelIcon = (ch: ChannelWithMeta) => {
    if (ch.type === 'dm') return <User size={16} />;
    if (ch.type === 'batch_branch') return <Hash size={16} />;
    return <Users size={16} />;
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

  // ─── Loading ───
  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
        <Loader2 className="animate-spin" size={28} color="var(--brand-primary)" />
      </div>
    );
  }

  const messageGroups = groupMessagesByDate(messages);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header className="chat-header">
        <button onClick={() => navigate('/dashboard')} className="btn btn-ghost" style={{ padding: '0.5rem 0.75rem' }}>
          <ArrowLeft size={18} /> Back
        </button>
        <MessageCircle size={20} color="var(--brand-primary)" />
        <h1 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 600 }}>Messages</h1>

        <button
          className="btn btn-ghost chat-sidebar-toggle"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{ marginLeft: 'auto', display: 'none' }}
        >
          ☰
        </button>
      </header>

      {/* Main Chat Layout */}
      <div className="chat-layout">
        {/* Sidebar — Channel List */}
        <aside className={`chat-sidebar ${sidebarOpen ? 'open' : ''}`}>
          {/* Search / New DM */}
          <div className="chat-sidebar-header">
            <div className="chat-search-container">
              <Search size={16} className="chat-search-icon" />
              <input
                type="text"
                className="chat-search-input"
                placeholder="Find a classmate..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setShowSearch(true); }}
                onFocus={() => setShowSearch(true)}
              />
            </div>
          </div>

          {/* Search Results Dropdown */}
          {showSearch && searchQuery.trim() && (
            <div className="chat-search-results">
              {searchResults.length === 0 ? (
                <div className="chat-search-empty">No users found</div>
              ) : (
                searchResults.map(user => (
                  <button
                    key={user.id}
                    className="chat-search-result-item"
                    onClick={() => handleStartDM(user)}
                  >
                    <div className="chat-avatar-sm">
                      {user.full_name.charAt(0)}
                    </div>
                    <div>
                      <div className="chat-search-result-name">{user.full_name}</div>
                      <div className="chat-search-result-meta">
                        {user.graduation_year ? `Class of ${user.graduation_year}` : user.user_type}
                        {user.branch ? ` • ${user.branch}` : ''}
                      </div>
                    </div>
                  </button>
                ))
              )}
              <button className="chat-search-close" onClick={() => { setShowSearch(false); setSearchQuery(''); }}>
                Close
              </button>
            </div>
          )}

          {/* Channel List */}
          <div className="chat-channel-list">
            {channelsLoading ? (
              <div className="flex-center" style={{ padding: '2rem' }}>
                <Loader2 className="animate-spin" size={20} color="var(--brand-primary)" />
              </div>
            ) : channels.length === 0 ? (
              <div className="chat-empty-channels">
                <MessageCircle size={32} style={{ opacity: 0.3 }} />
                <p>No conversations yet</p>
                <p style={{ fontSize: '0.75rem' }}>Search for classmates to start chatting</p>
              </div>
            ) : (
              <>
                {/* Group Channels */}
                {channels.filter(ch => ch.type !== 'dm').length > 0 && (
                  <div className="chat-channel-section">
                    <div className="chat-channel-section-title">Group Channels</div>
                    {channels.filter(ch => ch.type !== 'dm').map(ch => (
                      <button
                        key={ch.id}
                        className={`chat-channel-item ${activeChannelId === ch.id ? 'active' : ''}`}
                        onClick={() => { setActiveChannelId(ch.id); setSidebarOpen(false); }}
                      >
                        <div className="chat-channel-item-icon">{getChannelIcon(ch)}</div>
                        <div className="chat-channel-item-content">
                          <div className="chat-channel-item-name">{getChannelDisplayName(ch)}</div>
                          {ch.last_message && (
                            <div className="chat-channel-item-preview">
                              {ch.last_message.length > 40 ? ch.last_message.slice(0, 40) + '...' : ch.last_message}
                            </div>
                          )}
                        </div>
                        <div className="chat-channel-item-meta">
                          {ch.last_message_at && (
                            <span className="chat-channel-time">{formatTime(ch.last_message_at)}</span>
                          )}
                          {(ch.unread_count ?? 0) > 0 && (
                            <span className="chat-unread-badge">{ch.unread_count}</span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* DM Channels */}
                {channels.filter(ch => ch.type === 'dm').length > 0 && (
                  <div className="chat-channel-section">
                    <div className="chat-channel-section-title">Direct Messages</div>
                    {channels.filter(ch => ch.type === 'dm').map(ch => (
                      <button
                        key={ch.id}
                        className={`chat-channel-item ${activeChannelId === ch.id ? 'active' : ''}`}
                        onClick={() => { setActiveChannelId(ch.id); setSidebarOpen(false); }}
                      >
                        <div className="chat-avatar-sm">
                          {(ch.dm_partner_name || '?').charAt(0)}
                        </div>
                        <div className="chat-channel-item-content">
                          <div className="chat-channel-item-name">{getChannelDisplayName(ch)}</div>
                          {ch.last_message && (
                            <div className="chat-channel-item-preview">
                              {ch.last_message.length > 35 ? ch.last_message.slice(0, 35) + '...' : ch.last_message}
                            </div>
                          )}
                        </div>
                        <div className="chat-channel-item-meta">
                          {ch.last_message_at && (
                            <span className="chat-channel-time">{formatTime(ch.last_message_at)}</span>
                          )}
                          {(ch.unread_count ?? 0) > 0 && (
                            <span className="chat-unread-badge">{ch.unread_count}</span>
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
        <main className="chat-main">
          {!activeChannelId ? (
            <div className="chat-empty-state">
              <div className="chat-empty-state-icon">
                <MessageCircle size={48} />
              </div>
              <h2>Welcome to Messages</h2>
              <p>Select a conversation or search for classmates to start chatting</p>
            </div>
          ) : (
            <>
              {/* Channel Header */}
              <div className="chat-channel-header">
                <div className="chat-channel-header-icon">
                  {activeChannel && getChannelIcon(activeChannel)}
                </div>
                <div>
                  <h2 className="chat-channel-header-name">
                    {activeChannel ? getChannelDisplayName(activeChannel) : 'Chat'}
                  </h2>
                  {activeChannel && activeChannel.type !== 'dm' && (
                    <span className="chat-channel-header-type">
                      {activeChannel.type === 'batch_year' ? 'Batch Year Group' : 'Branch Group'}
                    </span>
                  )}
                </div>
                {activeChannel?.type === 'dm' && activeChannel.dm_partner_id && (
                  <button
                    className="btn btn-ghost"
                    style={{ marginLeft: 'auto', fontSize: '0.8125rem' }}
                    onClick={() => navigate(`/profile/${activeChannel.dm_partner_id}`)}
                  >
                    View Profile
                  </button>
                )}
              </div>

              {/* Message Area */}
              <div className="chat-messages-area">
                {messagesLoading ? (
                  <div className="flex-center" style={{ height: '100%' }}>
                    <Loader2 className="animate-spin" size={24} color="var(--brand-primary)" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="chat-empty-messages">
                    <p>No messages yet. Be the first to say hello! 👋</p>
                  </div>
                ) : (
                  <div className="chat-messages-scroll">
                    {messageGroups.map((group) => (
                      <React.Fragment key={group.date}>
                        <div className="chat-date-separator">
                          <span>{group.date}</span>
                        </div>
                        {group.messages.map((msg) => {
                          const isMine = msg.sender_id === currentUser?.id;
                          const isRead = msg.read_by && msg.read_by.length > (isMine ? 0 : -1);
                          return (
                            <div
                              key={msg.id}
                              className={`chat-message ${isMine ? 'mine' : 'theirs'}`}
                            >
                              {!isMine && (
                                <div className="chat-message-avatar">
                                  {(msg.sender_name || '?').charAt(0)}
                                </div>
                              )}
                              <div className="chat-message-wrapper">
                                {!isMine && activeChannel?.type !== 'dm' && (
                                  <div className="chat-message-sender">{msg.sender_name}</div>
                                )}
                                <div className={`chat-message-bubble ${isMine ? 'mine' : 'theirs'}`}>
                                  <p>{msg.content}</p>
                                  <div className="chat-message-meta">
                                    <span className="chat-message-time">
                                      {new Date(msg.created_at).toLocaleTimeString('en-US', {
                                        hour: 'numeric',
                                        minute: '2-digit',
                                        hour12: true,
                                      })}
                                    </span>
                                    {isMine && (
                                      <span className="chat-message-read">
                                        {isRead && msg.read_by.length > 0 ? (
                                          <CheckCheck size={14} className="chat-read-icon" />
                                        ) : (
                                          <Check size={14} />
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
                      <div className="chat-typing-indicator">
                        <div className="chat-typing-dots">
                          <span></span><span></span><span></span>
                        </div>
                        <span>
                          {typingUsers.map(u => u.userName).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Message Input */}
              <div className="chat-input-container">
                <form
                  className="chat-input-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const input = e.currentTarget.querySelector('input') as HTMLInputElement;
                    if (input.value.trim()) {
                      handleSend(input.value);
                      input.value = '';
                    }
                  }}
                >
                  <input
                    type="text"
                    className="chat-input-field"
                    placeholder="Type a message..."
                    onChange={handleTyping}
                    autoFocus
                  />
                  <button type="submit" className="chat-send-btn">
                    <Send size={18} />
                  </button>
                </form>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default Chat;

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  ArrowLeft,
  Check,
  CheckCheck,
  Hash,
  MessageCircle,
  Search,
  Send,
  User,
  Users,
} from 'lucide-react';
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
import { Avatar, Skeleton } from '../components/ui';
import { cx } from '../components/ui/internal';
import { SPRING } from '../lib/motion';
import styles from './Chat.module.css';

const Chat: React.FC = () => {
  const navigate = useNavigate();
  const { channelId: urlChannelId } = useParams<{ channelId?: string }>();
  const [searchParams] = useSearchParams();
  const reduced = useReducedMotion() ?? false;

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

  // UI-only state
  const [mobilePane, setMobilePane] = useState<'list' | 'thread'>('list');
  const [draft, setDraft] = useState('');
  const endRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const listSearchRef = useRef<HTMLInputElement>(null);

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
          setMobilePane('thread');
          setLoading(false);
          return;
        }
      }

      if (urlChannelId) {
        setActiveChannelId(urlChannelId);
        setMobilePane('thread');
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

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'end' });
  }, [messages, activeChannelId, reduced]);

  // Auto-grow composer up to 5 lines
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = '0px';
    const max = 1.35 * 16 * 5 + 16; // ~5 lines (font-size 16, line-height 1.35) + padding
    el.style.height = `${Math.min(el.scrollHeight, max)}px`;
  }, [draft]);

  const handleStartDM = async (otherUser: any) => {
    if (!currentUser) return;
    const channel = await getOrCreateDMChannel(currentUser.id, otherUser.id, otherUser.full_name);
    if (channel) {
      setShowSearch(false);
      setSearchQuery('');
      const userChannels = await fetchChannelsForUser(currentUser.id);
      setChannels(userChannels);
      setActiveChannelId(channel.id);
      setMobilePane('thread');
    }
  };

  const activeChannel = channels.find(ch => ch.id === activeChannelId);

  const getChannelDisplayName = (ch: ChannelWithMeta) => {
    if (ch.type === 'dm') return ch.dm_partner_name || 'Direct Message';
    return ch.name;
  };

  const getChannelIcon = (ch: ChannelWithMeta) => {
    if (ch.type === 'dm') return <User size={16} strokeWidth={1.75} />;
    if (ch.type === 'batch_branch') return <Hash size={16} strokeWidth={1.75} />;
    return <Users size={16} strokeWidth={1.75} />;
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

  const sendDraft = async () => {
    const text = draft.trim();
    if (!text) return;
    setDraft('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    await handleSend(text);
  };

  if (loading) {
    return (
      <div className={styles.wrap} aria-busy="true" aria-label="Loading messages">
        <div className={styles.panes}>
          <aside className={styles.listPane}>
            <div className={styles.listHeader}>
              <Skeleton width={120} height={24} radius={8} />
              <Skeleton height={40} radius={999} />
            </div>
            <div className={styles.listScroll}>
              {Array.from({ length: 7 }, (_, i) => (
                <div key={i} className={styles.skelRow}>
                  <Skeleton width={44} height={44} radius="circle" />
                  <div className={styles.skelCol}>
                    <Skeleton width="60%" height={14} />
                    <Skeleton width="85%" height={12} />
                  </div>
                </div>
              ))}
            </div>
          </aside>
          <section className={styles.threadPane}>
            <div className={styles.threadHeader}>
              <Skeleton width={40} height={40} radius="circle" />
              <div style={{ flex: 1 }}><Skeleton width={160} height={16} /><div style={{ height: 6 }} /><Skeleton width={100} height={12} /></div>
            </div>
            <div className={styles.skelMsgs}>
              <Skeleton width="55%" height={38} radius={18} className={styles.skelBubbleL} />
              <Skeleton width="40%" height={38} radius={18} className={styles.skelBubbleR} />
              <Skeleton width="48%" height={38} radius={18} className={styles.skelBubbleL} />
            </div>
          </section>
        </div>
      </div>
    );
  }

  const messageGroups = groupMessagesByDate(messages);
  const groupChannels = channels.filter(ch => ch.type !== 'dm');
  const dmChannels = channels.filter(ch => ch.type === 'dm');

  // Find last own message for read receipt text
  const lastOwnMessageId = [...messages].reverse().find((m) => m.sender_id === currentUser?.id)?.id;

  const renderRows = (items: ChannelWithMeta[]) =>
    items.map((ch) => {
      const active = activeChannelId === ch.id;
      const name = getChannelDisplayName(ch);
      return (
        <button
          key={ch.id}
          type="button"
          className={styles.row}
          aria-current={active ? 'true' : undefined}
          onClick={() => { setActiveChannelId(ch.id); setMobilePane('thread'); }}
        >
          {active && (
            <motion.span
              layoutId="chat-row-highlight"
              className={styles.rowHighlight}
              aria-hidden="true"
              transition={reduced ? { duration: 0.12 } : SPRING}
            />
          )}
          <span className={styles.rowInner}>
            <Avatar name={name} size="sm" />
            <span className={styles.rowBody}>
              <span className={styles.rowTop}>
                <span className={styles.rowName}>{name}</span>
                {ch.last_message_at && <span className={styles.rowTime}>{formatTime(ch.last_message_at)}</span>}
              </span>
              <span className={styles.rowBottom}>
                <span className={styles.rowPreview}>
                  {ch.last_message ? (ch.last_message.length > 44 ? ch.last_message.slice(0, 44) + '…' : ch.last_message) : 'No messages yet'}
                </span>
                {(ch.unread_count ?? 0) > 0 && (
                  <span className={styles.unread} aria-label={`${ch.unread_count} unread`}>
                    {ch.unread_count}
                  </span>
                )}
              </span>
            </span>
          </span>
        </button>
      );
    });

  return (
    <div className={cx(styles.wrap, mobilePane === 'thread' && styles.mobileThread)}>
      <div className={styles.panes}>
        {/* Conversation list */}
        <aside className={styles.listPane} aria-label="Conversations">
          <div className={styles.listHeader}>
            <div className={styles.listTitleRow}>
              <h1 className={styles.listTitle}>Messages</h1>
            </div>
            <div className={styles.searchBox}>
              <Search size={16} strokeWidth={1.75} className={styles.searchIcon} aria-hidden="true" />
              <input
                ref={listSearchRef}
                type="text"
                className={styles.searchInput}
                placeholder="Search or start a message"
                aria-label="Search people to message"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setShowSearch(true); }}
                onFocus={() => setShowSearch(true)}
              />
            </div>
          </div>

          {/* Search Results (preserved DM-start logic) */}
          {showSearch && searchQuery.trim() && (
            <div className={styles.searchResults}>
              {searchResults.length === 0 ? (
                <div className={styles.searchEmpty}>No users found</div>
              ) : (
                searchResults.map((user) => (
                  <button key={user.id} type="button" className={styles.searchResultRow} onClick={() => handleStartDM(user)}>
                    <Avatar name={user.full_name} size="sm" />
                    <span style={{ minWidth: 0 }}>
                      <span className={styles.rowName} style={{ display: 'block' }}>{user.full_name}</span>
                      <span className={styles.searchMeta}>
                        {user.graduation_year ? `Class of ${user.graduation_year}` : user.user_type}
                        {user.branch ? ` · ${user.branch}` : ''}
                      </span>
                    </span>
                  </button>
                ))
              )}
              <button type="button" className={styles.closeSearch} onClick={() => { setShowSearch(false); setSearchQuery(''); }}>
                Close
              </button>
            </div>
          )}

          <div className={styles.listScroll}>
            {channelsLoading ? (
              Array.from({ length: 6 }, (_, i) => (
                <div key={i} className={styles.skelRow}>
                  <Skeleton width={44} height={44} radius="circle" />
                  <div className={styles.skelCol}>
                    <Skeleton width="55%" height={14} />
                    <Skeleton width="80%" height={12} />
                  </div>
                </div>
              ))
            ) : channels.length === 0 ? (
              <div style={{ padding: '32px 20px', textAlign: 'center' }}>
                <MessageCircle size={28} strokeWidth={1.75} style={{ color: 'var(--text-3)', margin: '0 auto 8px' }} aria-hidden="true" />
                <p style={{ margin: 0, font: 'var(--type-headline)', fontSize: 16, color: 'var(--text)' }}>No conversations</p>
                <p style={{ margin: '4px 0 0', font: 'var(--type-footnote)', color: 'var(--text-2)' }}>Search for classmates to start chatting.</p>
              </div>
            ) : (
              <>
                {groupChannels.length > 0 && (
                  <div>
                    <div className={styles.sectionLabel}>Batch groups</div>
                    {renderRows(groupChannels)}
                  </div>
                )}
                {dmChannels.length > 0 && (
                  <div>
                    <div className={styles.sectionLabel}>Direct messages</div>
                    {renderRows(dmChannels)}
                  </div>
                )}
              </>
            )}
          </div>
        </aside>

        {/* Thread */}
        <section className={styles.threadPane} aria-label="Conversation">
          {!activeChannelId ? (
            <div className={styles.emptyThread}>
              <div className={styles.emptyThreadInner}>
                <div className={styles.emptyIcon}><MessageCircle size={28} strokeWidth={1.75} /></div>
                <h2 className={styles.emptyTitle}>Messages</h2>
                <p className={styles.emptyText}>Select a conversation to start chatting.</p>
              </div>
            </div>
          ) : (
            <>
              <header className={styles.threadHeader}>
                <button type="button" className={styles.backBtn} aria-label="Back to conversations" onClick={() => setMobilePane('list')}>
                  <ArrowLeft size={18} strokeWidth={1.75} />
                </button>
                <Avatar name={activeChannel ? getChannelDisplayName(activeChannel) : 'Chat'} size="sm" />
                <div className={styles.threadTitleWrap}>
                  <h2 className={styles.threadTitle}>{activeChannel ? getChannelDisplayName(activeChannel) : 'Chat'}</h2>
                  <p className={styles.threadSub}>
                    {typingUsers.length > 0 ? (
                      <>
                        <span className={styles.dots} aria-hidden="true">
                          <span className={styles.dot} /><span className={styles.dot} /><span className={styles.dot} />
                        </span>
                        <span>{typingUsers.map(u => u.userName).join(', ')} typing…</span>
                      </>
                    ) : activeChannel && activeChannel.type !== 'dm' ? (
                      activeChannel.type === 'batch_year' ? 'Batch year group' : 'Branch group'
                    ) : (
                      'Direct message'
                    )}
                  </p>
                </div>
                <span style={{ color: 'var(--text-3)', display: 'inline-flex' }} aria-hidden="true">
                  {activeChannel && getChannelIcon(activeChannel)}
                </span>
                {activeChannel?.type === 'dm' && activeChannel.dm_partner_id && (
                  <button type="button" className={styles.headerAction} onClick={() => navigate(`/profile/${activeChannel.dm_partner_id}`)}>
                    View profile
                  </button>
                )}
              </header>

              <div className={styles.messages} aria-live="polite">
                {messagesLoading ? (
                  <div className={styles.skelMsgs} aria-busy="true">
                    <Skeleton width="52%" height={40} radius={18} className={styles.skelBubbleL} />
                    <Skeleton width="38%" height={40} radius={18} className={styles.skelBubbleR} />
                    <Skeleton width="46%" height={40} radius={18} className={styles.skelBubbleL} />
                    <Skeleton width="34%" height={40} radius={18} className={styles.skelBubbleR} />
                  </div>
                ) : messages.length === 0 ? (
                  <div className={styles.emptyThread}>
                    <div className={styles.emptyThreadInner}>
                      <div className={styles.emptyIcon}><MessageCircle size={28} strokeWidth={1.75} /></div>
                      <h2 className={styles.emptyTitle}>No messages yet</h2>
                      <p className={styles.emptyText}>Be the first to say hello.</p>
                    </div>
                  </div>
                ) : (
                  messageGroups.map((group) => (
                    <React.Fragment key={group.date}>
                      <div className={styles.dateSep}><span className={styles.datePill}>{group.date}</span></div>
                      {group.messages.map((msg, idx) => {
                        const isMine = msg.sender_id === currentUser?.id;
                        const prev = group.messages[idx - 1];
                        const next = group.messages[idx + 1];
                        const sameAsPrev = prev && prev.sender_id === msg.sender_id;
                        const sameAsNext = next && next.sender_id === msg.sender_id;
                        const isFirstInGroup = !sameAsPrev;
                        const isLastInGroup = !sameAsNext;
                        const tailClass = isMine
                          ? isFirstInGroup && isLastInGroup ? '' : isLastInGroup ? styles.tailMineLast : isFirstInGroup ? styles.tailMineFirst : styles.tailMineMid
                          : isFirstInGroup && isLastInGroup ? '' : isLastInGroup ? styles.tailTheirsLast : isFirstInGroup ? styles.tailTheirsFirst : styles.tailTheirsMid;

                        const isRead = !!(msg.read_by && msg.read_by.length > 0);
                        const showReceipt = isMine && msg.id === lastOwnMessageId;
                        const receiptText = activeChannel?.type === 'dm'
                          ? (isRead ? 'Read' : 'Delivered')
                          : (isRead ? 'Seen' : 'Sent');

                        return (
                          <motion.div
                            key={msg.id}
                            className={cx(styles.msgRow, isMine ? styles.msgMine : styles.msgTheirs)}
                            style={{ marginTop: isFirstInGroup ? 6 : 1 }}
                            initial={reduced ? false : { opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={reduced ? { duration: 0.1 } : SPRING}
                          >
                            <div className={styles.msgStack}>
                              {!isMine && isFirstInGroup && activeChannel?.type !== 'dm' && (
                                <span className={styles.senderName}>{msg.sender_name}</span>
                              )}
                              <div className={cx(styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs, tailClass)}>
                                {msg.content}
                              </div>
                              {isLastInGroup && (
                                <span className={styles.msgMeta}>
                                  {new Date(msg.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                                  {isMine && (
                                    <span aria-hidden="true" style={{ display: 'inline-flex' }}>
                                      {isRead && msg.read_by.length > 0 ? <CheckCheck size={13} strokeWidth={2} /> : <Check size={13} strokeWidth={2} />}
                                    </span>
                                  )}
                                </span>
                              )}
                              {showReceipt && <span className={styles.receipt}>{receiptText}</span>}
                            </div>
                          </motion.div>
                        );
                      })}
                    </React.Fragment>
                  ))
                )}
                <div ref={endRef} />
              </div>

              {/* Composer: floating glass pill, auto-grow up to 5 lines, send scales in */}
              <div className={styles.composer}>
                <div className={styles.composerInner}>
                  <textarea
                    ref={textareaRef}
                    className={styles.composerInput}
                    placeholder="Message"
                    aria-label="Type a message"
                    rows={1}
                    value={draft}
                    onChange={(e) => { setDraft(e.target.value); handleTyping(); }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        void sendDraft();
                      }
                    }}
                  />
                  <AnimatePresence initial={false}>
                    {draft.trim().length > 0 && (
                      <motion.button
                        type="button"
                        className={styles.sendBtn}
                        aria-label="Send message"
                        onClick={() => void sendDraft()}
                        initial={reduced ? { opacity: 1 } : { scale: 0.6, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={reduced ? { opacity: 0 } : { scale: 0.6, opacity: 0 }}
                        transition={reduced ? { duration: 0.1 } : SPRING}
                      >
                        <Send size={16} strokeWidth={2} style={{ transform: 'translateX(1px)' }} aria-hidden="true" />
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
};

export default Chat;

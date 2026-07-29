import { supabase } from './supabase';

// ─── Types ───
export interface Channel {
  id: string;
  name: string;
  type: 'batch_year' | 'batch_branch' | 'dm';
  graduation_year?: number;
  branch?: string;
  created_at: string;
}

export interface ChannelMember {
  id: string;
  channel_id: string;
  user_id: string;
  joined_at: string;
  last_read_at: string;
}

export interface Message {
  id: string;
  channel_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read_by: string[];
  // Joined from profiles
  sender_name?: string;
  sender_avatar?: string;
}

export interface ChannelWithMeta extends Channel {
  last_message?: string;
  last_message_at?: string;
  unread_count?: number;
  dm_partner_name?: string;
  dm_partner_id?: string;
}

// ─── Batch Group Channels ───

/**
 * Auto-create and join batch year + batch+branch group channels for a user.
 * Returns the channels the user now belongs to.
 */
export async function getOrCreateBatchChannels(profile: {
  id: string;
  graduation_year?: number;
  branch?: string;
}): Promise<Channel[]> {
  const channels: Channel[] = [];
  if (!profile.graduation_year) return channels;

  // 1. Batch year channel (e.g. "Class of 2024")
  const yearName = `Class of ${profile.graduation_year}`;
  const yearChannel = await findOrCreateChannel({
    name: yearName,
    type: 'batch_year',
    graduation_year: profile.graduation_year,
  });
  if (yearChannel) {
    await joinChannel(yearChannel.id, profile.id);
    channels.push(yearChannel);
  }

  // 2. Batch + branch channel (e.g. "Class of 2024 — Computer Science")
  if (profile.branch) {
    const branchName = `Class of ${profile.graduation_year} — ${profile.branch}`;
    const branchChannel = await findOrCreateChannel({
      name: branchName,
      type: 'batch_branch',
      graduation_year: profile.graduation_year,
      branch: profile.branch,
    });
    if (branchChannel) {
      await joinChannel(branchChannel.id, profile.id);
      channels.push(branchChannel);
    }
  }

  return channels;
}

async function findOrCreateChannel(params: {
  name: string;
  type: string;
  graduation_year?: number;
  branch?: string;
}): Promise<Channel | null> {
  // Try to find existing
  let query = supabase
    .from('channels')
    .select('*')
    .eq('type', params.type)
    .eq('name', params.name)
    .order('created_at', { ascending: true })
    .limit(1);

  const { data: existing, error: selectError } = await query.maybeSingle();
  
  if (selectError) {
    console.error("Error finding existing channel:", selectError);
  }

  if (existing) return existing as Channel;

  // Create new
  const { data: created, error } = await supabase
    .from('channels')
    .insert({
      name: params.name,
      type: params.type,
      graduation_year: params.graduation_year || null,
      branch: params.branch || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error in findOrCreateChannel:', error);
    if (error.code !== '23505') { // If not a unique constraint violation, it's likely an RLS error
      alert(`Failed to create group channel: ${error.message}`);
    }
    // Race condition — another user created it first. Try to fetch again.
    const { data: retry } = await supabase
      .from('channels')
      .select('*')
      .eq('type', params.type)
      .eq('name', params.name)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();
    return retry as Channel | null;
  }
  return created as Channel;
}

async function joinChannel(channelId: string, userId: string) {
  const { error } = await supabase
    .from('channel_members')
    .upsert({ channel_id: channelId, user_id: userId }, { onConflict: 'channel_id,user_id' });
  if (error) {
    console.error('Error joining channel:', error);
    alert(`Failed to join group channel: ${error.message}`);
  }
}

// ─── DM Channels ───

/**
 * Get or create a private DM channel between two users.
 */
export async function getOrCreateDMChannel(
  currentUserId: string,
  otherUserId: string,
  otherUserName: string
): Promise<Channel | null> {
  // Check if DM already exists between these two users
  const { data: myChannels } = await supabase
    .from('channel_members')
    .select('channel_id')
    .eq('user_id', currentUserId);

  if (myChannels && myChannels.length > 0) {
    const myChannelIds = myChannels.map((c) => c.channel_id);

    // Find DM channels where the other user is also a member
    const { data: sharedDMs } = await supabase
      .from('channel_members')
      .select('channel_id')
      .eq('user_id', otherUserId)
      .in('channel_id', myChannelIds);

    if (sharedDMs && sharedDMs.length > 0) {
      const sharedIds = sharedDMs.map((c) => c.channel_id);
      // Check if any of these are DM type
      const { data: dmChannel } = await supabase
        .from('channels')
        .select('*')
        .eq('type', 'dm')
        .in('id', sharedIds)
        .maybeSingle();

      if (dmChannel) return dmChannel as Channel;
    }
  }

  // Create a new DM channel
  const { data: newChannel, error } = await supabase
    .from('channels')
    .insert({
      name: `DM`, // We'll display the partner's name in the UI
      type: 'dm',
    })
    .select()
    .single();

  if (error || !newChannel) {
    console.error('Error creating DM channel:', error);
    alert(`Failed to create DM channel: ${error?.message || 'Unknown error'}`);
    return null;
  }

  // Add both users as members
  const { error: memberError } = await supabase.from('channel_members').insert([
    { channel_id: newChannel.id, user_id: currentUserId },
    { channel_id: newChannel.id, user_id: otherUserId },
  ]);

  if (memberError) {
    console.error('Error adding DM channel members:', memberError);
    alert(`Failed to add users to DM: ${memberError.message}`);
  }

  return newChannel as Channel;
}

// ─── Fetch Channels ───

/**
 * Fetch all channels a user belongs to, with metadata (last message, unread count, DM partner).
 */
export async function fetchChannelsForUser(userId: string): Promise<ChannelWithMeta[]> {
  // Get channel IDs user is a member of
  const { data: memberships } = await supabase
    .from('channel_members')
    .select('channel_id, last_read_at')
    .eq('user_id', userId);

  if (!memberships || memberships.length === 0) return [];

  const channelIds = memberships.map((m) => m.channel_id);
  const lastReadMap = new Map(memberships.map((m) => [m.channel_id, m.last_read_at]));

  // Fetch channels
  const { data: channels } = await supabase
    .from('channels')
    .select('*')
    .in('id', channelIds);

  if (!channels) return [];

  // Build enriched channel list in parallel to solve N+1 sequential query overhead
  const enriched: ChannelWithMeta[] = await Promise.all(
    channels.map(async (ch) => {
      const meta: ChannelWithMeta = { ...ch };

      // Prepare parallel metadata fetching tasks for this channel
      const lastMsgPromise = supabase
        .from('messages')
        .select('content, created_at')
        .eq('channel_id', ch.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const lastRead = lastReadMap.get(ch.id);
      const unreadCountPromise = lastRead
        ? supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('channel_id', ch.id)
            .gt('created_at', lastRead)
        : Promise.resolve({ count: 0 });

      // Run last message and unread count queries in parallel
      const [lastMsgResult, unreadCountResult] = await Promise.all([
        lastMsgPromise,
        unreadCountPromise,
      ]);

      if (lastMsgResult.data) {
        meta.last_message = lastMsgResult.data.content;
        meta.last_message_at = lastMsgResult.data.created_at;
      }
      meta.unread_count = unreadCountResult.count || 0;

      // Handle DM partner details
      if (ch.type === 'dm') {
        const { data: members } = await supabase
          .from('channel_members')
          .select('user_id')
          .eq('channel_id', ch.id)
          .neq('user_id', userId);

        if (members && members.length > 0) {
          const partnerId = members[0].user_id;
          meta.dm_partner_id = partnerId;
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', partnerId)
            .single();
          meta.dm_partner_name = profile?.full_name || 'Unknown';
        }
      }

      return meta;
    })
  );

  // Sort: most recent message first
  enriched.sort((a, b) => {
    const aTime = a.last_message_at || a.created_at;
    const bTime = b.last_message_at || b.created_at;
    return new Date(bTime).getTime() - new Date(aTime).getTime();
  });

  return enriched;
}

// ─── Messages ───

export async function fetchMessages(channelId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('channel_id', channelId)
    .order('created_at', { ascending: true })
    .limit(200);

  if (error || !data) return [];

  // Enrich with sender names
  const senderIds = [...new Set(data.map((m) => m.sender_id))];
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('id', senderIds);

  const nameMap = new Map(profiles?.map((p) => [p.id, p.full_name]) || []);

  return data.map((m) => ({
    ...m,
    sender_name: nameMap.get(m.sender_id) || 'Unknown',
  }));
}

export async function sendMessage(channelId: string, senderId: string, content: string) {
  const { error } = await supabase.from('messages').insert({
    channel_id: channelId,
    sender_id: senderId,
    content,
  });
  return !error;
}

// ─── Read Receipts ───

export async function markChannelAsRead(channelId: string, userId: string) {
  // Update last_read_at
  await supabase
    .from('channel_members')
    .update({ last_read_at: new Date().toISOString() })
    .eq('channel_id', channelId)
    .eq('user_id', userId);
}

export async function markMessageAsRead(messageId: string, userId: string) {
  // Add userId to read_by array if not already there
  const { data: msg } = await supabase
    .from('messages')
    .select('read_by')
    .eq('id', messageId)
    .single();

  if (msg && !msg.read_by?.includes(userId)) {
    await supabase
      .from('messages')
      .update({ read_by: [...(msg.read_by || []), userId] })
      .eq('id', messageId);
  }
}

// ─── Realtime Subscription ───

export function subscribeToMessages(
  channelId: string,
  onNewMessage: (message: any) => void
) {
  const subscription = supabase
    .channel(`messages:${channelId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `channel_id=eq.${channelId}`,
      },
      (payload) => {
        onNewMessage(payload.new);
      }
    )
    .subscribe();

  return subscription;
}

// ─── Typing Indicators (Presence) ───

export function subscribeToTyping(
  channelId: string,
  userId: string,
  onTypingChange: (typingUsers: { userId: string; userName: string }[]) => void
) {
  const channel = supabase.channel(`typing:${channelId}`, {
    config: { presence: { key: userId } },
  });

  channel
    .on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const typingUsers: { userId: string; userName: string }[] = [];
      for (const [key, value] of Object.entries(state)) {
        if (key !== userId) {
          const presences = value as any[];
          for (const p of presences) {
            if (p.is_typing) {
              typingUsers.push({ userId: key, userName: p.user_name || 'Someone' });
            }
          }
        }
      }
      onTypingChange(typingUsers);
    })
    .subscribe();

  return channel;
}

export async function broadcastTyping(
  channel: any,
  userId: string,
  userName: string,
  isTyping: boolean
) {
  await channel.track({
    user_id: userId,
    user_name: userName,
    is_typing: isTyping,
  });
}

// ─── Search Users ───

export async function searchUsers(query: string, currentUserId: string) {
  const { data } = await supabase
    .from('profiles')
    .select('id, full_name, graduation_year, branch, user_type')
    .neq('id', currentUserId)
    .ilike('full_name', `%${query}%`)
    .limit(10);

  return data || [];
}

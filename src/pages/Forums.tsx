import React, { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { MessageCircle, MessageSquare, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { UserProfile } from './Directory';
import { NewPostModal } from '../components/NewPostModal';
import { PageHeader } from '../components/shell/PageHeader';
import { Avatar, Badge, Button, EmptyState, Skeleton } from '../components/ui';
import { listStagger, SPRING } from '../lib/motion';
import styles from './Forums.module.css';

export interface ForumPost {
  id: string;
  author_id: string;
  title: string;
  content: string;
  category: string;
  replies_count: number;
  created_at: string;
  profiles?: { full_name: string };
}

const forumCategories = ['General Discussion', 'Career Advice', 'Tech & Engineering', 'Startups & Entrepreneurship'];

const timeAgo = (dateStr: string) => {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
};

const Forums: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState(forumCategories[0]);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [isNewPostModalOpen, setIsNewPostModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const reduced = useReducedMotion() ?? false;

  React.useEffect(() => {
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
        setCurrentUser(profile as UserProfile);
      }

      const { data, error } = await supabase
        .from('forum_posts')
        .select('*, profiles:author_id(full_name)')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setPosts(data as unknown as ForumPost[]);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const isApproved = currentUser?.user_type === 'admin' || currentUser?.verification_status === 'approved';
  const batchName = currentUser?.graduation_year ? `Batch ${currentUser.graduation_year}` : null;

  const handleCreatePost = async (title: string, content: string, category: string) => {
    if (!currentUser) return;
    try {
      const { data, error } = await supabase
        .from('forum_posts')
        .insert([{ title, content, category, author_id: currentUser.id }])
        .select('*, profiles:author_id(full_name)')
        .single();

      if (error) throw error;
      setPosts([data as unknown as ForumPost, ...posts]);
      setIsNewPostModalOpen(false);
    } catch (error: any) {
      alert('Error creating post: ' + error.message);
    }
  };

  const filteredPosts =
    batchName && currentUser?.graduation_year
      ? posts.filter((p) => p.category === batchName || p.category === selectedCategory)
      : posts.filter((p) => p.category === selectedCategory);

  const stagger = listStagger();

  return (
    <div className={styles.page}>
      <PageHeader
        title="Forums"
        subtitle="Discuss ideas, ask questions, and connect with your community."
        actions={
          <Button
            iconLeft={<Plus size={18} strokeWidth={1.75} />}
            onClick={() => setIsNewPostModalOpen(true)}
            disabled={!isApproved}
          >
            New post
          </Button>
        }
      />

      {!isApproved && currentUser && (
        <div className={styles.lockedNote}>
          Your account is pending verification. You can browse discussions, but posting is unlocked once you’re approved.
        </div>
      )}

      <div className={styles.layout}>
        <nav className={styles.sidebar} aria-label="Categories">
          <div className={styles.sideTitle}>Categories</div>
          <div className={styles.catList}>
            {forumCategories.map((cat) => {
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  className={styles.catBtn}
                  aria-current={active ? 'true' : undefined}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {active && !reduced && (
                    <motion.span
                      layoutId="forums-cat-indicator"
                      className={styles.catIndicator}
                      aria-hidden="true"
                      transition={SPRING}
                    />
                  )}
                  {active && reduced && <span className={styles.catIndicator} aria-hidden="true" />}
                  <span className={styles.catLabel}>{cat}</span>
                </button>
              );
            })}
          </div>
        </nav>

        <section className={styles.feed} aria-label="Posts">
          {loading ? (
            Array.from({ length: 4 }, (_, i) => (
              <div key={i} className={styles.skelCard}>
                <div className={styles.skelRow}>
                  <Skeleton width={40} height={40} radius="circle" />
                  <div style={{ flex: 1 }}>
                    <Skeleton width="35%" height={14} />
                    <div style={{ height: 6 }} />
                    <Skeleton width="22%" height={12} />
                  </div>
                  <Skeleton width={72} height={22} radius={999} />
                </div>
                <Skeleton width="70%" height={18} />
                <Skeleton height={14} />
                <Skeleton width="85%" height={14} />
              </div>
            ))
          ) : filteredPosts.length === 0 ? (
            <EmptyState
              icon={<MessageSquare size={28} strokeWidth={1.75} />}
              title="No posts yet"
              description={
                isApproved
                  ? `Be the first to start a conversation in ${selectedCategory}.`
                  : `No conversations in ${selectedCategory} yet.`
              }
              action={
                isApproved ? (
                  <Button size="sm" onClick={() => setIsNewPostModalOpen(true)}>
                    Create a post
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <motion.div
              variants={reduced ? undefined : stagger.parent}
              initial={reduced ? undefined : 'hidden'}
              animate={reduced ? undefined : 'show'}
              style={{ display: 'grid', gap: 12 }}
            >
              {filteredPosts.map((post) => (
                <motion.article key={post.id} variants={reduced ? undefined : stagger.child}>
                  <button type="button" className={styles.card}>
                    <div className={styles.cardTop}>
                      <Avatar name={post.profiles?.full_name || 'User'} size="sm" />
                      <div className={styles.cardMeta}>
                        <div className={styles.author}>{post.profiles?.full_name || 'Unknown User'}</div>
                        <div className={styles.submeta}>{timeAgo(post.created_at)}</div>
                      </div>
                      <Badge variant="neutral" size="sm">
                        {post.category}
                      </Badge>
                    </div>
                    <h3 className={styles.title}>{post.title}</h3>
                    <p className={styles.preview}>{post.content}</p>
                    <div className={styles.footer}>
                      <span className={styles.replyCount}>
                        <MessageCircle size={16} strokeWidth={1.75} aria-hidden="true" />
                        {post.replies_count} replies
                      </span>
                    </div>
                  </button>
                </motion.article>
              ))}
            </motion.div>
          )}
        </section>
      </div>

      <NewPostModal
        isOpen={isNewPostModalOpen}
        onClose={() => setIsNewPostModalOpen(false)}
        currentUser={currentUser}
        categories={forumCategories}
        onSubmit={handleCreatePost}
      />
    </div>
  );
};

export default Forums;

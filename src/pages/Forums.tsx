import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { MessageCircle, MessageSquare, Plus, MoreHorizontal, Trash2, Edit2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { UserProfile } from './Directory';
import { NewPostModal } from '../components/NewPostModal';
import { EditPostModal } from '../components/EditPostModal';
import { PageHeader } from '../components/shell/PageHeader';
import {
  Avatar,
  Badge,
  Button,
  IconButton,
  Menu,
  Skeleton,
  useToast,
} from '../components/ui';
import { cx } from '../components/ui/internal';
import { useMediaQuery } from '../components/ui/useMediaQuery';
import { SPRING } from '../lib/motion';
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

const forumCategories = [
  'All',
  'General Discussion',
  'Career Advice',
  'Interview Experience',
  'Tech & Engineering',
  'Startups & Entrepreneurship',
];

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
  const [error, setError] = useState<string | null>(null);
  const [isNewPostModalOpen, setIsNewPostModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<ForumPost | null>(null);
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<DOMRect | null>(null);
  const [menuPostId, setMenuPostId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [fabCollapsed, setFabCollapsed] = useState(false);
  const lastScrollYRef = useRef(0);
  const reduced = useReducedMotion() ?? false;
  const toast = useToast();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const chipRowRef = useRef<HTMLDivElement>(null);

  const isHeaderButton = useMediaQuery('(min-width: 900px)');
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.error('[Forums] getSession error:', sessionError);
      toast.show({ title: 'Session error', description: sessionError.message, variant: 'danger' });
    }

    if (session) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      if (profileError) {
        console.error('[Forums] profile fetch error:', profileError);
        toast.show({ title: 'Profile load failed', description: profileError.message, variant: 'danger' });
      } else {
        setCurrentUser(profile as UserProfile);
      }
    }

    const { data, error } = await supabase
      .from('forum_posts')
      .select('*, profiles:author_id(full_name)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Forums] fetch posts error:', error);
      setError(error.message);
      toast.show({ title: 'Could not load posts', description: error.message, variant: 'danger' });
      setLoading(false);
      return;
    }
    if (data) {
      setPosts(data as unknown as ForumPost[]);
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const isApproved = currentUser?.user_type === 'admin' || currentUser?.verification_status === 'approved';
  const batchName = currentUser?.graduation_year ? `Batch ${currentUser.graduation_year}` : null;

  const normalize = (s: string) => String(s).trim();

  const filteredPosts = posts.filter((p) => {
    const cat = normalize(p.category);
    if (selectedCategory === 'All') return true;
    if (batchName && cat === batchName) return true;
    return cat === normalize(selectedCategory);
  });

  // Scroll the active chip into view when the category changes.
  useEffect(() => {
    const chip = chipRowRef.current?.querySelector<HTMLElement>('[aria-selected="true"]');
    chip?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: reduced ? 'auto' : 'smooth' });
  }, [selectedCategory, reduced]);

  // FAB: collapse label when scrolling down, restore when scrolling up.
  useEffect(() => {
    if (reduced || isHeaderButton) return;
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrolled = window.scrollY;
          if (scrolled > lastScrollYRef.current && scrolled > 50) {
            setFabCollapsed(true);
          } else if (scrolled < lastScrollYRef.current) {
            setFabCollapsed(false);
          }
          lastScrollYRef.current = scrolled;
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [reduced, isHeaderButton]);

  const handleCreatePost = async (title: string, content: string, category: string) => {
    if (!currentUser) return;
    try {
      const { error } = await supabase
        .from('forum_posts')
        .insert([{ title, content, category, author_id: currentUser.id }])
        .select('*, profiles:author_id(full_name)')
        .single();

      if (error) throw error;
      setIsNewPostModalOpen(false);
      await fetchPosts();
      const postedInView =
        selectedCategory === 'All' ||
        normalize(category) === normalize(selectedCategory) ||
        (batchName && normalize(category) === batchName);
      if (!postedInView) {
        setSelectedCategory(category);
      }
    } catch (error: any) {
      console.error('[Forums] create post error:', error);
      setError(error.message);
      toast.show({ title: 'Could not create post', description: error.message, variant: 'danger' });
    }
  };

  const handleEditPost = async (
    id: string,
    title: string,
    content: string,
    category: string,
  ): Promise<boolean> => {
    if (!currentUser) return false;
    try {
      const { error } = await supabase
        .from('forum_posts')
        .update({ title, content, category })
        .eq('id', id)
        .eq('author_id', currentUser.id)
        .select()
        .single();

      if (error) throw error;
      setEditingPost(null);
      await fetchPosts();
      toast.show({ title: 'Post updated', variant: 'success' });
      return true;
    } catch (error: any) {
      console.error('[Forums] update post error:', error);
      setError(error.message);
      toast.show({ title: 'Could not update post', description: error.message, variant: 'danger' });
      return false;
    }
  };

  const handleDeletePost = async (id: string): Promise<boolean> => {
    if (!currentUser) return false;
    try {
      const { error } = await supabase
        .from('forum_posts')
        .delete()
        .eq('id', id)
        .eq('author_id', currentUser.id);

      if (error) throw error;
      setDeletingPostId(null);
      await fetchPosts();
      toast.show({ title: 'Post deleted', variant: 'success' });
      return true;
    } catch (error: any) {
      console.error('[Forums] delete post error:', error);
      setError(error.message);
      toast.show({ title: 'Could not delete post', description: error.message, variant: 'danger' });
      setDeletingPostId(null);
      return false;
    }
  };

  const menuPost = menuPostId ? posts.find((p) => p.id === menuPostId) : undefined;

  return (
    <div className={styles.page}>
      <PageHeader
        className={styles.pageHeader}
        title="Forums"
        subtitle="Discuss ideas, ask questions, and connect with your community."
        actions={
          isHeaderButton ? (
            <Button
              iconLeft={<Plus size={18} strokeWidth={1.75} />}
              onClick={() => setIsNewPostModalOpen(true)}
              disabled={!isApproved}
            >
              New post
            </Button>
          ) : undefined
        }
      />

      {!isApproved && currentUser && (
        <div className={styles.lockedNote}>
          Your account is pending verification. You can browse discussions, but posting is unlocked once you’re approved.
        </div>
      )}

      {/* Category chip row (mobile + 900–1023px) replaces the desktop sidebar. */}
      <nav
        className={styles.chipRow}
        aria-label="Categories"
        role="tablist"
        ref={chipRowRef}
      >
        {forumCategories.map((cat) => {
          const active = selectedCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              className={styles.chip}
              role="tab"
              aria-selected={active}
              aria-controls={`forums-posts-${cat.replace(/\s+/g, '-').toLowerCase()}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          );
        })}
      </nav>

      <div className={styles.layout}>
        {/* Desktop category sidebar — only at 1024px+. */}
        {!isDesktop ? null : (
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
        )}

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
          ) : error ? (
            <div className={styles.errorState} role="alert" aria-live="polite">
              <div className={styles.errorIcon}>
                <MessageSquare size={24} strokeWidth={1.75} />
              </div>
              <div>
                <div className={styles.errorTitle}>Could not load posts</div>
                <div className={styles.errorMessage}>{error}</div>
              </div>
              <Button variant="secondary" onClick={fetchPosts}>
                Try again
              </Button>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <MessageSquare size={28} strokeWidth={1.75} />
              </div>
              <div className={styles.emptyTitle}>
                {selectedCategory === 'All'
                  ? 'No posts yet'
                  : `No posts in ${selectedCategory} yet`}
              </div>
              <div className={styles.emptyDescription}>
                {selectedCategory === 'All'
                  ? 'Be the first to start a conversation.'
                  : `Be the first to start a conversation in ${selectedCategory}.`}
              </div>
              {isApproved && (
                <div className={styles.emptyAction}>
                  <Button size="md" onClick={() => setIsNewPostModalOpen(true)}>
                    Create a post
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {filteredPosts.map((post) => {
                const isAuthor = Boolean(currentUser && post.author_id === currentUser.id);
                return (
                  <motion.article
                    key={post.id}
                    initial={{ opacity: 1 }}
                    whileInView={{ opacity: 1 }}
                  >
                    <button type="button" className={styles.card}>
                      <div className={styles.cardTop}>
                        <Avatar name={post.profiles?.full_name || 'User'} size="sm" />
                        <div className={styles.cardMeta}>
                          <div className={styles.author}>{post.profiles?.full_name || 'Unknown User'}</div>
                          <div className={styles.submeta}>{timeAgo(post.created_at)}</div>
                        </div>
                        <div className={styles.categoryBadge}>
                          <Badge variant="neutral" size="sm">{post.category}</Badge>
                        </div>
                        {isAuthor && (
                          <IconButton
                            ref={triggerRef}
                            icon={<MoreHorizontal size={16} strokeWidth={1.75} />}
                            label="Post options"
                            variant="plain"
                            size="sm"
                            aria-expanded={menuOpen && menuPostId === post.id}
                            className={styles.actionsMenu}
                            onClick={(e) => {
                              e.stopPropagation();
                              triggerRef.current = e.currentTarget as HTMLButtonElement;
                              const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                              setMenuPostId(post.id);
                              setMenuAnchor(rect);
                              setMenuOpen(true);
                            }}
                          />
                        )}
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
                    {deletingPostId === post.id && (
                      <div className={styles.deleteConfirm}>
                        <span className={styles.deleteConfirmLabel}>
                          Delete this post? This can&rsquo;t be undone.
                        </span>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeletePost(post.id)}
                        >
                          Delete
                        </Button>
                        <Button variant="secondary" size="sm" onClick={() => setDeletingPostId(null)}>
                          Cancel
                        </Button>
                      </div>
                    )}
                  </motion.article>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <Menu
        open={menuOpen}
        anchor={menuAnchor}
        triggerRef={triggerRef}
        items={[
          {
            label: 'Edit post',
            icon: <Edit2 size={16} strokeWidth={1.75} aria-hidden="true" />,
            onSelect: () => {
              setMenuOpen(false);
              setEditingPost(menuPost ?? null);
            },
            disabled: !menuPost,
          },
          {
            label: 'Delete post',
            icon: <Trash2 size={16} strokeWidth={1.75} aria-hidden="true" />,
            destructive: true,
            onSelect: () => {
              setMenuOpen(false);
              setDeletingPostId(menuPost?.id ?? '');
            },
            disabled: !menuPost,
          },
        ]}
        onClose={() => setMenuOpen(false)}
      />

      <NewPostModal
        isOpen={isNewPostModalOpen}
        onClose={() => setIsNewPostModalOpen(false)}
        currentUser={currentUser}
        categories={forumCategories}
        onSubmit={handleCreatePost}
      />

      <EditPostModal
        isOpen={Boolean(editingPost)}
        onClose={() => setEditingPost(null)}
        post={{
          id: editingPost?.id ?? '',
          title: editingPost?.title ?? '',
          content: editingPost?.content ?? '',
          category: editingPost?.category ?? forumCategories[0],
        }}
        categories={forumCategories.filter((c) => c !== 'All')}
        onSubmit={handleEditPost}
      />

      {/* Floating "New post" button — mobile only (hidden at 900px+). */}
      {!isHeaderButton && isApproved && (
        <Button
          className={cx(styles.fab, fabCollapsed && styles.fabCollapsed)}
          iconLeft={<Plus size={18} strokeWidth={1.75} />}
          aria-label={fabCollapsed ? 'New post' : undefined}
        >
          <span className={styles.fabLabel}>New post</span>
        </Button>
      )}
    </div>
  );
}

export default Forums;

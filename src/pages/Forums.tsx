import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageSquare, PlusCircle, MessageCircle, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { UserProfile } from './Directory';
import { NewPostModal } from '../components/NewPostModal';

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

const Forums: React.FC = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  React.useEffect(() => {
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
        if (profile) setCurrentUser(profile as UserProfile);
      }

      const { data: postsData } = await supabase
        .from('forum_posts')
        .select('*, profiles(full_name)')
        .order('created_at', { ascending: false });
        
      if (postsData) setPosts(postsData as ForumPost[]);
      setLoading(false);
    };
    fetchData();
  }, []);
  
  const isApproved = currentUser?.verification_status === 'approved';
  const gradYearStr = currentUser?.graduation_year ? currentUser.graduation_year.toString().slice(-2) : 'N/A';
  const batchName = `My Batch (${currentUser?.branch || 'Unknown'} '${gradYearStr})`;

  const filteredPosts = selectedCategory === 'All' 
    ? posts 
    : selectedCategory === batchName
      ? posts.filter(post => post.category === batchName)
      : posts.filter(post => post.category === selectedCategory);

  const getAuthorName = (post: ForumPost) => {
    return post.profiles?.full_name || 'Unknown User';
  };

  const handleCreatePost = async (title: string, content: string, category: string) => {
    if (!currentUser) return;
    
    const newPost = {
      author_id: currentUser.id,
      title,
      content,
      category,
      replies_count: 0
    };

    const { data, error } = await supabase
      .from('forum_posts')
      .insert([newPost])
      .select('*, profiles(full_name)')
      .single();
      
    if (error) {
      console.error('Error creating post:', error);
      alert('Failed to create post. Please try again.');
    } else if (data) {
      setPosts([data as ForumPost, ...posts]);
    }
  };

  const allCategoriesForModal = batchName !== "My Batch (Unknown 'N/A)" 
    ? [batchName, ...forumCategories]
    : forumCategories;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column' }}>
      
      {/* Header */}
      <header style={{
        padding: '1rem 1.5rem',
        background: 'var(--bg-primary)',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}>
        <button onClick={() => navigate('/dashboard')} className="btn btn-ghost" style={{ padding: '0.5rem 0.75rem' }}>
          <ArrowLeft size={18} /> Back
        </button>
        <h1 style={{ fontSize: '1.25rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
          <MessageSquare size={20} color="var(--brand-secondary)" /> Discussion Forums
        </h1>
      </header>

      <main className="container" style={{ padding: '1.5rem', maxWidth: '1000px', width: '100%', display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexDirection: 'column' }}>
        
        {!isApproved && (
          <div style={{
            width: '100%',
            background: 'var(--accent-danger-subtle)',
            border: '1px solid var(--accent-danger)',
            color: 'var(--accent-danger)',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.625rem',
            fontSize: '0.875rem',
          }}>
            <MessageSquare size={18} />
            <p style={{ margin: 0 }}><strong>Access Restricted:</strong> Your account is pending admin verification. You cannot post or chat in community sections yet.</p>
          </div>
        )}

        <div style={{ display: 'flex', gap: '1.5rem', width: '100%', alignItems: 'flex-start' }}>
          {/* Sidebar Categories */}
          <aside style={{ width: '240px', flexShrink: 0, position: 'sticky', top: '80px' }}>
            <div className="card" style={{ padding: '1.25rem' }}>
              <button 
                className="btn btn-primary" 
                style={{ width: '100%', marginBottom: '1.5rem', opacity: isApproved ? 1 : 0.5, cursor: isApproved ? 'pointer' : 'not-allowed' }} 
                onClick={() => isApproved ? setIsModalOpen(true) : alert('You must be verified to post.')}
                disabled={!isApproved}
              >
                <PlusCircle size={16} /> New Post
              </button>
            
              <h3 style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem', fontWeight: 600 }}>
                Categories
              </h3>
            
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
                <button 
                  onClick={() => setSelectedCategory('All')}
                  style={{
                    textAlign: 'left',
                    padding: '0.5rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    background: selectedCategory === 'All' ? 'var(--brand-subtle)' : 'transparent',
                    color: selectedCategory === 'All' ? 'var(--brand-primary)' : 'var(--text-secondary)',
                    fontWeight: selectedCategory === 'All' ? 500 : 400,
                    fontSize: '0.875rem',
                  }}
                >
                  All Discussions
                </button>
                
                <div style={{ height: '1px', background: 'var(--border-color)', margin: '0.375rem 0' }}></div>
                
                {/* Cohort Specific Community */}
                <button 
                  onClick={() => setSelectedCategory(batchName)}
                  style={{
                    textAlign: 'left',
                    padding: '0.5rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    background: selectedCategory === batchName ? 'var(--brand-subtle)' : 'transparent',
                    color: selectedCategory === batchName ? 'var(--brand-primary)' : 'var(--brand-secondary)',
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                    fontSize: '0.875rem',
                  }}
                >
                  <MessageCircle size={14} /> {batchName}
                </button>
                
                <div style={{ height: '1px', background: 'var(--border-color)', margin: '0.375rem 0' }}></div>

                {forumCategories.map(cat => (
                  <button 
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    style={{
                      textAlign: 'left',
                      padding: '0.5rem 0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      background: selectedCategory === cat ? 'var(--brand-subtle)' : 'transparent',
                      color: selectedCategory === cat ? 'var(--brand-primary)' : 'var(--text-secondary)',
                      fontWeight: selectedCategory === cat ? 500 : 400,
                      fontSize: '0.875rem',
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Posts List */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
                <Loader2 className="animate-spin" size={28} color="var(--brand-primary)" />
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="card" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <MessageCircle size={40} style={{ opacity: 0.4, margin: '0 auto 0.75rem auto' }} />
                <p>No posts in this category yet. Be the first to start a discussion!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {filteredPosts.map(post => (
                  <div key={post.id} className="card animate-fade-in" style={{ padding: '1.25rem', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', gap: '0.375rem', marginBottom: '0.625rem' }}>
                      <span style={{
                        fontSize: '0.6875rem',
                        padding: '0.1875rem 0.5rem',
                        background: 'var(--brand-subtle)',
                        borderRadius: '9999px',
                        color: 'var(--brand-secondary)',
                        fontWeight: 500,
                      }}>
                        {post.category}
                      </span>
                    </div>
                    
                    <h2 style={{ fontSize: '1.0625rem', marginBottom: '0.375rem', fontWeight: 600 }}>{post.title}</h2>
                    <p style={{
                      color: 'var(--text-secondary)',
                      marginBottom: '1rem',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      fontSize: '0.875rem',
                      lineHeight: 1.6,
                    }}>
                      {post.content}
                    </p>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span>Posted by <strong style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{getAuthorName(post)}</strong></span>
                        <span>•</span>
                        <span>{new Date(post.created_at).toLocaleDateString()}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-secondary)' }}>
                        <MessageCircle size={14} /> {post.replies_count} Replies
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      
      <NewPostModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        currentUser={currentUser}
        categories={allCategoriesForModal}
        onSubmit={handleCreatePost}
      />
    </div>
  );
};

export default Forums;

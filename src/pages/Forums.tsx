import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageSquare, PlusCircle, MessageCircle, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { UserProfile } from './Directory';
import { NewPostModal } from '../components/NewPostModal';

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
  danger: '#FF6B6B',
};

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
          <MessageSquare size={24} strokeWidth={2.5} color={COLORS.text} /> Discussion Forums
        </h1>
      </header>

      <main style={{ padding: '2.5rem', maxWidth: '1200px', margin: '0 auto', width: '100%', display: 'flex', gap: '2rem', alignItems: 'flex-start', flexDirection: 'column' }}>
        
        {!isApproved && (
          <div style={{
            width: '100%',
            background: COLORS.danger,
            border: `2px solid ${COLORS.border}`,
            color: COLORS.text,
            padding: '1rem 1.5rem',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            fontSize: '0.9375rem',
            fontWeight: 700,
            boxShadow: '4px 4px 0px rgba(13,30,20,1)',
            marginBottom: '1rem'
          }}>
            <MessageSquare size={20} strokeWidth={2.5} />
            <p style={{ margin: 0, textTransform: 'uppercase' }}><strong>Access Restricted:</strong> Your account is pending admin verification. You cannot post or chat in community sections yet.</p>
          </div>
        )}

        <div style={{ display: 'flex', gap: '2rem', width: '100%', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          {/* Sidebar Categories */}
          <aside style={{ width: '280px', flexShrink: 0, position: 'sticky', top: '100px' }}>
            <div style={{ 
              background: COLORS.white, padding: '1.5rem', borderRadius: '16px',
              border: `2px solid ${COLORS.border}`, boxShadow: '8px 8px 0px rgba(13,30,20,1)'
            }}>
              <button 
                style={{ 
                  width: '100%', marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                  padding: '0.875rem', borderRadius: '99px',
                  background: COLORS.lavender, border: `2px solid ${COLORS.border}`,
                  color: COLORS.text, fontWeight: 900, cursor: isApproved ? 'pointer' : 'not-allowed',
                  boxShadow: isApproved ? '4px 4px 0px rgba(13,30,20,1)' : 'none', textTransform: 'uppercase', fontSize: '0.9375rem',
                  opacity: isApproved ? 1 : 0.5,
                  transition: 'transform 0.1s'
                }} 
                onMouseDown={(e) => { if(isApproved) { e.currentTarget.style.transform = 'translate(2px, 2px)'; e.currentTarget.style.boxShadow = '2px 2px 0px rgba(13,30,20,1)'; } }}
                onMouseUp={(e) => { if(isApproved) { e.currentTarget.style.transform = 'translate(0, 0)'; e.currentTarget.style.boxShadow = '4px 4px 0px rgba(13,30,20,1)'; } }}
                onClick={() => isApproved ? setIsModalOpen(true) : alert('You must be verified to post.')}
                disabled={!isApproved}
              >
                <PlusCircle size={20} strokeWidth={2.5} /> New Post
              </button>
            
              <h3 style={{ fontSize: '1.125rem', marginBottom: '1.5rem', fontWeight: 900, textTransform: 'uppercase', color: COLORS.text }}>
                Categories
              </h3>
            
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <button 
                  onClick={() => setSelectedCategory('All')}
                  style={{
                    textAlign: 'left',
                    padding: '0.625rem 1rem',
                    borderRadius: '99px',
                    background: selectedCategory === 'All' ? COLORS.sage : COLORS.white,
                    color: COLORS.text,
                    fontWeight: selectedCategory === 'All' ? 900 : 700,
                    fontSize: '0.875rem',
                    border: selectedCategory === 'All' ? `2px solid ${COLORS.border}` : `2px solid transparent`,
                    boxShadow: selectedCategory === 'All' ? '2px 2px 0px rgba(13,30,20,1)' : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    textTransform: 'uppercase'
                  }}
                >
                  All Discussions
                </button>
                
                <div style={{ height: '2px', background: COLORS.border, margin: '0.75rem 0' }}></div>
                
                {/* Cohort Specific Community */}
                <button 
                  onClick={() => setSelectedCategory(batchName)}
                  style={{
                    textAlign: 'left',
                    padding: '0.625rem 1rem',
                    borderRadius: '99px',
                    background: selectedCategory === batchName ? COLORS.blue : COLORS.white,
                    color: COLORS.text,
                    fontWeight: selectedCategory === batchName ? 900 : 700,
                    fontSize: '0.875rem',
                    border: selectedCategory === batchName ? `2px solid ${COLORS.border}` : `2px solid transparent`,
                    boxShadow: selectedCategory === batchName ? '2px 2px 0px rgba(13,30,20,1)' : 'none',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    transition: 'all 0.15s ease',
                    textTransform: 'uppercase'
                  }}
                >
                  <MessageCircle size={16} strokeWidth={2.5} /> {batchName}
                </button>
                
                <div style={{ height: '2px', background: COLORS.border, margin: '0.75rem 0' }}></div>

                {forumCategories.map(cat => (
                  <button 
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    style={{
                      textAlign: 'left',
                      padding: '0.625rem 1rem',
                      borderRadius: '99px',
                      background: selectedCategory === cat ? COLORS.warning : COLORS.white,
                      color: COLORS.text,
                      fontWeight: selectedCategory === cat ? 900 : 700,
                      fontSize: '0.875rem',
                      border: selectedCategory === cat ? `2px solid ${COLORS.border}` : `2px solid transparent`,
                      boxShadow: selectedCategory === cat ? '2px 2px 0px rgba(13,30,20,1)' : 'none',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      textTransform: 'uppercase'
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Posts List */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem', minWidth: '300px' }}>
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
                <div style={{ width: '36px', height: '36px', border: `4px solid ${COLORS.border}`, borderTopColor: COLORS.sage, borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              </div>
            ) : filteredPosts.length === 0 ? (
              <div style={{ 
                background: COLORS.white, padding: '4rem', textAlign: 'center', 
                border: `2px dashed ${COLORS.border}`, borderRadius: '24px',
                color: COLORS.textMuted 
              }}>
                <MessageCircle size={48} style={{ opacity: 0.5, margin: '0 auto 1rem auto' }} strokeWidth={1.5} />
                <p style={{ fontWeight: 900, fontSize: '1.25rem', color: COLORS.text, margin: 0, textTransform: 'uppercase' }}>No posts in this category yet. Be the first to start a discussion!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {filteredPosts.map((post, idx) => {
                  const accentColors = [COLORS.sage, COLORS.lavender, COLORS.blue, COLORS.warning];
                  const cardAccent = accentColors[idx % accentColors.length];

                  return (
                    <div key={post.id} style={{ 
                      background: COLORS.white, padding: '2rem', cursor: 'pointer',
                      border: `2px solid ${COLORS.border}`, borderRadius: '24px', 
                      boxShadow: '8px 8px 0px rgba(13,30,20,1)',
                      transition: 'transform 0.1s, box-shadow 0.1s'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translate(-2px, -2px)'; e.currentTarget.style.boxShadow = '10px 10px 0px rgba(13,30,20,1)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translate(0, 0)'; e.currentTarget.style.boxShadow = '8px 8px 0px rgba(13,30,20,1)'; }}
                    >
                      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                        <span style={{
                          fontSize: '0.75rem',
                          padding: '0.375rem 0.875rem',
                          background: cardAccent,
                          border: `2px solid ${COLORS.border}`,
                          borderRadius: '9999px',
                          color: COLORS.text,
                          fontWeight: 900,
                          textTransform: 'uppercase'
                        }}>
                          {post.category}
                        </span>
                      </div>
                      
                      <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', fontWeight: 900, color: COLORS.text, textTransform: 'uppercase', letterSpacing: '-0.02em' }}>{post.title}</h2>
                      <p style={{
                        color: COLORS.textMuted,
                        marginBottom: '1.5rem',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        fontSize: '1rem',
                        fontWeight: 500,
                        lineHeight: 1.6,
                      }}>
                        {post.content}
                      </p>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `2px solid ${COLORS.border}`, paddingTop: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.875rem', color: COLORS.text, fontWeight: 700, textTransform: 'uppercase' }}>
                          <span>Posted by <strong style={{ color: COLORS.text, fontWeight: 900 }}>{getAuthorName(post)}</strong></span>
                          <span>•</span>
                          <span>{new Date(post.created_at).toLocaleDateString()}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: COLORS.text, fontWeight: 900, fontSize: '0.875rem', textTransform: 'uppercase' }}>
                          <MessageCircle size={18} strokeWidth={2.5} /> {post.replies_count} Replies
                        </div>
                      </div>
                    </div>
                  );
                })}
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

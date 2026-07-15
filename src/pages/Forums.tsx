import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageSquare, PlusCircle, MessageCircle, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { UserProfile } from './Directory';

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

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column' }}>
      
      {/* Header */}
      <header style={{ padding: '1.5rem 2rem', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '1rem', position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={() => navigate('/dashboard')} className="btn btn-outline" style={{ padding: '0.5rem 1rem' }}>
          <ArrowLeft size={18} /> Back
        </button>
        <h1 style={{ fontSize: '1.5rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <MessageSquare size={24} color="var(--brand-secondary)" /> Discussion Forums
        </h1>
      </header>

      <main className="container" style={{ padding: '2rem 1.5rem', maxWidth: '1000px', width: '100%', display: 'flex', gap: '2rem', alignItems: 'flex-start', flexDirection: 'column' }}>
        
        {!isApproved && (
          <div style={{ width: '100%', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--accent-danger)', color: 'var(--accent-danger)', padding: '1rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <MessageSquare size={20} />
            <p style={{ margin: 0 }}><strong>Access Restricted:</strong> Your account is pending admin verification. You cannot post or chat in community sections yet.</p>
          </div>
        )}

        <div style={{ display: 'flex', gap: '2rem', width: '100%', alignItems: 'flex-start' }}>
          {/* Sidebar Categories */}
          <aside style={{ width: '250px', flexShrink: 0, position: 'sticky', top: '100px' }}>
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <button 
                className="btn btn-primary" 
                style={{ width: '100%', marginBottom: '2rem', opacity: isApproved ? 1 : 0.5, cursor: isApproved ? 'pointer' : 'not-allowed' }} 
                onClick={() => isApproved ? alert('New discussion modal would open here! (Mock)') : alert('You must be verified to post.')}
                disabled={!isApproved}
              >
                <PlusCircle size={18} /> New Post
              </button>
            
            <h3 style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
              Categories
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button 
                onClick={() => setSelectedCategory('All')}
                style={{ textAlign: 'left', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', background: selectedCategory === 'All' ? 'rgba(255,255,255,0.1)' : 'transparent', color: selectedCategory === 'All' ? 'white' : 'var(--text-secondary)' }}
              >
                All Discussions
              </button>
              
              <div style={{ height: '1px', background: 'var(--border-color)', margin: '0.5rem 0' }}></div>
              
              {/* Cohort Specific Community */}
              <button 
                onClick={() => setSelectedCategory(batchName)}
                style={{ textAlign: 'left', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', background: selectedCategory === batchName ? 'rgba(255,255,255,0.1)' : 'transparent', color: selectedCategory === batchName ? 'var(--brand-primary)' : 'var(--brand-secondary)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <MessageCircle size={16} /> {batchName}
              </button>
              
              <div style={{ height: '1px', background: 'var(--border-color)', margin: '0.5rem 0' }}></div>

              {forumCategories.map(cat => (
                <button 
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  style={{ textAlign: 'left', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', background: selectedCategory === cat ? 'rgba(255,255,255,0.1)' : 'transparent', color: selectedCategory === cat ? 'white' : 'var(--text-secondary)' }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Posts List */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Post Feed */}
          <div style={{ flex: 1 }}>
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
                <Loader2 className="animate-spin" size={32} color="var(--brand-primary)" />
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <MessageCircle size={48} style={{ opacity: 0.5, margin: '0 auto 1rem auto' }} />
                <p>No posts in this category yet. Be the first to start a discussion!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {filteredPosts.map(post => (
                  <div key={post.id} className="glass-panel animate-fade-in" style={{ padding: '1.5rem', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', color: 'var(--brand-secondary)' }}>
                        {post.category}
                      </span>
                    </div>
                    
                    <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{post.title}</h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {post.content}
                    </p>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span>Posted by <strong style={{ color: 'var(--text-primary)' }}>{getAuthorName(post)}</strong></span>
                        <span>•</span>
                        <span>{new Date(post.created_at).toLocaleDateString()}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-secondary)' }}>
                        <MessageCircle size={16} /> {post.replies_count} Replies
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  </div>
  );
};

export default Forums;

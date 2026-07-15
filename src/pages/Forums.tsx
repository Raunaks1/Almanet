import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageSquare, PlusCircle, MessageCircle } from 'lucide-react';
import { mockForumPosts, forumCategories, mockUsers } from '../lib/mockData';
import type { ForumPost } from '../lib/mockData';

const Forums: React.FC = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const filteredPosts = selectedCategory === 'All' 
    ? mockForumPosts 
    : mockForumPosts.filter(post => post.category === selectedCategory);

  const getAuthorName = (authorId: string) => {
    return mockUsers.find(u => u.id === authorId)?.full_name || 'Unknown User';
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

      <main className="container" style={{ padding: '2rem 1.5rem', maxWidth: '1000px', width: '100%', display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
        
        {/* Sidebar Categories */}
        <aside style={{ width: '250px', flexShrink: 0, position: 'sticky', top: '100px' }}>
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <button className="btn btn-primary" style={{ width: '100%', marginBottom: '2rem' }} onClick={() => alert('New discussion modal would open here! (Mock)')}>
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
          {filteredPosts.map((post: ForumPost) => (
            <div key={post.id} className="glass-card animate-fade-in" style={{ padding: '1.5rem', cursor: 'pointer' }} onClick={() => alert(`Opening post: ${post.title}`)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.75rem', background: 'var(--bg-tertiary)', padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', color: 'var(--brand-secondary)' }}>
                  {post.category}
                </span>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>{post.createdAt}</span>
              </div>
              
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{post.title}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', marginBottom: '1.5rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {post.content}
              </p>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--brand-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 600 }}>
                    {getAuthorName(post.authorId).charAt(0)}
                  </div>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{getAuthorName(post.authorId)}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  <MessageCircle size={16} /> {post.repliesCount} replies
                </div>
              </div>
            </div>
          ))}

          {filteredPosts.length === 0 && (
            <div style={{ textAlign: 'center', padding: '4rem', background: 'var(--glass-bg)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--border-color)' }}>
              <MessageSquare size={48} color="var(--text-secondary)" style={{ margin: '0 auto 1rem auto', opacity: 0.5 }} />
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>No discussions yet</h3>
              <p style={{ color: 'var(--text-secondary)' }}>Be the first to start a conversation in this category!</p>
            </div>
          )}
        </div>

      </main>
    </div>
  );
};

export default Forums;

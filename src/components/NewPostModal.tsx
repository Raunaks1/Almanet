import React, { useState } from 'react';
import { X, Image, Calendar, Smile, Plus, Clock } from 'lucide-react';
import type { UserProfile } from '../pages/Directory';

interface NewPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  categories: string[];
  onSubmit: (title: string, content: string, category: string) => Promise<void>;
}

export const NewPostModal: React.FC<NewPostModalProps> = ({ isOpen, onClose, currentUser, categories, onSubmit }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState(categories[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) return;
    setIsSubmitting(true);
    await onSubmit(title, content, category);
    setIsSubmitting(false);
    setTitle('');
    setContent('');
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      zIndex: 1000,
      paddingTop: '8vh',
      backdropFilter: 'blur(4px)'
    }}>
      <div className="card" style={{
        width: '100%',
        maxWidth: '600px',
        backgroundColor: 'var(--bg-primary)',
        borderRadius: '12px',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)',
        border: '1px solid var(--border-color)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '1.25rem 1.25rem 0.75rem 1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {currentUser?.avatar_url ? (
              <img src={currentUser.avatar_url} alt="avatar" style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '1.25rem' }}>
                {currentUser?.full_name?.charAt(0) || 'U'}
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
              <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)' }}>{currentUser?.full_name || 'User'}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Post to</span>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    fontSize: '0.8125rem',
                    cursor: 'pointer',
                    padding: '0.125rem 0.5rem',
                    borderRadius: '4px',
                    outline: 'none',
                    fontWeight: 500,
                  }}
                >
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost" style={{ padding: '0.5rem', borderRadius: '50%', marginTop: '-0.25rem', marginRight: '-0.25rem' }}>
            <X size={24} color="var(--text-secondary)" />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '0 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <input
            type="text"
            placeholder="An engaging title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: '1.25rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              padding: '0.5rem 0',
            }}
          />
          <textarea
            placeholder="What do you want to talk about?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            style={{
              width: '100%',
              minHeight: '180px',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              resize: 'none',
              fontSize: '1rem',
              color: 'var(--text-primary)',
              fontFamily: 'inherit',
              padding: '0.5rem 0',
              lineHeight: 1.5,
            }}
          />
        </div>

        {/* Bottom Icons - Top Row like LinkedIn emoji */}
        <div style={{ padding: '0 1.25rem 0.5rem 1.25rem', display: 'flex' }}>
           <button className="btn btn-ghost" style={{ padding: '0.375rem', borderRadius: '50%', color: 'var(--text-secondary)' }}><Smile size={22} /></button>
        </div>

        {/* Footer */}
        <div style={{ 
          padding: '0.75rem 1.25rem 1.25rem 1.25rem', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center' 
        }}>
          <div style={{ display: 'flex', gap: '0.25rem', color: 'var(--text-secondary)' }}>
            <button className="btn btn-ghost" style={{ padding: '0.5rem', borderRadius: '50%' }}><Image size={22} /></button>
            <button className="btn btn-ghost" style={{ padding: '0.5rem', borderRadius: '50%' }}><Calendar size={22} /></button>
            <button className="btn btn-ghost" style={{ padding: '0.5rem', borderRadius: '50%' }}><Plus size={22} /></button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button className="btn btn-ghost" style={{ padding: '0.5rem', borderRadius: '50%', color: 'var(--text-secondary)' }}><Clock size={22} /></button>
            <button 
              className="btn btn-primary" 
              onClick={handleSubmit} 
              disabled={isSubmitting || !title.trim() || !content.trim()}
              style={{ borderRadius: '9999px', padding: '0.5rem 1.25rem', fontWeight: 600, fontSize: '0.9375rem' }}
            >
              {isSubmitting ? 'Posting...' : 'Post'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { X, Image, Calendar, Smile, Plus, Clock } from 'lucide-react';
import type { UserProfile } from '../pages/Directory';

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
      backgroundColor: 'rgba(13, 30, 20, 0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '2rem',
      backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '640px',
        backgroundColor: COLORS.white,
        borderRadius: '24px',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '12px 12px 0px rgba(13,30,20,1)',
        border: `4px solid ${COLORS.border}`,
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{ 
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', 
          padding: '2rem 2rem 1.5rem 2rem', borderBottom: `2px solid ${COLORS.border}`,
          background: COLORS.bg
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {currentUser?.avatar_url ? (
              <img src={currentUser.avatar_url} alt="avatar" style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${COLORS.border}` }} />
            ) : (
              <div style={{ width: 56, height: 56, borderRadius: '50%', backgroundColor: COLORS.lavender, border: `2px solid ${COLORS.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: COLORS.text, fontWeight: 900, fontSize: '1.5rem' }}>
                {currentUser?.full_name?.charAt(0) || 'U'}
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <div style={{ fontWeight: 900, fontSize: '1.125rem', color: COLORS.text, textTransform: 'uppercase' }}>{currentUser?.full_name || 'User'}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.875rem', color: COLORS.textMuted, fontWeight: 700, textTransform: 'uppercase' }}>Post to</span>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={{
                    background: COLORS.white,
                    border: `2px solid ${COLORS.border}`,
                    color: COLORS.text,
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '99px',
                    outline: 'none',
                    fontWeight: 900,
                    textTransform: 'uppercase',
                    boxShadow: '2px 2px 0px rgba(13,30,20,1)',
                    appearance: 'none',
                  }}
                >
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ 
            background: COLORS.white, border: `2px solid ${COLORS.border}`,
            padding: '0.5rem', borderRadius: '50%', cursor: 'pointer',
            boxShadow: '2px 2px 0px rgba(13,30,20,1)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: COLORS.text, transition: 'transform 0.1s'
          }}
          onMouseDown={(e) => { e.currentTarget.style.transform = 'translate(1px, 1px)'; e.currentTarget.style.boxShadow = '1px 1px 0px rgba(13,30,20,1)'; }}
          onMouseUp={(e) => { e.currentTarget.style.transform = 'translate(0, 0)'; e.currentTarget.style.boxShadow = '2px 2px 0px rgba(13,30,20,1)'; }}
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', background: COLORS.white }}>
          <input
            type="text"
            placeholder="An engaging title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{
              width: '100%',
              background: COLORS.bg,
              border: `2px solid ${COLORS.border}`,
              borderRadius: '12px',
              outline: 'none',
              fontSize: '1.25rem',
              fontWeight: 900,
              color: COLORS.text,
              padding: '1rem 1.25rem',
              fontFamily: '"Inter", sans-serif',
            }}
          />
          <textarea
            placeholder="What do you want to talk about?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            style={{
              width: '100%',
              minHeight: '200px',
              background: COLORS.bg,
              border: `2px solid ${COLORS.border}`,
              borderRadius: '12px',
              outline: 'none',
              resize: 'none',
              fontSize: '1rem',
              color: COLORS.text,
              fontFamily: '"Inter", sans-serif',
              padding: '1.25rem',
              lineHeight: 1.6,
              fontWeight: 500,
            }}
          />
        </div>

        {/* Bottom Icons - Top Row like LinkedIn emoji */}
        <div style={{ padding: '0 2rem 1rem 2rem', display: 'flex', background: COLORS.white }}>
           <button style={{ 
              background: COLORS.sage, border: `2px solid ${COLORS.border}`,
              padding: '0.5rem', borderRadius: '50%', cursor: 'pointer',
              boxShadow: '2px 2px 0px rgba(13,30,20,1)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: COLORS.text, transition: 'transform 0.1s'
            }}
            onMouseDown={(e) => { e.currentTarget.style.transform = 'translate(1px, 1px)'; e.currentTarget.style.boxShadow = '1px 1px 0px rgba(13,30,20,1)'; }}
            onMouseUp={(e) => { e.currentTarget.style.transform = 'translate(0, 0)'; e.currentTarget.style.boxShadow = '2px 2px 0px rgba(13,30,20,1)'; }}
           >
             <Smile size={20} strokeWidth={2.5} />
           </button>
        </div>

        {/* Footer */}
        <div style={{ 
          padding: '1.5rem 2rem', borderTop: `2px solid ${COLORS.border}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: COLORS.bg
        }}>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button style={{ 
              background: COLORS.white, border: `2px solid ${COLORS.border}`,
              padding: '0.5rem', borderRadius: '50%', cursor: 'pointer',
              boxShadow: '2px 2px 0px rgba(13,30,20,1)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: COLORS.text, transition: 'transform 0.1s'
            }}
            onMouseDown={(e) => { e.currentTarget.style.transform = 'translate(1px, 1px)'; e.currentTarget.style.boxShadow = '1px 1px 0px rgba(13,30,20,1)'; }}
            onMouseUp={(e) => { e.currentTarget.style.transform = 'translate(0, 0)'; e.currentTarget.style.boxShadow = '2px 2px 0px rgba(13,30,20,1)'; }}>
              <Image size={20} strokeWidth={2.5} />
            </button>
            <button style={{ 
              background: COLORS.white, border: `2px solid ${COLORS.border}`,
              padding: '0.5rem', borderRadius: '50%', cursor: 'pointer',
              boxShadow: '2px 2px 0px rgba(13,30,20,1)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: COLORS.text, transition: 'transform 0.1s'
            }}
            onMouseDown={(e) => { e.currentTarget.style.transform = 'translate(1px, 1px)'; e.currentTarget.style.boxShadow = '1px 1px 0px rgba(13,30,20,1)'; }}
            onMouseUp={(e) => { e.currentTarget.style.transform = 'translate(0, 0)'; e.currentTarget.style.boxShadow = '2px 2px 0px rgba(13,30,20,1)'; }}>
              <Calendar size={20} strokeWidth={2.5} />
            </button>
            <button style={{ 
              background: COLORS.white, border: `2px solid ${COLORS.border}`,
              padding: '0.5rem', borderRadius: '50%', cursor: 'pointer',
              boxShadow: '2px 2px 0px rgba(13,30,20,1)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: COLORS.text, transition: 'transform 0.1s'
            }}
            onMouseDown={(e) => { e.currentTarget.style.transform = 'translate(1px, 1px)'; e.currentTarget.style.boxShadow = '1px 1px 0px rgba(13,30,20,1)'; }}
            onMouseUp={(e) => { e.currentTarget.style.transform = 'translate(0, 0)'; e.currentTarget.style.boxShadow = '2px 2px 0px rgba(13,30,20,1)'; }}>
              <Plus size={20} strokeWidth={2.5} />
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button style={{ 
              background: COLORS.white, border: `2px solid ${COLORS.border}`,
              padding: '0.5rem', borderRadius: '50%', cursor: 'pointer',
              boxShadow: '2px 2px 0px rgba(13,30,20,1)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: COLORS.text, transition: 'transform 0.1s'
            }}
            onMouseDown={(e) => { e.currentTarget.style.transform = 'translate(1px, 1px)'; e.currentTarget.style.boxShadow = '1px 1px 0px rgba(13,30,20,1)'; }}
            onMouseUp={(e) => { e.currentTarget.style.transform = 'translate(0, 0)'; e.currentTarget.style.boxShadow = '2px 2px 0px rgba(13,30,20,1)'; }}>
              <Clock size={20} strokeWidth={2.5} />
            </button>
            <button 
              onClick={handleSubmit} 
              disabled={isSubmitting || !title.trim() || !content.trim()}
              style={{ 
                background: COLORS.warning, border: `2px solid ${COLORS.border}`,
                padding: '0.75rem 2rem', borderRadius: '99px', cursor: (isSubmitting || !title.trim() || !content.trim()) ? 'not-allowed' : 'pointer',
                boxShadow: '4px 4px 0px rgba(13,30,20,1)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: COLORS.text, fontWeight: 900, textTransform: 'uppercase', fontSize: '1rem',
                opacity: (isSubmitting || !title.trim() || !content.trim()) ? 0.6 : 1,
                transition: 'transform 0.1s'
              }}
              onMouseDown={(e) => { if(!(isSubmitting || !title.trim() || !content.trim())) { e.currentTarget.style.transform = 'translate(2px, 2px)'; e.currentTarget.style.boxShadow = '2px 2px 0px rgba(13,30,20,1)'; } }}
              onMouseUp={(e) => { if(!(isSubmitting || !title.trim() || !content.trim())) { e.currentTarget.style.transform = 'translate(0, 0)'; e.currentTarget.style.boxShadow = '4px 4px 0px rgba(13,30,20,1)'; } }}
            >
              {isSubmitting ? 'Posting...' : 'Post'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

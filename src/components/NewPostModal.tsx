import React, { useState } from 'react';
import { Modal, Button, FormField, Input, Textarea, Select, Avatar } from './ui';
import type { UserProfile } from '../pages/Directory';

interface NewPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  categories: string[];
  onSubmit: (title: string, content: string, category: string) => Promise<void>;
}

export const NewPostModal: React.FC<NewPostModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  categories,
  onSubmit,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState(categories[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Keep submit handler and onSubmit contract unchanged.
  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) return;
    setIsSubmitting(true);
    try {
      await onSubmit(title, content, category);
      setTitle('');
      setContent('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="Create Post"
      subtitle="Share with your community."
      maxWidth={640}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={isSubmitting} disabled={!title.trim() || !content.trim()}>
            Post
          </Button>
        </>
      }
    >
      {/* headerExtra (author + category) moved into body; ui/Modal has no headerExtra */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <Avatar name={currentUser?.full_name || 'User'} size="sm" />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ font: 'var(--type-subhead)', fontWeight: 600, color: 'var(--text)' }}>
            {currentUser?.full_name || 'User'}
          </div>
          <div style={{ font: 'var(--type-caption)', color: 'var(--text-3)' }}>Posting to the community</div>
        </div>
        <div style={{ minWidth: 180 }}>
          <Select
            aria-label="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            size="sm"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 14 }}>
        <FormField label="Title" required>
          <Input
            placeholder="Post title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </FormField>
        <FormField label="Content" required>
          <Textarea
            placeholder="What's on your mind?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={6}
            style={{ resize: 'vertical' }}
          />
        </FormField>
      </div>
    </Modal>
  );
};

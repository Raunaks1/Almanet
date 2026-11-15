import React, { useState, useEffect } from 'react';
import { Modal, Button, FormField, Input, Textarea, Select } from './ui';

interface EditPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: { id: string; title: string; content: string; category: string };
  categories: string[];
  onSubmit: (id: string, title: string, content: string, category: string) => Promise<boolean>;
}

export const EditPostModal: React.FC<EditPostModalProps> = ({
  isOpen,
  onClose,
  post,
  categories,
  onSubmit,
}) => {
  const [title, setTitle] = useState(post.title);
  const [content, setContent] = useState(post.content);
  const [category, setCategory] = useState(post.category);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset fields whenever a different post is opened for editing.
  useEffect(() => {
    setTitle(post.title);
    setContent(post.content);
    setCategory(post.category);
  }, [post.id, post.title, post.content, post.category]);

  // Keep submit handler and onSubmit contract unchanged.
  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) return;
    setIsSubmitting(true);
    try {
      await onSubmit(post.id, title, content, category);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="Edit Post"
      subtitle="Make your changes and save."
      maxWidth={640}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={isSubmitting} disabled={!title.trim() || !content.trim()}>
            Save changes
          </Button>
        </>
      }
    >
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
        <div style={{ minWidth: 180 }}>
          <FormField label="Category" required>
            <Select
              aria-label="Category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              size="sm"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </Select>
          </FormField>
        </div>
      </div>
    </Modal>
  );
};

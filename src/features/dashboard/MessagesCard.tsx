import React from 'react';
import { Link } from 'react-router-dom';
import { cx } from '../../components/ui/internal';
import { Avatar, Button, EmptyState } from '../../components/ui';
import styles from './MessagesCard.module.css';

export interface MessageItem {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  author_name?: string;
  unread_count?: number;
}

export interface MessagesCardProps {
  items: MessageItem[];
  _unreadTotal: number;
  loading: boolean;
  error: boolean;
  onRetry: () => void;
}

export const MessagesCard: React.FC<MessagesCardProps> = ({
  items,
  _unreadTotal,
  loading,
  error,
  onRetry,
}) => {
  if (loading) {
    return (
      <section className={styles.card} aria-busy="true">
        <div className={styles.header}>
          <h2 className={styles.title}>Messages</h2>
          <span className={styles.chip}>Loading</span>
        </div>
        <div className={styles.skeletons}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={styles.skelRow}>
              <span className={styles.skelAvatar} aria-hidden="true" />
              <div className={styles.skelCol}>
                <span className={styles.skelLine} style={{ width: '55%' }} aria-hidden="true" />
                <span className={styles.skelLine} style={{ width: '40%' }} aria-hidden="true" />
              </div>
              <span className={styles.skelLine} style={{ width: '90px' }} aria-hidden="true" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className={styles.card}>
        <div className={styles.header}>
          <h2 className={styles.title}>Messages</h2>
        </div>
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>Couldn’t load messages</p>
          <Button variant="plain" onClick={onRetry} className={styles.retryBtn}>
            Try again
          </Button>
        </div>
      </section>
    );
  }

  const unreadCount = items.reduce((sum, it) => sum + (it.unread_count || 0), 0);

  if (items.length === 0) {
    return (
      <section className={styles.card}>
        <div className={styles.header}>
          <h2 className={styles.title}>Messages</h2>
          <span className={styles.chip}>0 unread</span>
        </div>
        <EmptyState
          icon={null}
          title="No messages yet"
          description="Start a conversation with a classmate."
          action={
            <Link to="/directory">
              <Button variant="plain">Find alumni</Button>
            </Link>
          }
        />
      </section>
    );
  }

  return (
    <section className={styles.card}>
      <div className={styles.header}>
        <h2 className={styles.title}>Messages</h2>
        {unreadCount > 0 && (
          <span className={cx(styles.chip, styles.unreadChip)} aria-label={`${unreadCount} unread messages`}>
            {unreadCount} unread
          </span>
        )}
      </div>
      <div className={styles.list}>
        {items.slice(0, 4).map((item) => (
          <Link
            key={item.id}
            to={`/chat/${item.id}`}
            className={styles.row}
          >
            <div className={styles.rowAvatar}>
              <Avatar name={item.title} size="sm" className={styles.avatar} />
            </div>
            <div className={styles.rowBody} style={{ minWidth: 0 }}>
              <div className={styles.rowTop}>
                <span className={styles.rowName}>{item.title}</span>
                <span className={styles.rowTime}>{item.location}</span>
              </div>
              <span className={styles.rowPreview}>{item.author_name || item.company}</span>
            </div>
            {item.unread_count && item.unread_count > 0 && (
              <span className={styles.rowBadge}>{item.unread_count > 9 ? '9+' : item.unread_count}</span>
            )}
          </Link>
        ))}
      </div>
      <div className={styles.footer}>
        <Link to="/chat">
          <Button variant="plain">Open chat</Button>
        </Link>
      </div>
    </section>
  );
};

import React from 'react';
import { Link } from 'react-router-dom';
import { Avatar, EmptyState } from '../../components/ui';
import styles from './BatchStrip.module.css';

export interface BatchMate {
  id: string;
  full_name: string;
  branch?: string | null;
  avatar_url?: string | null;
}

interface BatchStripProps {
  items: BatchMate[];
  loading: boolean;
  hasCollege: boolean;
}

export const BatchStrip: React.FC<BatchStripProps> = ({
  items,
  loading,
  hasCollege,
}) => {
  if (!hasCollege) return null;
  if (loading) {
    return (
      <section className={styles.card} aria-busy="true">
        <div className={styles.header}>
          <h2 className={styles.title}>From your batch</h2>
        </div>
        <div className={styles.skeletons}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={styles.skelItem} aria-hidden="true">
              <span className={styles.skelAvatar} />
              <div className={styles.skelCol}>
                <span className={styles.skelLine} style={{ width: '55%' }} />
                <span className={styles.skelLine} style={{ width: '40%' }} />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (items.length === 0) {
    return (
      <section className={styles.card}>
        <div className={styles.header}>
          <h2 className={styles.title}>From your batch</h2>
        </div>
        <EmptyState
          icon={null}
          title="No classmates have joined yet"
          description="Be the first from your batch to complete your profile."
        />
      </section>
    );
  }

  return (
    <section className={styles.card}>
      <div className={styles.header}>
        <h2 className={styles.title}>From your batch</h2>
      </div>
      <div className={styles.list}>
        {items.map((mate) => (
          <Link
            key={mate.id}
            to={`/chat?dm=${mate.id}`}
            className={styles.row}
          >
            <div className={styles.rowAvatar}>
              <Avatar name={mate.full_name} src={mate.avatar_url ?? undefined} size="sm" className={styles.avatar} />
            </div>
            <div className={styles.rowBody} style={{ minWidth: 0 }}>
              <span className={styles.rowName}>{mate.full_name}</span>
              {mate.branch && <span className={styles.rowBranch}>{mate.branch}</span>}
            </div>
            <span className={styles.messageBtn}>Message</span>
          </Link>
        ))}
      </div>
    </section>
  );
};

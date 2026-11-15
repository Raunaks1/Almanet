import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, Calendar, MessagesSquare, MapPin } from 'lucide-react';
import { Badge, Button } from '../../components/ui';
import { Tabs, TabPanel } from '../../components/ui';
import { timeAgo } from '../../lib/dashboardData';
import styles from './WhatsNewTabs.module.css';

export interface WhatsNewJob {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  author_name?: string;
}

export interface WhatsNewEvent {
  id: string;
  title: string;
  date: string;
  location: string;
}

export interface WhatsNewForum {
  id: string;
  title: string;
  category: string;
  created_at: string;
  author_name?: string;
}

interface WhatsNewTabsProps {
  jobs: WhatsNewJob[];
  events: WhatsNewEvent[];
  forums: WhatsNewForum[];
  loading: boolean;
}

const TAB_ITEMS = [
  { value: 'jobs', label: 'Jobs', icon: <Briefcase size={16} strokeWidth={1.75} aria-hidden="true" /> },
  { value: 'events', label: 'Events', icon: <Calendar size={16} strokeWidth={1.75} aria-hidden="true" /> },
  { value: 'forums', label: 'Forums', icon: <MessagesSquare size={16} strokeWidth={1.75} aria-hidden="true" /> },
];

const monthShort = (d: string): string => new Date(d).toLocaleDateString('en-US', { month: 'short' });
const dayNum = (d: string): string => new Date(d).getDate().toString();

export const WhatsNewTabs: React.FC<WhatsNewTabsProps> = ({
  jobs,
  events,
  forums,
  loading,
}) => {
  const [activeTab, setActiveTab] = useState('jobs');

  if (loading) {
    return (
      <section className={styles.card} aria-busy="true">
        <div className={styles.header}>
          <h2 className={styles.title}>What’s new</h2>
        </div>
        <div className={styles.skeletons}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={styles.skelRow} aria-hidden="true">
              <span className={styles.skelDot} />
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

  return (
    <section className={styles.card}>
      <div className={styles.header}>
        <h2 className={styles.title}>What’s new</h2>
      </div>
      <Tabs
        items={TAB_ITEMS}
        value={activeTab}
        onChange={setActiveTab}
        aria-label="What’s new filter"
      >
        <TabPanel value="jobs">
          <div className={styles.panel}>
            {jobs.slice(0, 3).map((job) => (
              <div key={job.id} className={styles.row} role="listitem">
                <span className={styles.rowIcon} aria-hidden="true">
                  <Briefcase size={14} strokeWidth={1.75} />
                </span>
                <div className={styles.rowBody} style={{ minWidth: 0 }}>
                  <span className={styles.rowTitle}>{job.title}</span>
                  <span className={styles.rowMeta}>
                    Posted by {job.author_name || 'Someone'} · {job.location}
                  </span>
                </div>
                <Badge variant="neutral" size="sm" className={styles.typeChip}>
                  {job.type}
                </Badge>
              </div>
            ))}
            <div className={styles.viewAll}>
              <Link to="/jobs">
                <Button variant="plain">View all jobs</Button>
              </Link>
            </div>
          </div>
        </TabPanel>
        <TabPanel value="events">
          <div className={styles.panel}>
            {events.slice(0, 3).map((event) => (
              <div key={event.id} className={styles.row} role="listitem">
                <div className={styles.dateBlock}>
                  <span className={styles.dateMonth}>{monthShort(event.date)}</span>
                  <span className={styles.dateDay}>{dayNum(event.date)}</span>
                </div>
                <div className={styles.rowBody} style={{ minWidth: 0 }}>
                  <span className={styles.rowTitle}>{event.title}</span>
                  <span className={styles.rowMeta}>
                    <span className={styles.locIcon} aria-hidden="true">
                      <MapPin size={12} strokeWidth={1.75} />
                    </span>
                    {event.location}
                  </span>
                </div>
              </div>
            ))}
            <div className={styles.viewAll}>
              <Link to="/events">
                <Button variant="plain">View all events</Button>
              </Link>
            </div>
          </div>
        </TabPanel>
        <TabPanel value="forums">
          <div className={styles.panel}>
            {forums.slice(0, 3).map((post) => (
              <div key={post.id} className={styles.row} role="listitem">
                <span className={styles.rowIcon} aria-hidden="true">
                  <MessagesSquare size={14} strokeWidth={1.75} />
                </span>
                <div className={styles.rowBody} style={{ minWidth: 0 }}>
                  <span className={styles.rowTitle}>{post.title}</span>
                  <span className={styles.rowMeta}>
                    {post.author_name || 'Someone'} · {timeAgo(post.created_at)}
                  </span>
                </div>
                <Badge variant="neutral" size="sm" className={styles.typeChip}>
                  {post.category}
                </Badge>
              </div>
            ))}
            <div className={styles.viewAll}>
              <Link to="/forums">
                <Button variant="plain">View all forums</Button>
              </Link>
            </div>
          </div>
        </TabPanel>
      </Tabs>
    </section>
  );
};

import React from 'react';
import { Briefcase, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui';
import { Badge } from '../../components/ui';
import styles from './GreetingHeader.module.css';

export interface GreetingHeaderProps {
  greeting: string;
  college: string | null;
  branch: string | null;
  gradYear: string | number | null;
  userType: string;
  pendingCount: number | null;
  _onPostJob: () => void;
  _onFindAlumni: () => void;
  _onAdminPending: () => void;
}

const hourGreeting = (): string => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
};

export const GreetingHeader: React.FC<GreetingHeaderProps> = ({
  greeting: greetingProp,
  college,
  branch,
  gradYear,
  userType,
  pendingCount,
  _onPostJob,
  _onFindAlumni,
  _onAdminPending,
}) => {
  const greeting = greetingProp || hourGreeting();

  const isAdmin = userType === 'admin';
  const isAlumni = userType === 'alumni';

  return (
    <header className={styles.header} aria-label="Dashboard header">
      <div className={styles.greetingBlock}>
        <h1 className={styles.title}>{greeting}</h1>
        {college && (
          <div className={styles.metaLine}>
            <span className={styles.college}>{college}</span>
            {branch && <Chip label={branch} />}
            {gradYear && <Chip label={`Class of ${gradYear}`} />}
          </div>
        )}
      </div>

      <div className={styles.actions}>
        {isAdmin ? (
          <>
            <Link to="/jobs">
              <Button variant="primary">
                <Briefcase size={16} strokeWidth={1.75} aria-hidden="true" />
                Post a job
              </Button>
            </Link>
            {pendingCount && pendingCount > 0 && (
              <Link to="/admin">
                <Button variant="plain" className={styles.pendingBtn} aria-label={`${pendingCount} pending verifications`}>
                  <span className={styles.pendingDot} aria-hidden="true" />
                  {pendingCount} pending
                </Button>
              </Link>
            )}
          </>
        ) : (
          <>
            {isAlumni ? (
              <Link to="/jobs">
                <Button variant="primary">
                  <Briefcase size={16} strokeWidth={1.75} aria-hidden="true" />
                  Post a job
                </Button>
              </Link>
            ) : (
              <Link to="/directory">
                <Button variant="primary">
                  <Users size={16} strokeWidth={1.75} aria-hidden="true" />
                  Find alumni
                </Button>
              </Link>
            )}
            <Link to="/directory">
              <Button variant="plain">
                <Users size={16} strokeWidth={1.75} aria-hidden="true" />
                Find alumni
              </Button>
            </Link>
          </>
        )}
      </div>
    </header>
  );
};

const Chip: React.FC<{ label: string }> = ({ label }) => (
  <Badge variant="neutral" size="sm" className={styles.metaChip}>
    {label}
  </Badge>
);

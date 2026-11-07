import React, { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Calendar, Check, MapPin, Plus, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { NewEventModal } from '../components/NewEventModal';
import { PageHeader } from '../components/shell/PageHeader';
import { Button, EmptyState, SegmentedControl, Skeleton } from '../components/ui';
import { listStagger, SPRING } from '../lib/motion';
import styles from './Events.module.css';

export interface EventPost {
  id: string;
  title: string;
  date: string;
  location: string;
  description: string;
  registered_count: number;
  audience?: 'All' | 'Student' | 'Alumni';
}

const Events: React.FC = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [events, setEvents] = useState<EventPost[]>([]);
  const [registeredEvents, setRegisteredEvents] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [isNewEventModalOpen, setIsNewEventModalOpen] = useState(false);
  const [when, setWhen] = useState<'upcoming' | 'past'>('upcoming');
  const reduced = useReducedMotion() ?? false;

  React.useEffect(() => {
    const fetchEvents = async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: true });

      if (!error && data) {
        setEvents(data as EventPost[]);
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: profile } = await supabase.from('profiles').select('user_type').eq('id', session.user.id).single();
        if (profile?.user_type === 'admin') {
          setIsAdmin(true);
        }
        const saved = localStorage.getItem(`registered_events_${session.user.id}`);
        if (saved) setRegisteredEvents(new Set(JSON.parse(saved)));
      }

      setLoading(false);
    };
    fetchEvents();
  }, []);

  // handleRegister logic preserved (localStorage optimistic + supabase update with fallback).
  const handleRegister = async (eventId: string) => {
    if (registeredEvents.has(eventId)) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const newSet = new Set(registeredEvents).add(eventId);
        setRegisteredEvents(newSet);
        localStorage.setItem(`registered_events_${session.user.id}`, JSON.stringify(Array.from(newSet)));
      }

      const event = events.find((e) => e.id === eventId);
      if (!event) return;

      const { error } = await supabase
        .from('events')
        .update({ registered_count: event.registered_count + 1 })
        .eq('id', eventId);

      if (error) {
        const { data: updated } = await supabase
          .from('events')
          .select('registered_count')
          .eq('id', eventId)
          .single();
        if (updated) {
          await supabase.from('events').update({ registered_count: updated.registered_count + 1 }).eq('id', eventId);
        }
      }

      setEvents(events.map((e) => (e.id === eventId ? { ...e, registered_count: e.registered_count + 1 } : e)));
    } catch (err) {
      console.error('Registration failed', err);
    }
  };

  // Upcoming/past filters already-loaded events client-side.
  const now = Date.now();
  const filteredEvents = events.filter((ev) => {
    const t = new Date(ev.date).getTime();
    return when === 'upcoming' ? t >= now : t < now;
  });

  const stagger = listStagger();

  return (
    <div className={styles.page}>
      <PageHeader
        title="Events"
        subtitle="Reunions, meetups, and what’s happening across the community."
        actions={
          isAdmin ? (
            <Button iconLeft={<Plus size={18} strokeWidth={1.75} />} onClick={() => setIsNewEventModalOpen(true)}>
              Create event
            </Button>
          ) : undefined
        }
      />

      <div className={styles.controls}>
        <SegmentedControl
          aria-label="Show events"
          options={[
            { value: 'upcoming', label: 'Upcoming' },
            { value: 'past', label: 'Past' },
          ]}
          value={when}
          onChange={(v) => setWhen(v as 'upcoming' | 'past')}
          size="sm"
        />
      </div>

      {loading ? (
        <div className={styles.grid}>
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className={styles.skelCard}>
              <Skeleton width={60} height={68} radius={12} />
              <div style={{ display: 'grid', gap: 8 }}>
                <Skeleton width="55%" height={18} />
                <Skeleton width="40%" height={14} />
                <Skeleton width="30%" height={14} />
              </div>
              <Skeleton width={112} height={38} radius={999} />
            </div>
          ))}
        </div>
      ) : filteredEvents.length === 0 ? (
        <EmptyState
          icon={<Calendar size={28} strokeWidth={1.75} />}
          title={when === 'upcoming' ? 'No upcoming events' : 'No past events'}
          description={
            when === 'upcoming'
              ? 'Nothing scheduled right now. Check back soon.'
              : 'Past events will appear here once they’ve happened.'
          }
        />
      ) : (
        <motion.div
          className={styles.grid}
          variants={reduced ? undefined : stagger.parent}
          initial={reduced ? undefined : 'hidden'}
          animate={reduced ? undefined : 'show'}
        >
          {filteredEvents.map((ev) => {
            const dateObj = new Date(ev.date);
            const month = dateObj.toLocaleDateString('en-US', { month: 'short' });
            const day = dateObj.toLocaleDateString('en-US', { day: 'numeric' });
            const registered = registeredEvents.has(ev.id);
            return (
              <motion.article key={ev.id} className={styles.card} variants={reduced ? undefined : stagger.child}>
                <div className={styles.dateTile} aria-label={dateObj.toLocaleDateString()}>
                  <span className={styles.month}>{month}</span>
                  <span className={styles.day}>{day}</span>
                </div>
                <div className={styles.body}>
                  <h3 className={styles.title}>{ev.title}</h3>
                  <div className={styles.meta}>
                    <span className={styles.metaItem}>
                      <MapPin size={15} strokeWidth={1.75} aria-hidden="true" />
                      {ev.location}
                    </span>
                    <span className={styles.metaItem}>
                      <Users size={15} strokeWidth={1.75} aria-hidden="true" />
                      {ev.registered_count} registered
                    </span>
                  </div>
                </div>
                <div className={styles.cardRight}>
                  <button
                    type="button"
                    className={`${styles.regBtn} ${registered ? styles.regBtnDone : styles.regBtnDefault}`}
                    onClick={() => handleRegister(ev.id)}
                    disabled={registered}
                    aria-pressed={registered}
                  >
                    <AnimatePresence mode="wait" initial={false}>
                      {registered ? (
                        <motion.span
                          key="done"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                          initial={reduced ? false : { opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.8 }}
                          transition={reduced ? { duration: 0.12 } : SPRING}
                        >
                          <Check size={16} strokeWidth={2.25} aria-hidden="true" />
                          Registered
                        </motion.span>
                      ) : (
                        <motion.span
                          key="reg"
                          initial={reduced ? false : { opacity: 0, scale: 0.96 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
                          transition={reduced ? { duration: 0.12 } : SPRING}
                        >
                          Register
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </button>
                </div>
              </motion.article>
            );
          })}
        </motion.div>
      )}

      <NewEventModal
        isOpen={isNewEventModalOpen}
        onClose={() => setIsNewEventModalOpen(false)}
        onSuccess={(newEvent) => {
          setEvents([newEvent, ...events]);
          setIsNewEventModalOpen(false);
        }}
      />
    </div>
  );
};

export default Events;

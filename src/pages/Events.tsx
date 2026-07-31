import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Users, PlusCircle, ArrowLeft, CheckCircle, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { NewEventModal } from '../components/NewEventModal';

export interface EventPost {
  id: string;
  title: string;
  date: string;
  location: string;
  description: string;
  registered_count: number;
}

const Events: React.FC = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [events, setEvents] = useState<EventPost[]>([]);
  const [registeredEvents, setRegisteredEvents] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  React.useEffect(() => {
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: profile } = await supabase.from('profiles').select('user_type').eq('id', session.user.id).single();
        if (profile?.user_type === 'admin') setIsAdmin(true);
      }

      const { data, error } = await supabase.from('events').select('*').order('date', { ascending: true });
      if (!error && data) {
        setEvents(data as EventPost[]);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleRegister = async (eventId: string) => {
    if (registeredEvents.has(eventId)) return;
    
    // In a real app we'd insert into an event_registrations table. 
    // Here we just increment the counter optimistically.
    setRegisteredEvents(prev => new Set(prev).add(eventId));
    setEvents(events.map(ev => 
      ev.id === eventId ? { ...ev, registered_count: ev.registered_count + 1 } : ev
    ));
    alert('Successfully registered for this event!');
  };

  const handleAddEvent = () => {
    setIsModalOpen(true);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column' }}>
      
      {/* Header */}
      <header style={{
        padding: '1rem 1.5rem',
        background: 'var(--bg-primary)',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}>
        <button onClick={() => navigate('/dashboard')} className="btn btn-ghost" style={{ padding: '0.5rem 0.75rem' }}>
          <ArrowLeft size={18} /> Back
        </button>
        <h1 style={{ fontSize: '1.25rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
          <Calendar size={20} color="var(--brand-primary)" /> Campus Events
        </h1>
      </header>

      <main className="container animate-fade-in" style={{ padding: '1.5rem', maxWidth: '1000px', width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.375rem' }}>Upcoming Events</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>Discover and register for upcoming college events, workshops, and networking mixers.</p>
          </div>
          {isAdmin && (
            <button className="btn btn-primary" onClick={handleAddEvent}>
              <PlusCircle size={18} /> Create Event
            </button>
          )}
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
            <Loader2 className="animate-spin" size={28} color="var(--brand-primary)" />
          </div>
        ) : events.length === 0 ? (
          <div className="card" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <Calendar size={40} style={{ opacity: 0.4, margin: '0 auto 0.75rem auto' }} />
            <p>No upcoming events at the moment.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
            {events.map((event) => {
              const isRegistered = registeredEvents.has(event.id);
              return (
                <div key={event.id} className="card-elevated" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column' }}>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                    color: 'var(--brand-primary)',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    marginBottom: '0.625rem',
                    background: 'var(--brand-subtle)',
                    padding: '0.25rem 0.625rem',
                    borderRadius: 'var(--radius-sm)',
                    alignSelf: 'flex-start',
                  }}>
                    <Calendar size={14} /> 
                    {new Date(event.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                  </div>
                  <h3 style={{ fontSize: '1.0625rem', marginBottom: '0.375rem', fontWeight: 600 }}>{event.title}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'var(--text-secondary)', fontSize: '0.8125rem', marginBottom: '0.75rem' }}>
                    <MapPin size={14} /> {event.location}
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6, flex: 1, marginBottom: '1.25rem' }}>
                    {event.description}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'var(--text-tertiary)', fontSize: '0.8125rem' }}>
                      <Users size={14} /> {event.registered_count} registered
                    </div>
                    <button 
                      className={isRegistered ? "btn btn-outline" : "btn btn-primary"}
                      style={{
                        padding: '0.375rem 0.75rem',
                        fontSize: '0.8125rem',
                        color: isRegistered ? 'var(--accent-success)' : undefined,
                        borderColor: isRegistered ? 'var(--accent-success)' : undefined,
                      }}
                      onClick={() => handleRegister(event.id)}
                      disabled={isRegistered}
                    >
                      {isRegistered ? <><CheckCircle size={14} /> Registered</> : 'Register'}
                    </button>
                  {isAdmin && (
                    <span style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
                      Admin View
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        )}
      </main>

      <NewEventModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={(newEvent) => setEvents([...events, newEvent])}
      />
    </div>
  );
};

export default Events;

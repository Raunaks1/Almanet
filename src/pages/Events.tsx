import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Users, PlusCircle, ArrowLeft, CheckCircle, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { NewEventModal } from '../components/NewEventModal';

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
};

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
    <div style={{ minHeight: '100vh', background: COLORS.bg, display: 'flex', flexDirection: 'column', fontFamily: '"Inter", sans-serif' }}>
      
      {/* Header */}
      <header style={{
        padding: '1.25rem 2rem',
        background: COLORS.white,
        borderBottom: `2px solid ${COLORS.border}`,
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}>
        <button 
          onClick={() => navigate('/dashboard')} 
          style={{ 
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.5rem 1rem', borderRadius: '99px',
            background: COLORS.white, border: `2px solid ${COLORS.border}`,
            color: COLORS.text, fontWeight: 800, cursor: 'pointer',
            boxShadow: '4px 4px 0px rgba(13,30,20,1)', textTransform: 'uppercase', fontSize: '0.8125rem'
          }}
        >
          <ArrowLeft size={16} strokeWidth={2.5} /> Back
        </button>
        <h1 style={{ fontSize: '1.5rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 900, color: COLORS.text, textTransform: 'uppercase', letterSpacing: '-0.02em' }}>
          <Calendar size={24} strokeWidth={2.5} color={COLORS.text} /> Campus Events
        </h1>
      </header>

      <main style={{ padding: '2.5rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <h2 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '0.5rem', color: COLORS.text, textTransform: 'uppercase', letterSpacing: '-0.02em' }}>Upcoming Events</h2>
            <p style={{ color: COLORS.textMuted, fontSize: '1rem', fontWeight: 600 }}>Discover and register for upcoming college events, workshops, and networking mixers.</p>
          </div>
          {isAdmin && (
            <button 
              onClick={handleAddEvent}
              style={{ 
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.875rem 2rem', borderRadius: '99px',
                background: COLORS.sage, border: `2px solid ${COLORS.border}`,
                color: COLORS.text, fontWeight: 900, cursor: 'pointer',
                boxShadow: '4px 4px 0px rgba(13,30,20,1)', textTransform: 'uppercase', fontSize: '0.9375rem',
                transition: 'transform 0.1s'
              }}
              onMouseDown={(e) => { e.currentTarget.style.transform = 'translate(2px, 2px)'; e.currentTarget.style.boxShadow = '2px 2px 0px rgba(13,30,20,1)'; }}
              onMouseUp={(e) => { e.currentTarget.style.transform = 'translate(0, 0)'; e.currentTarget.style.boxShadow = '4px 4px 0px rgba(13,30,20,1)'; }}
            >
              <PlusCircle size={20} strokeWidth={2.5} /> Create Event
            </button>
          )}
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
            <div style={{ width: '36px', height: '36px', border: `4px solid ${COLORS.border}`, borderTopColor: COLORS.sage, borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          </div>
        ) : events.length === 0 ? (
          <div style={{ 
            background: COLORS.white, padding: '4rem', textAlign: 'center', 
            border: `2px dashed ${COLORS.border}`, borderRadius: '24px',
            color: COLORS.textMuted 
          }}>
            <Calendar size={48} style={{ opacity: 0.5, margin: '0 auto 1rem auto' }} strokeWidth={1.5} />
            <p style={{ fontWeight: 900, fontSize: '1.25rem', color: COLORS.text, margin: 0, textTransform: 'uppercase' }}>No upcoming events at the moment.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '2rem' }}>
            {events.map((event, idx) => {
              const isRegistered = registeredEvents.has(event.id);
              const accentColors = [COLORS.lavender, COLORS.blue, COLORS.sage, COLORS.warning];
              const cardAccent = accentColors[idx % accentColors.length];

              return (
                <div key={event.id} style={{ 
                  background: COLORS.white, padding: '1.5rem', display: 'flex', flexDirection: 'column',
                  border: `2px solid ${COLORS.border}`, borderRadius: '24px', boxShadow: '8px 8px 0px rgba(13,30,20,1)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                      color: COLORS.text, fontSize: '0.8125rem', fontWeight: 900, textTransform: 'uppercase',
                      background: cardAccent, padding: '0.375rem 0.75rem', borderRadius: '9999px',
                      border: `2px solid ${COLORS.border}`
                    }}>
                      <Calendar size={14} strokeWidth={2.5} /> 
                      {new Date(event.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                    </div>
                    {event.audience && (
                      <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                        color: COLORS.text, fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase',
                        background: COLORS.bg, padding: '0.25rem 0.625rem', borderRadius: '9999px',
                        border: `1.5px solid ${COLORS.border}`
                      }}>
                        For: {event.audience}
                      </div>
                    )}
                  </div>
                  
                  <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', fontWeight: 900, color: COLORS.text, textTransform: 'uppercase', letterSpacing: '-0.02em' }}>{event.title}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: COLORS.text, fontSize: '0.875rem', fontWeight: 700, marginBottom: '1rem' }}>
                    <MapPin size={16} strokeWidth={2.5} /> {event.location}
                  </div>
                  
                  <p style={{ color: COLORS.textMuted, fontSize: '0.9375rem', fontWeight: 500, lineHeight: 1.6, flex: 1, marginBottom: '1.5rem' }}>
                    {event.description}
                  </p>
                  
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: `2px solid ${COLORS.border}`, paddingTop: '1.25rem', marginTop: 'auto' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: COLORS.text, fontSize: '0.875rem', fontWeight: 800 }}>
                      <Users size={16} strokeWidth={2.5} /> {event.registered_count} <span style={{ textTransform: 'uppercase' }}>registered</span>
                    </div>
                    
                    {!isAdmin && (
                      <button 
                        style={{
                          padding: '0.5rem 1.25rem', borderRadius: '99px',
                          fontSize: '0.8125rem', fontWeight: 900, textTransform: 'uppercase',
                          background: isRegistered ? COLORS.sage : COLORS.text,
                          color: isRegistered ? COLORS.text : COLORS.white,
                          border: `2px solid ${COLORS.border}`,
                          cursor: isRegistered ? 'default' : 'pointer',
                          boxShadow: isRegistered ? '2px 2px 0px rgba(13,30,20,1)' : '4px 4px 0px rgba(13,30,20,0.3)',
                          display: 'flex', alignItems: 'center', gap: '0.375rem'
                        }}
                        onClick={() => handleRegister(event.id)}
                        disabled={isRegistered}
                      >
                        {isRegistered ? <><CheckCircle size={14} strokeWidth={2.5} /> Registered</> : 'Register'}
                      </button>
                    )}
                    {isAdmin && (
                      <span style={{ fontSize: '0.8125rem', color: COLORS.textMuted, fontStyle: 'italic', fontWeight: 700 }}>
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

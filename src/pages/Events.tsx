import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Users, PlusCircle, ArrowLeft, CheckCircle } from 'lucide-react';
import { mockEvents } from '../lib/mockData';

const Events: React.FC = () => {
  const navigate = useNavigate();
  // Read user from localStorage to determine if admin
  const mockEmail = localStorage.getItem('mockUserEmail') || '';
  const isAdmin = mockEmail.includes('admin');

  const [events, setEvents] = useState(mockEvents);
  const [registeredEvents, setRegisteredEvents] = useState<Set<string>>(new Set());

  const handleRegister = (eventId: string) => {
    if (registeredEvents.has(eventId)) return;
    
    setRegisteredEvents(prev => new Set(prev).add(eventId));
    setEvents(events.map(ev => 
      ev.id === eventId ? { ...ev, registeredCount: ev.registeredCount + 1 } : ev
    ));
    alert('Successfully registered for this event!');
  };

  const handleAddEvent = () => {
    alert('Mock: Open modal to add a new event (Admin only).');
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column' }}>
      
      {/* Header */}
      <header style={{ padding: '1.5rem 2rem', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '1rem', position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={() => navigate('/dashboard')} className="btn btn-outline" style={{ padding: '0.5rem 1rem' }}>
          <ArrowLeft size={18} /> Back
        </button>
        <h1 style={{ fontSize: '1.5rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Calendar size={24} color="var(--brand-primary)" /> Campus Events
        </h1>
      </header>

      <main className="container animate-fade-in" style={{ padding: '2rem 1.5rem', maxWidth: '1000px', width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Upcoming Events</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Discover and register for upcoming college events, workshops, and networking mixers.</p>
          </div>
          {isAdmin && (
            <button className="btn btn-primary" onClick={handleAddEvent}>
              <PlusCircle size={20} /> Create Event
            </button>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {events.map((event) => {
            const isRegistered = registeredEvents.has(event.id);
            return (
              <div key={event.id} className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--brand-secondary)', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem' }}>
                  <Calendar size={16} /> {event.date}
                </div>
                
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>{event.title}</h3>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1rem' }}>
                  <MapPin size={16} /> {event.location}
                </div>
                
                <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9375rem', marginBottom: '1.5rem', flexGrow: 1 }}>
                  {event.description}
                </p>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: 'auto' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    <Users size={16} /> {event.registeredCount} attending
                  </div>
                  {!isAdmin && (
                    <button 
                      className={isRegistered ? "btn btn-outline" : "btn btn-primary"}
                      style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', color: isRegistered ? 'var(--accent-success)' : undefined, borderColor: isRegistered ? 'rgba(16, 185, 129, 0.3)' : undefined }}
                      onClick={() => handleRegister(event.id)}
                      disabled={isRegistered}
                    >
                      {isRegistered ? <><CheckCircle size={16} /> Registered</> : 'Register'}
                    </button>
                  )}
                  {isAdmin && (
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
                      Admin View
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default Events;

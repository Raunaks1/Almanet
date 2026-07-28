import React from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap, Briefcase, Users, Sun, Moon,
  Network, BookOpen, Heart, ArrowRight, MessageSquare,
} from 'lucide-react';
import { useTheme } from '../ThemeContext';

const featureCards = [
  {
    icon: <Users size={22} />,
    title: 'Alumni Directory',
    description: 'Connect with graduates across various industries, graduation years, and specializations.',
    accentColor: 'var(--brand-primary)',
    bg: 'var(--brand-subtle)',
    link: '/directory',
  },
  {
    icon: <Briefcase size={22} />,
    title: 'Job Portal',
    description: 'Explore exclusive career opportunities and post job openings within the network.',
    accentColor: 'var(--accent-success)',
    bg: 'var(--accent-success-subtle)',
    link: '/jobs',
  },
  {
    icon: <Network size={22} />,
    title: 'Networking Hub',
    description: 'Build meaningful connections with fellow alumni across industries and batches.',
    accentColor: 'var(--brand-secondary)',
    bg: 'rgba(124, 58, 237, 0.08)',
    link: '/dashboard',
  },
  {
    icon: <BookOpen size={22} />,
    title: 'Mentorship',
    description: 'Get personalised career guidance from senior alumni mentors ready to elevate your journey.',
    accentColor: 'var(--accent-warning)',
    bg: 'var(--accent-warning-subtle)',
    link: '/dashboard',
  },
  {
    icon: <MessageSquare size={22} />,
    title: 'Community Chat',
    description: 'Engage in real-time conversations with batch channels, branch groups, and direct messages.',
    accentColor: 'var(--brand-primary)',
    bg: 'var(--brand-subtle)',
    link: '/chat',
  },
  {
    icon: <Heart size={22} />,
    title: 'Donation',
    description: 'Support scholarships and college programs — ignite a legacy of generosity.',
    accentColor: 'var(--accent-danger)',
    bg: 'var(--accent-danger-subtle)',
    link: '/dashboard',
  },
];

const Home: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>

      {/* ── Navbar ── */}
      <nav style={{
        padding: '1rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid var(--border-color)',
        background: 'var(--bg-primary)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <GraduationCap size={28} color="var(--brand-primary)" />
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>AlmaNET</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button onClick={toggleTheme} className="theme-toggle" aria-label="Toggle theme">
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          <Link to="/auth" className="btn btn-outline">Login</Link>
          <Link to="/auth?mode=register" className="btn btn-primary">Join Network</Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <main className="container" style={{ paddingTop: '5rem', paddingBottom: '4rem', textAlign: 'center' }}>
        <div style={{
          display: 'inline-block',
          padding: '0.375rem 1rem',
          background: 'var(--brand-subtle)',
          borderRadius: '9999px',
          fontSize: '0.8125rem',
          fontWeight: 500,
          color: 'var(--brand-primary)',
          marginBottom: '1.5rem',
        }}>
          Technical Education Department
        </div>

        <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', marginBottom: '1.25rem', fontWeight: 800, lineHeight: 1.15 }}>
          Bridge the Gap Between{' '}
          <span style={{ color: 'var(--brand-primary)' }}>Alumni &amp; Students</span>
        </h1>

        <p style={{
          fontSize: '1.125rem',
          color: 'var(--text-secondary)',
          maxWidth: '560px',
          margin: '0 auto 2.5rem auto',
          lineHeight: 1.7,
        }}>
          The official platform to foster lifelong connections, mentorship, and professional growth within the network.
        </p>

        <div className="flex-center" style={{ gap: '0.75rem' }}>
          <Link to="/auth?mode=register" className="btn btn-primary" style={{ fontSize: '0.9375rem', padding: '0.75rem 1.75rem' }}>
            Get Started
          </Link>
        </div>
      </main>

      {/* ── Section label ── */}
      <div className="container" style={{ paddingBottom: '1.25rem' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          marginBottom: '0.25rem',
        }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
          <span style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            color: 'var(--text-tertiary)',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            whiteSpace: 'nowrap',
          }}>
            What you get
          </span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
        </div>
      </div>

      {/* ── Features Grid ── */}
      <section className="container" style={{ paddingBottom: '5rem' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.25rem',
        }}>
          {featureCards.map((card) => (
            <Link
              key={card.title}
              to={card.link}
              style={{ textDecoration: 'none' }}
            >
              <div
                className="card-elevated"
                style={{
                  padding: '1.75rem',
                  height: '100%',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0',
                }}
              >
                {/* Icon */}
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: 'var(--radius-md)',
                  background: card.bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: card.accentColor,
                  marginBottom: '1.125rem',
                  flexShrink: 0,
                }}>
                  {card.icon}
                </div>

                <h3 style={{ fontSize: '1.0625rem', marginBottom: '0.4rem', fontWeight: 600 }}>
                  {card.title}
                </h3>

                <p style={{
                  color: 'var(--text-secondary)',
                  fontSize: '0.875rem',
                  lineHeight: 1.65,
                  margin: '0 0 1.25rem 0',
                  flex: 1,
                }}>
                  {card.description}
                </p>

                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: card.accentColor,
                }}>
                  Learn more <ArrowRight size={13} strokeWidth={2.5} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;

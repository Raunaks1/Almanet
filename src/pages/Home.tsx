import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Users, Briefcase, GraduationCap, ArrowUpRight } from 'lucide-react';

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
};

const Header = () => (
  <nav style={{
    padding: '1.25rem 3rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: COLORS.bg,
    borderBottom: `1px solid ${COLORS.border}`,
    position: 'sticky',
    top: 0,
    zIndex: 50,
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      <GraduationCap size={32} color={COLORS.text} strokeWidth={2.5} />
      <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: COLORS.text, letterSpacing: '-0.02em' }}>AlmaNET</h2>
    </div>
    


    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
      <Link to="/auth" style={{ 
        textDecoration: 'none', 
        color: COLORS.text, 
        fontWeight: 600,
        fontSize: '0.9375rem'
      }}>
        Log in
      </Link>
      <Link to="/auth?mode=register" style={{ 
        background: COLORS.text,
        color: COLORS.white,
        padding: '0.625rem 1.25rem',
        borderRadius: '99px',
        textDecoration: 'none',
        fontWeight: 600,
        fontSize: '0.9375rem',
        border: `1.5px solid ${COLORS.text}`,
        transition: 'all 0.2s ease',
      }}>
        Join Network
      </Link>
    </div>
  </nav>
);

const Hero = () => (
  <header style={{ padding: '6rem 2rem 4rem 2rem', textAlign: 'center', background: COLORS.bg }}>


    <h1 style={{ 
      fontSize: 'clamp(3rem, 7vw, 5.5rem)', 
      fontWeight: 900, 
      color: COLORS.text,
      lineHeight: 1.05,
      maxWidth: '1000px',
      margin: '0 auto 1.5rem auto',
      letterSpacing: '-0.03em',
      textTransform: 'uppercase'
    }}>
      FINALLY, A BETTER WAY TO CONNECT ALUMNI & STUDENTS
    </h1>

    <p style={{
      fontSize: '1.25rem',
      color: COLORS.textMuted,
      maxWidth: '600px',
      margin: '0 auto 3rem auto',
      lineHeight: 1.6,
      fontWeight: 500,
    }}>
      The official platform to foster lifelong connections, mentorship, and professional growth. Stop losing touch.
    </p>

    <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', alignItems: 'center' }}>

      <Link to="/auth?mode=register" style={{ 
        background: COLORS.text,
        color: COLORS.white,
        padding: '1rem 2rem',
        borderRadius: '99px',
        textDecoration: 'none',
        fontWeight: 700,
        fontSize: '1rem',
        border: `2px solid ${COLORS.text}`,
        boxShadow: '4px 4px 0px rgba(13,30,20,0.2)',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        Get Started <ArrowRight size={18} />
      </Link>
    </div>

    {/* Hero Image / Mockup */}
    <div style={{ marginTop: '5rem', position: 'relative', maxWidth: '1200px', margin: '5rem auto 0 auto' }}>
      <img 
        src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2850&auto=format&fit=crop" 
        alt="Students collaborating" 
        style={{
          width: '100%',
          height: '600px',
          objectFit: 'cover',
          borderRadius: '32px',
          border: `2px solid ${COLORS.border}`,
          boxShadow: '8px 8px 0px rgba(13,30,20,1)',
        }}
      />
      {/* Floating Mockup Card */}
      <div style={{
        position: 'absolute',
        bottom: '-2rem',
        right: '4rem',
        background: COLORS.white,
        padding: '1.5rem',
        borderRadius: '16px',
        border: `2px solid ${COLORS.border}`,
        boxShadow: '8px 8px 0px rgba(13,30,20,1)',
        width: '320px',
        textAlign: 'left'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <img 
            src="/profile.png" 
            alt="Raunak Shaikh"
            style={{ width: 40, height: 40, borderRadius: '50%', border: `1.5px solid ${COLORS.border}`, objectFit: 'cover', background: COLORS.lavender }} 
          />
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.9375rem', color: COLORS.text }}>Raunak Shaikh</div>
            <div style={{ fontWeight: 600, fontSize: '0.75rem', color: COLORS.textMuted }}>Software Engineer @ Google</div>
          </div>
        </div>
        <div style={{ fontWeight: 600, fontSize: '0.875rem', color: COLORS.text, background: COLORS.bg, padding: '0.75rem', borderRadius: '8px', border: `1px solid ${COLORS.border}` }}>
          "Hey everyone! I'm happy to review resumes for the upcoming fall recruitment."
        </div>
      </div>
    </div>
  </header>
);



const FeatureBlock = ({ title, desc, tag, color, reverse, img }: any) => (
  <section style={{ padding: '6rem 2rem', background: COLORS.bg, borderTop: `1px solid ${COLORS.border}` }}>
    <div style={{ 
      maxWidth: '1200px', 
      margin: '0 auto', 
      display: 'flex', 
      flexDirection: reverse ? 'row-reverse' : 'row',
      alignItems: 'center',
      gap: '4rem'
    }}>
      <div style={{ flex: 1 }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          padding: '0.375rem 0.875rem',
          background: color,
          border: `1.5px solid ${COLORS.border}`,
          borderRadius: '99px',
          fontSize: '0.8125rem',
          fontWeight: 700,
          color: COLORS.text,
          marginBottom: '1.5rem',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          {tag}
        </div>
        <h2 style={{ 
          fontSize: 'clamp(2rem, 3.5vw, 3.5rem)', 
          fontWeight: 900, 
          color: COLORS.text,
          lineHeight: 1.1,
          marginBottom: '1.5rem',
          textTransform: 'uppercase',
          letterSpacing: '-0.02em',
        }}>
          {title}
        </h2>
        <p style={{
          fontSize: '1.125rem',
          color: COLORS.textMuted,
          lineHeight: 1.6,
          fontWeight: 500,
          marginBottom: '2.5rem',
          maxWidth: '480px'
        }}>
          {desc}
        </p>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {['Access exclusive directory', 'Direct messaging capabilities', 'Advanced search filters'].map(item => (
            <li key={item} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 700, color: COLORS.text }}>
              <CheckCircle2 size={20} color={color} fill={COLORS.border} stroke={COLORS.bg} />
              {item}
            </li>
          ))}
        </ul>
      </div>
      
      <div style={{ flex: 1, display: 'flex', justifyContent: reverse ? 'flex-start' : 'flex-end' }}>
        <div style={{
          width: '100%',
          maxWidth: '500px',
          height: '500px',
          background: color,
          borderRadius: '32px',
          border: `2px solid ${COLORS.border}`,
          boxShadow: '12px 12px 0px rgba(13,30,20,1)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <img src={img} alt="Feature visual" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.9, mixBlendMode: 'multiply' }} />
        </div>
      </div>
    </div>
  </section>
);

const Footer = () => (
  <footer style={{ 
    background: COLORS.text, 
    padding: '6rem 2rem 4rem 2rem', 
    color: COLORS.bg 
  }}>
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6rem' }}>
        <div>
          <h2 style={{ fontSize: '3rem', fontWeight: 900, margin: '0 0 1rem 0', textTransform: 'uppercase' }}>Ready to Grow?</h2>
          <Link to="/auth?mode=register" style={{ 
            background: COLORS.sage,
            color: COLORS.text,
            padding: '1rem 2rem',
            borderRadius: '99px',
            textDecoration: 'none',
            fontWeight: 800,
            fontSize: '1rem',
            border: `2px solid ${COLORS.bg}`,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            textTransform: 'uppercase'
          }}>
            Create your account <ArrowUpRight size={20} />
          </Link>
        </div>
        <div style={{ display: 'flex', gap: '4rem', fontWeight: 600 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ color: COLORS.sage, textTransform: 'uppercase', fontSize: '0.875rem' }}>Platform</div>
            <Link to="/directory" style={{ color: 'inherit', textDecoration: 'none' }}>Directory</Link>
            <Link to="/jobs" style={{ color: 'inherit', textDecoration: 'none' }}>Jobs</Link>
            <Link to="/events" style={{ color: 'inherit', textDecoration: 'none' }}>Events</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ color: COLORS.sage, textTransform: 'uppercase', fontSize: '0.875rem' }}>Company</div>
            <Link to="/about" style={{ color: 'inherit', textDecoration: 'none' }}>About Us</Link>
            <Link to="/privacy" style={{ color: 'inherit', textDecoration: 'none' }}>Privacy Policy</Link>
            <Link to="/terms" style={{ color: 'inherit', textDecoration: 'none' }}>Terms of Service</Link>
          </div>
        </div>
      </div>
      <div style={{ borderTop: `1px solid rgba(255,255,255,0.1)`, paddingTop: '2rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', fontWeight: 500, color: 'rgba(255,255,255,0.6)' }}>
        <div>© 2026 AlmaNET. All rights reserved.</div>
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          <span>Twitter</span>
          <span>LinkedIn</span>
          <span>Instagram</span>
        </div>
      </div>
    </div>
  </footer>
);

export default function Home() {
  return (
    <div style={{ minHeight: '100vh', background: COLORS.bg, fontFamily: '"Inter", sans-serif' }}>
      <Header />
      <Hero />

      
      <FeatureBlock 
        tag="Directory"
        title="Find people who hate wasting time"
        desc="Search through thousands of verified alumni. Filter by industry, graduation year, and company to find exactly who you need to connect with."
        color={COLORS.sage}
        img="https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=2000&auto=format&fit=crop"
      />
      
      <FeatureBlock 
        tag="Career Board"
        title="Opportunities you won't find on LinkedIn"
        desc="Exclusive job postings, internships, and referral opportunities shared directly by alumni working at top-tier companies."
        color={COLORS.lavender}
        reverse={true}
        img="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=2000&auto=format&fit=crop"
      />

      <Footer />
    </div>
  );
}

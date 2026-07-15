import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Briefcase, Users, HeartHandshake } from 'lucide-react';

const Home: React.FC = () => {
  return (
    <div className="home-page">
      {/* Navbar */}
      <nav style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', background: 'var(--glass-bg)', backdropFilter: 'blur(12px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <GraduationCap size={32} color="var(--brand-primary)" />
          <h2 className="text-gradient" style={{ margin: 0, fontSize: '1.5rem' }}>AlmaNET</h2>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link to="/auth" className="btn btn-outline">Login</Link>
          <Link to="/auth?mode=register" className="btn btn-primary">Join Network</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="container" style={{ paddingTop: '6rem', paddingBottom: '6rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '4rem', marginBottom: '1.5rem', fontWeight: 800 }}>
          Bridge the Gap Between <br />
          <span className="text-gradient">Alumni and Students</span>
        </h1>
        <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto 3rem auto' }}>
          The official platform for the Technical Education Department to foster lifelong connections, mentorship, and professional growth.
        </p>
        <div className="flex-center" style={{ gap: '1rem' }}>
          <Link to="/auth?mode=register" className="btn btn-primary" style={{ fontSize: '1.125rem', padding: '1rem 2rem' }}>Get Started Today</Link>
          <a href="#features" className="btn btn-glass" style={{ fontSize: '1.125rem', padding: '1rem 2rem' }}>Explore Features</a>
        </div>
      </main>

      {/* Features Grid */}
      <section id="features" className="container" style={{ paddingBottom: '6rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          
          <div className="glass-card" style={{ padding: '2rem' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
              <Users size={24} color="var(--brand-primary)" />
            </div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem' }}>Alumni Directory</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Connect with graduates across various industries, graduation years, and specializations.</p>
          </div>



          <div className="glass-card" style={{ padding: '2rem' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
              <Briefcase size={24} color="var(--accent-success)" />
            </div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem' }}>Job Portal</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Explore exclusive career opportunities and post job openings within the network.</p>
          </div>

        </div>
      </section>
    </div>
  );
};

export default Home;

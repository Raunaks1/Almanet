import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
  LogOut, LayoutDashboard, Users, Briefcase, MessageSquare,
  MessageCircle, Calendar, ShieldAlert, Sun, Moon,
  GraduationCap, Newspaper, Star, Tag, Lock, Clock,
} from 'lucide-react';
import { useTheme } from '../ThemeContext';
import { getStoriesForCollege } from '../lib/collegeNews';
import type { CollegeStory } from '../lib/collegeNews';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'news' | 'success'>('all');

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error || !session) {
          navigate('/auth');
          return;
        }

        // Use select('*') — safest across any schema
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileData) {
          setProfile(profileData);
        }

        // Always set user — merge profile fields on top of auth metadata
        setUser({
          ...session.user,
          user_metadata: {
            ...session.user.user_metadata,
            ...(profileData ? {
              user_type: profileData.user_type,
              full_name: profileData.full_name,
              college: profileData.college,
              branch: profileData.branch,
              degree: profileData.degree,
              graduation_year: profileData.graduation_year,
            } : {}),
          },
        });
      } catch (err) {
        console.error('Dashboard init error:', err);
      } finally {
        setLoading(false);
      }
    };
    checkUser();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
        <div
          className="animate-spin"
          style={{ width: '36px', height: '36px', border: '3px solid var(--border-color)', borderTopColor: 'var(--brand-primary)', borderRadius: '50%' }}
        />
      </div>
    );
  }

  // College name: from merged metadata → profile direct → auth metadata
  const meta = user?.user_metadata || {};
  const collegeName: string =
    meta.college ||
    profile?.college ||
    meta.college_name ||
    '';

  const branch: string = meta.branch || profile?.branch || '';
  const degree: string = meta.degree || profile?.degree || '';
  const gradYear: string | number = meta.graduation_year || profile?.graduation_year || '';
  const userType: string = meta.user_type || profile?.user_type || 'alumni';
  const fullName: string = meta.full_name || user?.email || 'there';

  const verificationStatus: string = profile?.verification_status || meta.verification_status || 'pending';
  const isVerified = userType === 'admin' || verificationStatus === 'approved';

  const stories: CollegeStory[] = getStoriesForCollege(collegeName);
  const filtered = activeTab === 'all' ? stories : stories.filter(s => s.type === activeTab);

  const navItems = [
    { to: '/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard', active: true, restricted: false },
    { to: '/chat', icon: <MessageCircle size={18} />, label: 'Messages', restricted: true },
    { to: '/directory', icon: <Users size={18} />, label: 'Alumni Directory', restricted: true },
    { to: '/forums', icon: <MessageSquare size={18} />, label: 'Discussion Forums', restricted: true },
    { to: '/jobs', icon: <Briefcase size={18} />, label: 'Job Portal', restricted: true },
    { to: '/events', icon: <Calendar size={18} />, label: 'Campus Events', restricted: true },
  ];

  const tagColors: Record<string, { bg: string; text: string }> = {
    Placement:      { bg: 'var(--accent-success-subtle)',  text: 'var(--accent-success)' },
    Research:       { bg: 'var(--brand-subtle)',           text: 'var(--brand-primary)' },
    Startup:        { bg: 'var(--accent-warning-subtle)', text: 'var(--accent-warning)' },
    Event:          { bg: 'rgba(124,58,237,0.08)',         text: 'var(--brand-secondary)' },
    Infrastructure: { bg: 'rgba(124,58,237,0.08)',         text: 'var(--brand-secondary)' },
    Workshop:       { bg: 'var(--accent-warning-subtle)', text: 'var(--accent-warning)' },
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>

      {/* ── Sidebar ── */}
      <aside style={{
        width: '256px',
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border-color)',
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem', padding: '0 0.25rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>AlmaNET</h2>
          <button onClick={toggleTheme} className="theme-toggle" aria-label="Toggle theme" style={{ width: '32px', height: '32px' }}>
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
          </button>
        </div>

        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {navItems.map(item => {
            const locked = item.restricted && !isVerified;
            return (
              <Link
                key={item.to}
                to={locked ? '#' : item.to}
                onClick={locked ? (e: React.MouseEvent) => e.preventDefault() : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.625rem',
                  padding: '0.625rem 0.75rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.875rem',
                  fontWeight: item.active ? 500 : 400,
                  color: locked ? 'var(--text-tertiary)' : item.active ? 'var(--brand-primary)' : 'var(--text-secondary)',
                  background: item.active ? 'var(--brand-subtle)' : 'transparent',
                  textDecoration: 'none',
                  transition: 'all 0.15s ease',
                  opacity: locked ? 0.55 : 1,
                  cursor: locked ? 'not-allowed' : 'pointer',
                }}
                onMouseOver={e => { if (!item.active && !locked) e.currentTarget.style.background = 'var(--bg-tertiary)'; }}
                onMouseOut={e => { if (!item.active && !locked) e.currentTarget.style.background = 'transparent'; }}
                title={locked ? 'Verification required' : item.label}
              >
                {item.icon}
                <span style={{ flex: 1 }}>{item.label}</span>
                {locked && <Lock size={13} strokeWidth={2.5} />}
              </Link>
            );
          })}

          {userType === 'admin' && (
            <>
              <div style={{ height: '1px', background: 'var(--border-color)', margin: '0.5rem 0' }} />
              <Link
                to="/admin"
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.625rem',
                  padding: '0.625rem 0.75rem', borderRadius: 'var(--radius-md)',
                  fontSize: '0.875rem', color: 'var(--accent-warning)',
                  textDecoration: 'none', transition: 'all 0.15s ease',
                }}
                onMouseOver={e => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                onMouseOut={e => e.currentTarget.style.background = 'transparent'}
              >
                <ShieldAlert size={18} /> Verification Queue
              </Link>
            </>
          )}
        </nav>

        {/* Profile footer */}
        <div style={{ marginTop: 'auto', paddingTop: '1.25rem', borderTop: '1px solid var(--border-color)' }}>
          <Link
            to={user?.id ? `/profile/${user.id}` : '#'}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.625rem',
              marginBottom: '0.75rem', padding: '0.5rem',
              borderRadius: 'var(--radius-md)', textDecoration: 'none',
              color: 'inherit', transition: 'background 0.15s ease',
            }}
            onMouseOver={e => e.currentTarget.style.background = 'var(--bg-tertiary)'}
            onMouseOut={e => e.currentTarget.style.background = 'transparent'}
            title="View Profile"
          >
            <div style={{
              width: '36px', height: '36px', borderRadius: '50%',
              background: 'var(--brand-primary)', color: 'white', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 600, fontSize: '0.875rem',
            }}>
              {fullName.charAt(0).toUpperCase()}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <p style={{ fontWeight: 500, fontSize: '0.8125rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', margin: 0, color: 'var(--text-primary)' }}>
                {fullName}
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', margin: 0 }}>
                {user?.email}
              </p>
            </div>
          </Link>
          <button onClick={handleSignOut} className="btn btn-outline" style={{ width: '100%', justifyContent: 'center', fontSize: '0.8125rem' }}>
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>

        {/* ── College Banner ── */}
        {collegeName ? (
          <div style={{
            background: 'linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-secondary) 100%)',
            borderRadius: 'var(--radius-xl)',
            padding: '1.5rem 2rem',
            marginBottom: '2rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1.25rem',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', right: '-40px', top: '-40px', width: '160px', height: '160px', borderRadius: '50%', background: 'rgba(255,255,255,0.07)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', right: '80px', bottom: '-60px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />

            <div style={{
              width: '52px', height: '52px', borderRadius: 'var(--radius-lg)',
              background: 'rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <GraduationCap size={26} color="#fff" />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', margin: '0 0 0.25rem 0' }}>
                Your Institution
              </p>
              <h2 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 700, margin: 0, lineHeight: 1.3, fontFamily: 'Outfit, sans-serif' }}>
                {collegeName}
              </h2>
              {(degree || branch || gradYear) && (
                <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.8rem', margin: '0.3rem 0 0 0' }}>
                  {[degree, branch].filter(Boolean).join(' · ')}
                  {gradYear ? ` · Batch of ${gradYear}` : ''}
                </p>
              )}
            </div>

            <div style={{
              padding: '0.4rem 1rem',
              background: 'rgba(255,255,255,0.15)',
              borderRadius: '9999px',
              fontSize: '0.8rem',
              color: '#fff',
              fontWeight: 500,
              flexShrink: 0,
              whiteSpace: 'nowrap',
            }}>
              {userType === 'alumni' ? '🎓 Alumni' : userType === 'student' ? '📚 Student' : '🛡 Admin'}
            </div>
          </div>
        ) : (
          /* Soft prompt if college not set */
          <div style={{
            border: '1px dashed var(--border-color)',
            borderRadius: 'var(--radius-xl)',
            padding: '1.25rem 2rem',
            marginBottom: '2rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            background: 'var(--bg-secondary)',
          }}>
            <GraduationCap size={22} color="var(--text-tertiary)" />
            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem', margin: 0 }}>
              No college linked to your profile yet. Update your profile to see college news &amp; stories.
            </p>
          </div>
        )}

        {/* ── Unverified Banner ── */}
        {!isVerified && (
          <div style={{
            background: 'var(--accent-warning-subtle)',
            border: '1px solid var(--accent-warning)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.25rem 1.5rem',
            marginBottom: '2rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '1rem',
          }}>
            <ShieldAlert size={24} color="var(--accent-warning)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <h3 style={{ color: 'var(--accent-warning)', fontSize: '1rem', fontWeight: 600, margin: '0 0 0.25rem 0' }}>
                Account Pending Verification
              </h3>
              <p style={{ color: 'var(--text-primary)', fontSize: '0.875rem', margin: 0, lineHeight: 1.5 }}>
                Your account is currently being reviewed by the admin. 
                You can browse the dashboard, but you won't be able to access restricted features like the Alumni Directory, Job Portal, or Discussion Forums until your account is verified.
              </p>
            </div>
          </div>
        )}

        {/* Welcome */}
        <header style={{ marginBottom: '1.75rem' }}>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.375rem' }}>
            Welcome back, {fullName.split(' ')[0]}! 👋
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
            Here's what's happening in your network today.
          </p>
        </header>

        {/* ── News & Stories ── always show with generic content */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, fontFamily: 'Outfit, sans-serif' }}>
                {collegeName ? 'College News & Success Stories' : 'Network News & Success Stories'}
              </h2>
              <p style={{ color: 'var(--text-tertiary)', fontSize: '0.82rem', margin: '0.2rem 0 0 0' }}>
                {collegeName ? `Latest updates from ${collegeName}` : 'Highlights from the AlmaNET community'}
              </p>
            </div>

            {/* Tab filters */}
            <div style={{ display: 'flex', gap: '0.375rem', background: 'var(--bg-secondary)', padding: '0.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              {(['all', 'news', 'success'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: '0.35rem 0.875rem',
                    borderRadius: 'calc(var(--radius-md) - 2px)',
                    fontSize: '0.8125rem',
                    fontWeight: 500,
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    background: activeTab === tab ? 'var(--brand-primary)' : 'transparent',
                    color: activeTab === tab ? '#fff' : 'var(--text-secondary)',
                  }}
                >
                  {tab === 'all' ? 'All' : tab === 'news' ? '📰 News' : '⭐ Success'}
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '3rem 1rem',
              border: '1px dashed var(--border-color)',
              borderRadius: 'var(--radius-xl)',
              background: 'var(--bg-secondary)',
            }}>
              <div style={{
                width: '52px', height: '52px', borderRadius: '50%',
                background: 'var(--brand-subtle)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 1rem',
              }}>
                <Newspaper size={22} color="var(--brand-primary)" />
              </div>
              <p style={{ fontWeight: 600, fontSize: '0.9375rem', margin: '0 0 0.375rem 0', color: 'var(--text-primary)' }}>
                No stories yet
              </p>
              <p style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem', margin: 0 }}>
                News and success stories from your college will appear here once published.
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
              {filtered.map((story: CollegeStory) => {
                const tc = tagColors[story.tag] || { bg: 'var(--bg-tertiary)', text: 'var(--text-secondary)' };
                return (
                  <div
                    key={story.id}
                    className="card-elevated"
                    style={{ padding: '1.375rem', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: story.type === 'success' ? 'var(--accent-warning)' : 'var(--brand-primary)' }}>
                        {story.type === 'success' ? <Star size={13} strokeWidth={2} /> : <Newspaper size={13} strokeWidth={2} />}
                        <span style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          {story.type === 'success' ? 'Success Story' : 'News'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.18rem 0.55rem', borderRadius: '9999px', background: tc.bg, color: tc.text, fontSize: '0.7rem', fontWeight: 600 }}>
                        <Tag size={9} />
                        {story.tag}
                      </div>
                    </div>
                    <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, margin: 0, lineHeight: 1.35, color: 'var(--text-primary)' }}>
                      {story.title}
                    </h3>
                    <p style={{ fontSize: '0.845rem', color: 'var(--text-secondary)', lineHeight: 1.65, margin: 0, flex: 1 }}>
                      {story.summary}
                    </p>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', margin: 0, borderTop: '1px solid var(--border-color)', paddingTop: '0.625rem' }}>
                      {new Date(story.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Dashboard;

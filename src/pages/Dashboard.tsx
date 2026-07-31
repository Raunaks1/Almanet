import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
  LogOut, LayoutDashboard, Users, Briefcase, MessageSquare,
  MessageCircle, Calendar, ShieldAlert,
  GraduationCap, Newspaper, Star, Tag, Lock,
} from 'lucide-react';
import { getStoriesForCollege } from '../lib/collegeNews';
import type { CollegeStory } from '../lib/collegeNews';

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

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
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

        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileData) {
          setProfile(profileData);
        }

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
      <div style={{ minHeight: '100vh', background: COLORS.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '36px', height: '36px', border: `4px solid ${COLORS.border}`, borderTopColor: COLORS.sage, borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const meta = user?.user_metadata || {};
  const collegeName: string = meta.college || profile?.college || meta.college_name || '';
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

  const tagColors: Record<string, string> = {
    Placement: COLORS.sage,
    Research: COLORS.blue,
    Startup: COLORS.warning,
    Event: COLORS.lavender,
    Infrastructure: COLORS.lavender,
    Workshop: COLORS.warning,
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: COLORS.bg, fontFamily: '"Inter", sans-serif' }}>
      {/* ── Sidebar ── */}
      <aside style={{
        width: '280px',
        background: COLORS.white,
        borderRight: `2px solid ${COLORS.border}`,
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2.5rem', padding: '0 0.5rem' }}>
          <GraduationCap size={28} color={COLORS.text} strokeWidth={2.5} />
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: COLORS.text, letterSpacing: '-0.02em', textTransform: 'uppercase' }}>AlmaNET</h2>
        </div>

        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
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
                  gap: '0.75rem',
                  padding: '0.75rem 1rem',
                  borderRadius: '99px',
                  fontSize: '0.9375rem',
                  fontWeight: item.active ? 800 : 600,
                  color: COLORS.text,
                  background: item.active ? COLORS.sage : 'transparent',
                  border: item.active ? `2px solid ${COLORS.border}` : '2px solid transparent',
                  boxShadow: item.active ? '4px 4px 0px rgba(13,30,20,1)' : 'none',
                  textDecoration: 'none',
                  transition: 'all 0.15s ease',
                  opacity: locked ? 0.5 : 1,
                  cursor: locked ? 'not-allowed' : 'pointer',
                }}
                title={locked ? 'Verification required' : item.label}
              >
                {item.icon}
                <span style={{ flex: 1 }}>{item.label}</span>
                {locked && <Lock size={14} strokeWidth={2.5} />}
              </Link>
            );
          })}

          {userType === 'admin' && (
            <>
              <div style={{ height: '2px', background: COLORS.border, margin: '1rem 0' }} />
              <Link
                to="/admin"
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: '0.75rem 1rem', borderRadius: '99px',
                  fontSize: '0.9375rem', fontWeight: 800, color: COLORS.text,
                  background: COLORS.warning, border: `2px solid ${COLORS.border}`,
                  boxShadow: '4px 4px 0px rgba(13,30,20,1)', textDecoration: 'none',
                }}
              >
                <ShieldAlert size={18} /> Verification Queue
              </Link>
            </>
          )}
        </nav>

        {/* Profile footer */}
        <div style={{ marginTop: 'auto', paddingTop: '1.5rem', borderTop: `2px solid ${COLORS.border}` }}>
          <Link
            to={user?.id ? `/profile/${user.id}` : '#'}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              marginBottom: '1rem', padding: '0.5rem',
              borderRadius: '16px', textDecoration: 'none',
              color: COLORS.text, transition: 'background 0.15s ease',
            }}
          >
            <div style={{
              width: '44px', height: '44px', borderRadius: '50%',
              background: profile?.avatar_url
                ? `url(${profile.avatar_url}) center/cover no-repeat`
                : COLORS.lavender,
              border: `2px solid ${COLORS.border}`,
              color: COLORS.text, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: '1rem',
            }}>
              {!profile?.avatar_url && fullName.charAt(0).toUpperCase()}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <p style={{ fontWeight: 800, fontSize: '0.875rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', margin: 0, color: COLORS.text }}>
                {fullName}
              </p>
              <p style={{ fontSize: '0.75rem', fontWeight: 600, color: COLORS.textMuted, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', margin: 0 }}>
                {user?.email}
              </p>
            </div>
          </Link>
          <button 
            onClick={handleSignOut} 
            style={{ 
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              padding: '0.75rem', borderRadius: '99px', background: COLORS.white, border: `2px solid ${COLORS.border}`,
              fontWeight: 800, color: COLORS.text, cursor: 'pointer', boxShadow: '4px 4px 0px rgba(13,30,20,1)',
              fontSize: '0.875rem', textTransform: 'uppercase'
            }}
          >
            <LogOut size={16} strokeWidth={2.5} /> Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main style={{ flex: 1, padding: '3rem', overflowY: 'auto' }}>

        {/* Welcome */}
        <header style={{ marginBottom: '2.5rem' }}>
          <h1 style={{ fontSize: 'clamp(2rem, 3vw, 2.5rem)', fontWeight: 900, color: COLORS.text, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '-0.02em' }}>
            Welcome back, {fullName.split(' ')[0]}! 👋
          </h1>
          <p style={{ color: COLORS.textMuted, fontSize: '1.125rem', fontWeight: 500, margin: 0 }}>
            Here's what's happening in your network today.
          </p>
        </header>

        {/* ── College Banner ── */}
        {collegeName ? (
          <div style={{
            background: COLORS.lavender,
            border: `2px solid ${COLORS.border}`,
            borderRadius: '24px',
            padding: '2rem 2.5rem',
            marginBottom: '3rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1.5rem',
            position: 'relative',
            boxShadow: '12px 12px 0px rgba(13,30,20,1)',
          }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '16px',
              background: COLORS.white, border: `2px solid ${COLORS.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              boxShadow: '4px 4px 0px rgba(13,30,20,1)'
            }}>
              <GraduationCap size={32} color={COLORS.text} strokeWidth={2.5} />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ color: COLORS.text, fontSize: '0.8125rem', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', margin: '0 0 0.5rem 0' }}>
                Your Institution
              </p>
              <h2 style={{ color: COLORS.text, fontSize: '1.5rem', fontWeight: 900, margin: 0, textTransform: 'uppercase', letterSpacing: '-0.01em' }}>
                {collegeName}
              </h2>
              {(degree || branch || gradYear) && (
                <p style={{ color: COLORS.textMuted, fontSize: '0.9375rem', fontWeight: 600, margin: '0.5rem 0 0 0' }}>
                  {[degree, branch].filter(Boolean).join(' · ')}
                  {gradYear ? ` · Batch of ${gradYear}` : ''}
                </p>
              )}
            </div>

            <div style={{
              padding: '0.75rem 1.5rem',
              background: COLORS.white,
              border: `2px solid ${COLORS.border}`,
              boxShadow: '4px 4px 0px rgba(13,30,20,1)',
              borderRadius: '9999px',
              fontSize: '0.875rem',
              color: COLORS.text,
              fontWeight: 800,
              flexShrink: 0,
              whiteSpace: 'nowrap',
              textTransform: 'uppercase'
            }}>
              {userType === 'alumni' ? '🎓 Alumni' : userType === 'student' ? '📚 Student' : '🛡 Admin'}
            </div>
          </div>
        ) : (
          <div style={{
            background: COLORS.white,
            border: `2px dashed ${COLORS.border}`,
            borderRadius: '24px',
            padding: '2rem 2.5rem',
            marginBottom: '3rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1.25rem',
          }}>
            <GraduationCap size={28} color={COLORS.textMuted} />
            <p style={{ color: COLORS.textMuted, fontSize: '1rem', fontWeight: 600, margin: 0 }}>
              No college linked to your profile yet. Update your profile to see college news &amp; stories.
            </p>
          </div>
        )}

        {/* ── Unverified Banner ── */}
        {!isVerified && (
          <div style={{
            background: COLORS.warning,
            border: `2px solid ${COLORS.border}`,
            boxShadow: '8px 8px 0px rgba(13,30,20,1)',
            borderRadius: '16px',
            padding: '1.5rem 2rem',
            marginBottom: '3rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '1.25rem',
          }}>
            <ShieldAlert size={28} color={COLORS.text} style={{ flexShrink: 0 }} />
            <div>
              <h3 style={{ color: COLORS.text, fontSize: '1.125rem', fontWeight: 900, margin: '0 0 0.5rem 0', textTransform: 'uppercase' }}>
                Account Pending Verification
              </h3>
              <p style={{ color: COLORS.text, fontSize: '0.9375rem', fontWeight: 500, margin: 0, lineHeight: 1.5 }}>
                Your account is currently being reviewed by the admin. 
                You can browse the dashboard, but you won't be able to access restricted features like the Alumni Directory, Job Portal, or Discussion Forums until your account is verified.
              </p>
            </div>
          </div>
        )}

        {/* ── News & Stories ── */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 900, margin: 0, textTransform: 'uppercase', color: COLORS.text, letterSpacing: '-0.02em' }}>
                {collegeName ? 'College News & Success Stories' : 'Network News & Success Stories'}
              </h2>
              <p style={{ color: COLORS.textMuted, fontSize: '0.9375rem', fontWeight: 600, margin: '0.5rem 0 0 0' }}>
                {collegeName ? `Latest updates from ${collegeName}` : 'Highlights from the AlmaNET community'}
              </p>
            </div>

            {/* Tab filters */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {(['all', 'news', 'success'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: '0.625rem 1.25rem',
                    borderRadius: '99px',
                    fontSize: '0.875rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    border: `2px solid ${COLORS.border}`,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    background: activeTab === tab ? COLORS.text : COLORS.white,
                    color: activeTab === tab ? COLORS.white : COLORS.text,
                    boxShadow: activeTab === tab ? '4px 4px 0px rgba(13,30,20,0.3)' : '4px 4px 0px rgba(13,30,20,1)',
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
              padding: '4rem 2rem',
              border: `2px dashed ${COLORS.border}`,
              borderRadius: '24px',
              background: COLORS.white,
            }}>
              <div style={{
                width: '64px', height: '64px', borderRadius: '16px',
                background: COLORS.blue, border: `2px solid ${COLORS.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 1.5rem', boxShadow: '4px 4px 0px rgba(13,30,20,1)'
              }}>
                <Newspaper size={28} color={COLORS.text} />
              </div>
              <p style={{ fontWeight: 900, fontSize: '1.25rem', margin: '0 0 0.5rem 0', color: COLORS.text, textTransform: 'uppercase' }}>
                No stories yet
              </p>
              <p style={{ color: COLORS.textMuted, fontSize: '0.9375rem', fontWeight: 500, margin: 0 }}>
                News and success stories from your college will appear here once published.
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
              {filtered.map((story: CollegeStory) => {
                const tagColor = tagColors[story.tag] || COLORS.blue;
                return (
                  <div
                    key={story.id}
                    style={{ 
                      padding: '1.5rem', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: '1rem',
                      background: COLORS.white,
                      border: `2px solid ${COLORS.border}`,
                      borderRadius: '16px',
                      boxShadow: '6px 6px 0px rgba(13,30,20,1)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: COLORS.text }}>
                        {story.type === 'success' ? <Star size={16} strokeWidth={2.5} /> : <Newspaper size={16} strokeWidth={2.5} />}
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          {story.type === 'success' ? 'Success Story' : 'News'}
                        </span>
                      </div>
                      <div style={{ 
                        display: 'flex', alignItems: 'center', gap: '0.375rem', 
                        padding: '0.25rem 0.75rem', borderRadius: '9999px', 
                        background: tagColor, color: COLORS.text, 
                        fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase',
                        border: `1.5px solid ${COLORS.border}`
                      }}>
                        <Tag size={12} strokeWidth={2.5} />
                        {story.tag}
                      </div>
                    </div>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 900, margin: 0, lineHeight: 1.3, color: COLORS.text }}>
                      {story.title}
                    </h3>
                    <p style={{ fontSize: '0.9375rem', color: COLORS.textMuted, lineHeight: 1.6, margin: 0, flex: 1, fontWeight: 500 }}>
                      {story.summary}
                    </p>
                    <p style={{ fontSize: '0.75rem', color: COLORS.text, fontWeight: 700, margin: 0, borderTop: `2px solid ${COLORS.border}`, paddingTop: '1rem', textTransform: 'uppercase' }}>
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

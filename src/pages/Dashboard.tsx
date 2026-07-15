import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase, isMock } from '../lib/supabase';
import { LogOut, User, LayoutDashboard, Users, Briefcase, MessageSquare, Calendar, ShieldAlert } from 'lucide-react';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      if (isMock) {
        const mockEmail = localStorage.getItem('mockUserEmail') || 'mockuser@example.com';
        const userType = mockEmail.includes('admin') ? 'admin' : 'student';
        const fullName = mockEmail.includes('admin') ? 'Dr. College Admin' : 'Mock User';
        setUser({ email: mockEmail, user_metadata: { full_name: fullName, user_type: userType } });
        setLoading(false);
        return;
      }
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
      } else {
        setUser(session.user);
      }
      setLoading(false);
    };
    checkUser();
  }, [navigate]);

  const handleSignOut = async () => {
    if (!isMock) await supabase.auth.signOut();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: '100vh' }}>
        <div className="animate-spin" style={{ width: '40px', height: '40px', border: '4px solid var(--border-color)', borderTopColor: 'var(--brand-primary)', borderRadius: '50%' }}></div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Sidebar */}
      <aside style={{ width: '260px', background: 'var(--bg-secondary)', borderRight: '1px solid var(--border-color)', padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h2 className="text-gradient" style={{ margin: 0, fontSize: '1.5rem' }}>AlmaNET</h2>
        </div>
        
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <Link to="/dashboard" className="btn btn-glass" style={{ justifyContent: 'flex-start', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--brand-primary)', borderColor: 'rgba(59, 130, 246, 0.2)' }}>
            <LayoutDashboard size={20} /> Dashboard
          </Link>
          <Link to="/directory" className="btn btn-glass" style={{ justifyContent: 'flex-start', border: 'transparent' }}>
            <Users size={20} /> Alumni Directory
          </Link>
          <Link to="/forums" className="btn btn-glass" style={{ justifyContent: 'flex-start', border: 'transparent' }}>
            <MessageSquare size={20} /> Discussion Forums
          </Link>
          <Link to="/jobs" className="btn btn-glass" style={{ justifyContent: 'flex-start', border: 'transparent' }}>
            <Briefcase size={20} /> Job Portal
          </Link>
          <Link to="/events" className="btn btn-glass" style={{ justifyContent: 'flex-start', border: 'transparent', color: 'var(--brand-primary)' }}>
            <Calendar size={20} /> Campus Events
          </Link>
          {user?.user_metadata?.user_type === 'admin' && (
            <div style={{ height: '1px', background: 'var(--border-color)', margin: '0.5rem 0' }}></div>
          )}
          {user?.user_metadata?.user_type === 'admin' && (
            <Link to="/admin" className="btn btn-glass" style={{ justifyContent: 'flex-start', border: 'transparent', color: 'var(--accent-warning)' }}>
              <ShieldAlert size={20} /> Verification Queue
            </Link>
          )}
        </nav>

        <div style={{ marginTop: 'auto', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={20} color="var(--text-secondary)" />
            </div>
            <div style={{ overflow: 'hidden' }}>
              <p style={{ fontWeight: 500, fontSize: '0.875rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                {user?.user_metadata?.full_name || 'User'}
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                {user?.email}
              </p>
            </div>
          </div>
          <button onClick={handleSignOut} className="btn btn-outline" style={{ width: '100%', justifyContent: 'center' }}>
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
        <header style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem' }}>Welcome back, {user?.user_metadata?.full_name?.split(' ')[0] || 'there'}! 👋</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Here's what's happening in your network today.</p>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={20} color="var(--brand-primary)" /> Suggested Connections
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              AI-driven suggestions will appear here based on your profile and interests.
            </p>
          </div>

          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Briefcase size={20} color="var(--accent-success)" /> Recent Job Postings
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              New career opportunities posted by alumni in your field.
            </p>
          </div>

          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MessageSquare size={20} color="var(--brand-secondary)" /> Active Discussions
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              Join the conversation in the forums and share your expertise.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;

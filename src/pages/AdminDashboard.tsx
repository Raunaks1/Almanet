import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, ShieldAlert, GraduationCap, Building, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { UserProfile } from './Directory';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [pendingUsers, setPendingUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const fetchPendingUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('verification_status', 'pending')
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setPendingUsers(data as UserProfile[]);
    }
    setLoading(false);
  };

  const handleApprove = async (id: string) => {
    const { error } = await supabase
      .from('profiles')
      .update({ verification_status: 'approved' })
      .eq('id', id);
      
    if (!error) {
      setPendingUsers(prev => prev.filter(u => u.id !== id));
      alert('User has been approved and verified.');
    } else {
      alert('Error updating user.');
    }
  };

  const handleReject = async (id: string) => {
    const { error } = await supabase
      .from('profiles')
      .update({ verification_status: 'rejected' })
      .eq('id', id);
      
    if (!error) {
      setPendingUsers(prev => prev.filter(u => u.id !== id));
      alert('User has been rejected.');
    } else {
      alert('Error updating user.');
    }
  };

  return (
    <main className="container animate-fade-in" style={{ padding: '2rem 1.5rem', maxWidth: '1000px', width: '100%' }}>
      <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Pending Verifications</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Review and verify student and alumni registrations to grant them full access to the network.</p>

      <div style={{ display: 'grid', gap: '1rem' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
            <Loader2 className="animate-spin" size={32} color="var(--brand-primary)" />
          </div>
        ) : pendingUsers.length === 0 ? (
          <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <CheckCircle size={48} style={{ opacity: 0.5, margin: '0 auto 1rem auto', color: 'var(--accent-success)' }} />
            <p>All caught up! There are no pending users in the queue.</p>
          </div>
        ) : (
          pendingUsers.map(user => (
            <div key={user.id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {user.full_name} 
                  <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', background: 'var(--bg-secondary)', borderRadius: '12px', textTransform: 'uppercase' }}>
                    {user.user_type}
                  </span>
                </h3>
                <div style={{ display: 'flex', gap: '1.5rem', color: 'var(--text-secondary)', marginTop: '0.75rem', fontSize: '0.875rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Building size={16} /> {user.college}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <GraduationCap size={16} /> {user.degree} in {user.branch} ({user.graduation_year})
                  </span>
                </div>
                <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  <strong>Email:</strong> {user.email} <br />
                  <strong>Document:</strong> <a href="#" style={{ color: 'var(--brand-primary)', textDecoration: 'underline' }}>View Uploaded ID (Mock)</a>
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button 
                  onClick={() => handleReject(user.id)}
                  className="btn btn-outline"
                  style={{ color: 'var(--accent-danger)', borderColor: 'rgba(239, 68, 68, 0.2)' }}
                >
                  <XCircle size={18} /> Reject
                </button>
                <button 
                  onClick={() => handleApprove(user.id)}
                  className="btn btn-primary"
                  style={{ background: 'var(--accent-success)', color: '#000' }}
                >
                  <CheckCircle size={18} /> Approve
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
};

export default AdminDashboard;

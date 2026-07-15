import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, ShieldAlert, GraduationCap, Building } from 'lucide-react';
import { mockUsers } from '../lib/mockData';
import type { UserProfile } from '../lib/mockData';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  // In a real app, this would fetch from Supabase:
  // supabase.from('profiles').select('*').eq('verification_status', 'pending')
  const [pendingUsers, setPendingUsers] = useState<UserProfile[]>([]);

  useEffect(() => {
    // Mock fetch pending users
    const pending = mockUsers.filter(u => u.verification_status === 'pending');
    setPendingUsers(pending);
  }, []);

  const handleVerify = (userId: string, status: 'approved' | 'rejected') => {
    // In a real app: await supabase.from('profiles').update({ verification_status: status }).eq('id', userId)
    setPendingUsers(prev => prev.filter(u => u.id !== userId));
    alert(`User ${status} successfully.`);
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <ShieldAlert color="var(--accent-warning)" />
            Verification Queue
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Review and approve candidates claiming affiliation with your institute.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gap: '1rem' }}>
        {pendingUsers.length === 0 ? (
          <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <CheckCircle size={48} style={{ margin: '0 auto 1rem', opacity: 0.5, color: 'var(--accent-success)' }} />
            <p>All caught up! No pending verifications at the moment.</p>
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
                  onClick={() => handleVerify(user.id, 'rejected')}
                  className="btn btn-outline"
                  style={{ color: 'var(--accent-danger)', borderColor: 'rgba(239, 68, 68, 0.2)' }}
                >
                  <XCircle size={18} /> Reject
                </button>
                <button 
                  onClick={() => handleVerify(user.id, 'approved')}
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
    </div>
  );
};

export default AdminDashboard;

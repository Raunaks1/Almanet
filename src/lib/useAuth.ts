import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabase';

export interface AuthState {
  user: any;
  profile: any;
  loading: boolean;
  isVerified: boolean;
  userType: string;
}

/**
 * Shared auth hook — fetches session + profile and determines verification status.
 * Redirects to /auth if not logged in.
 */
export function useAuth(): AuthState {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error || !session) {
          navigate('/auth');
          return;
        }

        setUser(session.user);

        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileData) {
          setProfile(profileData);
        }
      } catch (err) {
        console.error('Auth init error:', err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [navigate]);

  const meta = user?.user_metadata || {};
  const userType: string = profile?.user_type || meta.user_type || 'alumni';
  const verificationStatus: string = profile?.verification_status || meta.verification_status || 'pending';

  // Admins are always verified; others need 'approved' status
  const isVerified = userType === 'admin' || verificationStatus === 'approved';

  return { user, profile, loading, isVerified, userType };
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import { ResponsiveLayout } from '../../components/ResponsiveLayout';
import { Loader2, MessageSquare } from 'lucide-react';

export default function ChatDashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuthAndLoadProfile() {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push('/auth');
        return;
      }

      const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
      if (!data) {
        router.push('/onboarding');
      } else {
        setProfile(data);
      }
      setLoading(false);
    }
    checkAuthAndLoadProfile();
  }, [router]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', width: '100vw', backgroundColor: '#EDEDED' }}>
      </div>
    );
  }

  return <ResponsiveLayout profile={profile} />;
}

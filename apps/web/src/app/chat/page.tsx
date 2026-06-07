'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import { ResponsiveLayout } from '../../components/ResponsiveLayout';
import { Loader2 } from 'lucide-react';

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
      <div className="flex items-center justify-center h-screen w-full bg-surface">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  return <ResponsiveLayout profile={profile} />;
}

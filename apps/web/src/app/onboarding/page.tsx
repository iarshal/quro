'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import { motion } from 'framer-motion';
import { User, Calendar, Hash, ArrowRight, Loader2 } from 'lucide-react';
import { MouseGlow } from '../../components/MouseGlow';
import { QuroLogo } from '../../components/QuroLogo';

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    age: '',
    dob: '',
    gender: 'Male',
  });

  useEffect(() => {
    async function checkUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth');
        return;
      }
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();
        
      if (profile) {
        router.push('/chat'); // Already onboarded
      } else {
        setInitialLoading(false);
      }
    }
    checkUser();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          name: formData.name,
          age: parseInt(formData.age),
          dob: formData.dob,
          gender: formData.gender,
          is_verified: true, // Default to true since they onboarded
          avatar_url: `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(formData.name)}`, // Generates a fun avatar
        });

      if (insertError) throw insertError;

      router.push('/chat');
    } catch (err: any) {
      setError(err.message || 'An error occurred while saving your profile');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="bg-surface text-on-surface min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  return (
    <div className="bg-surface text-on-surface overflow-x-hidden min-h-screen flex items-center justify-center p-4">
      <MouseGlow />
      <div className="absolute inset-0 ethereal-gradient pointer-events-none"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg relative z-10"
      >
        <div className="glass-card p-10 rounded-2xl shadow-2xl border border-white/60">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary/10 rounded-[1.25rem] flex items-center justify-center mx-auto mb-4 shadow-sm border border-primary/20">
              <QuroLogo size={32} />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-on-surface mb-2">
              Complete your profile
            </h1>
            <p className="text-sm text-on-surface-variant">
              Just a few more details to set up your secure Quro identity.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-error-container text-on-error-container text-sm rounded-lg border border-error/20">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-2">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={18} />
                <input
                  type="text"
                  required
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-surface-variant/30 border-b border-outline-variant focus:border-primary text-on-surface outline-none transition-colors rounded-t-lg"
                />
              </div>
            </div>

            {/* Age & DOB Row */}
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-2">
                  Age
                </label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={18} />
                  <input
                    type="number"
                    required
                    min="13"
                    max="120"
                    placeholder="25"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-surface-variant/30 border-b border-outline-variant focus:border-primary text-on-surface outline-none transition-colors rounded-t-lg"
                  />
                </div>
              </div>
              <div className="flex-1">
                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-2">
                  Date of Birth
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={18} />
                  <input
                    type="date"
                    required
                    value={formData.dob}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-surface-variant/30 border-b border-outline-variant focus:border-primary text-on-surface outline-none transition-colors rounded-t-lg"
                  />
                </div>
              </div>
            </div>

            {/* Gender Selection */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-2">
                Gender
              </label>
              <div className="grid grid-cols-3 gap-3">
                {['Male', 'Female', 'Non-Binary'].map((gender) => {
                  const isActive = formData.gender === gender;
                  return (
                    <button
                      key={gender}
                      type="button"
                      onClick={() => setFormData({ ...formData, gender })}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
                        isActive
                          ? 'border-primary bg-primary/5 text-primary shadow-sm'
                          : 'border-outline-variant bg-surface-variant/10 text-on-surface hover:bg-surface-variant/30'
                      }`}
                    >
                      {gender === 'Male' && (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={isActive ? 'text-primary' : 'text-on-surface-variant'}>
                          <circle cx="10" cy="14" r="5"></circle>
                          <line x1="13.5" y1="10.5" x2="21" y2="3"></line>
                          <polyline points="16 3 21 3 21 8"></polyline>
                        </svg>
                      )}
                      {gender === 'Female' && (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={isActive ? 'text-primary' : 'text-on-surface-variant'}>
                          <circle cx="12" cy="10" r="5"></circle>
                          <line x1="12" y1="15" x2="12" y2="22"></line>
                          <line x1="9" y1="19" x2="15" y2="19"></line>
                        </svg>
                      )}
                      {gender === 'Non-Binary' && (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={isActive ? 'text-primary' : 'text-on-surface-variant'}>
                          <circle cx="12" cy="12" r="4"></circle>
                          <line x1="12" y1="8" x2="12" y2="2"></line>
                          <polyline points="9 5 12 2 15 5"></polyline>
                        </svg>
                      )}
                      <span className="text-xs font-medium">{gender}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !formData.name || !formData.age || !formData.dob}
              className="w-full flex items-center justify-center gap-2 px-4 py-4 bg-primary text-on-primary font-bold rounded-xl hover:bg-primary-container transition-colors disabled:opacity-50 cursor-pointer mt-8"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : 'Complete Setup'}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

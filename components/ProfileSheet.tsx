'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Mail, Calendar, Target, LogOut, Loader2, Save } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { logActivity } from '@/lib/activity';

interface ProfileSheetProps {
  open: boolean;
  onClose: () => void;
  user: any;
}

export default function ProfileSheet({ open, onClose, user }: ProfileSheetProps) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [savingsGoal, setSavingsGoal] = useState('0');
  const [displayName, setDisplayName] = useState('');

  useEffect(() => {
    async function fetchProfile() {
      if (!user) return;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle(); // Use maybeSingle to avoid error if missing
      
      if (data && !error) {
        setSavingsGoal(data.savings_goal?.toString() || '0');
        setDisplayName(data.display_name || '');
      }

    }
    fetchProfile();
  }, [user, supabase]);

  const handleUpdateProfile = async () => {
    if (!user) return;
    setLoading(true);
    
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        email: user.email,
        display_name: displayName,
        savings_goal: parseFloat(savingsGoal) || 0,
      }, {
        onConflict: 'id'
      });

    if (error) {
      toast.error(`Failed to update profile: ${error.message}`);
      console.error('Profile update error:', error);
    } else {
      toast.success('Profile settings saved successfully');
      // Update activity log
      logActivity('goal_set', { goal: parseFloat(savingsGoal) || 0 });
    }
    setLoading(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-full max-w-[360px] bg-surface shadow-2xl z-50 flex flex-col border-l border-border"
          >
            {/* Header */}
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h2 className="text-lg font-bold text-text-primary">Profile Settings</h2>
              <button onClick={onClose} className="p-2 hover:bg-surface-muted rounded-full transition-colors">
                <X className="w-5 h-5 text-text-tertiary" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* User Info */}
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-accent rounded-full flex items-center justify-center text-white text-3xl font-bold mb-4">
                  {user?.email?.[0].toUpperCase()}
                </div>
                <h3 className="text-lg font-bold text-text-primary">{displayName || 'User'}</h3>
                <p className="text-sm text-text-tertiary flex items-center gap-1.5 mt-1">
                  <Mail className="w-3.5 h-3.5" /> {user?.email}
                </p>
                <p className="text-[10px] text-text-tertiary uppercase tracking-widest mt-2">
                  Member since {new Date(user?.created_at).toLocaleDateString()}
                </p>
              </div>

              {/* Form */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-secondary uppercase tracking-widest">Display Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-4 h-4 text-text-tertiary" />
                    <input 
                      type="text" 
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Your Name"
                      className="w-full pl-10 pr-4 py-2.5 bg-surface-muted border border-border rounded-default text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-secondary uppercase tracking-widest flex items-center justify-between">
                    Savings Goal
                    <span className="text-[10px] font-normal text-text-tertiary">Annual Target</span>
                  </label>
                  <div className="relative">
                    <Target className="absolute left-3 top-3 w-4 h-4 text-text-tertiary" />
                    <input 
                      type="number" 
                      value={savingsGoal}
                      onChange={(e) => setSavingsGoal(e.target.value)}
                      placeholder="e.g. 5000"
                      className="w-full pl-10 pr-4 py-2.5 bg-surface-muted border border-border rounded-default text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                    />
                  </div>
                </div>

                <button 
                  onClick={handleUpdateProfile}
                  disabled={loading}
                  className="w-full bg-accent hover:bg-accent-hover text-white py-2.5 rounded-default text-sm font-bold transition-all flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Changes
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-border mt-auto">
              <button 
                onClick={handleSignOut}
                className="w-full flex items-center justify-center gap-2 text-danger hover:bg-red-50 py-2.5 rounded-default text-sm font-bold transition-all"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

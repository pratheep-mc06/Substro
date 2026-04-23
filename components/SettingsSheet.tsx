'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Settings, User, Globe, Shield, Bell, Info, Loader2, Save } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';

interface SettingsSheetProps {
  open: boolean;
  onClose: () => void;
}

export default function SettingsSheet({ open, onClose }: SettingsSheetProps) {
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    if (open) fetchProfile();
  }, [open]);

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
    
    // Ensure email is always present from the auth session if missing in profile
    if (data) {
      setProfile({ ...data, email: data.email || user.email });
    } else {
      setProfile({ email: user.email });
    }

  };

  const handleUpdate = async (updates: any) => {
    setProfile({ ...profile, ...updates });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);

    if (error) toast.error('Failed to update setting');
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
            className="fixed inset-y-0 right-0 w-full max-w-[400px] bg-surface shadow-2xl z-50 flex flex-col border-l border-border"
          >
            <div className="p-6 border-b border-border bg-gradient-to-r from-surface to-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-accent/10 rounded-lg">
                  <Settings className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-text-primary">Settings</h2>
                  <p className="text-[10px] text-text-tertiary font-bold uppercase tracking-widest">Preferences & Account</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-surface-muted rounded-full transition-colors">
                <X className="w-5 h-5 text-text-tertiary" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-10">
              {/* Account Card */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-text-tertiary uppercase tracking-widest flex items-center gap-2 px-1">
                  <User className="w-3.5 h-3.5" /> Account
                </h3>
                <div className="p-4 bg-white border border-border rounded-xl shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-text-secondary">Email Address</span>
                    <span className="text-sm font-bold text-text-primary">{profile?.email}</span>
                  </div>
                </div>
              </div>

              {/* Regional Card */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-text-tertiary uppercase tracking-widest flex items-center gap-2 px-1">
                  <Globe className="w-3.5 h-3.5" /> Regional Settings
                </h3>
                <div className="p-4 bg-white border border-border rounded-xl shadow-sm space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs text-text-tertiary font-bold uppercase tracking-wider">Default Currency</label>
                    <div className="relative">
                      <select 
                        value={profile?.currency || 'INR'}
                        onChange={(e) => handleUpdate({ currency: e.target.value })}
                        className="w-full p-2.5 bg-surface-muted border border-border rounded-lg text-sm font-medium focus:ring-2 focus:ring-accent/20 outline-none transition-all appearance-none"
                      >
                        <option value="INR">Indian Rupee (₹)</option>
                        <option value="USD">US Dollar ($)</option>
                        <option value="EUR">Euro (€)</option>
                        <option value="GBP">British Pound (£)</option>
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-tertiary">
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1 3.5L5 7.5L9 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Privacy Card */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-text-tertiary uppercase tracking-widest flex items-center gap-2 px-1">
                  <Shield className="w-3.5 h-3.5" /> Privacy & Data
                </h3>
                <div className="p-4 bg-white border border-border rounded-xl shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-text-primary">Anonymous Analytics</p>
                    <p className="text-[10px] text-text-tertiary font-medium">Help us improve Substro features</p>
                  </div>
                  <button 
                    onClick={() => handleUpdate({ allow_analytics: !profile?.allow_analytics })}
                    className={`w-10 h-6 rounded-full transition-colors relative ${profile?.allow_analytics ? 'bg-accent' : 'bg-slate-300'}`}
                  >
                    <motion.div 
                      animate={{ x: profile?.allow_analytics ? 18 : 4 }}
                      className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                    />
                  </button>
                </div>
              </div>

              {/* About */}
              <div className="pt-6">
                <div className="p-6 bg-gradient-to-br from-slate-50 to-white border border-border border-dashed rounded-2xl flex flex-col items-center text-center space-y-2">
                  <div className="w-10 h-10 bg-accent text-white rounded-xl flex items-center justify-center font-bold shadow-lg shadow-accent/20">S</div>
                  <p className="text-sm font-bold text-text-primary">Substro Pro</p>
                  <p className="text-[10px] text-text-tertiary font-medium">Version 1.2.0 · Stable Release</p>
                </div>
              </div>
            </div>

          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, BellOff, Calendar, AlertCircle, Loader2, Settings } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface NotificationsSheetProps {
  open: boolean;
  onClose: () => void;
}

export default function NotificationsSheet({ open, onClose }: NotificationsSheetProps) {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (open && user) fetchAlerts();
  }, [open, user]);

  const fetchAlerts = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('subscription_alerts')
      .select('*, user_subscriptions(raw_name, amount)')
      .eq('user_id', user.id);
    
    if (data) setAlerts(data);
    setLoading(false);
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
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-accent" />
                <h2 className="text-lg font-bold text-text-primary">Renewal Alerts</h2>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-surface-muted rounded-full transition-colors">
                <X className="w-5 h-5 text-text-tertiary" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Global Toggle */}
              <div className="bg-surface-muted p-4 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${enabled ? 'bg-accent/10 text-accent' : 'bg-slate-200 text-slate-500'}`}>
                    {enabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-text-primary">Email Notifications</p>
                    <p className="text-[10px] text-text-tertiary font-medium">Alert me 3 days before renewal</p>
                  </div>
                </div>
                <button 
                  onClick={() => setEnabled(!enabled)}
                  className={`w-10 h-6 rounded-full transition-colors relative ${enabled ? 'bg-accent' : 'bg-slate-300'}`}
                >
                  <motion.div 
                    animate={{ x: enabled ? 18 : 4 }}
                    className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                  />
                </button>
              </div>

              {/* Upcoming Alerts */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-text-tertiary uppercase tracking-widest">Upcoming Reminders</h3>
                
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-accent" />
                  </div>
                ) : alerts.length === 0 ? (
                  <div className="text-center py-8 space-y-3">
                    <Calendar className="w-8 h-8 text-text-tertiary mx-auto opacity-50" />
                    <p className="text-xs text-text-tertiary">No active alerts. Add them from your dashboard subscriptions.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {alerts.map((alert) => (
                      <div key={alert.id} className="p-4 border border-border rounded-xl flex items-center justify-between group hover:border-accent transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-accent" />
                          <div>
                            <p className="text-sm font-bold text-text-primary">{alert.user_subscriptions?.raw_name}</p>
                            <p className="text-[10px] text-text-tertiary">Renews every {alert.user_subscriptions?.frequency}</p>
                          </div>
                        </div>
                        <AlertCircle className="w-4 h-4 text-text-tertiary group-hover:text-accent" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-border mt-auto">
              <button className="w-full flex items-center justify-center gap-2 text-text-secondary hover:text-text-primary py-2.5 rounded-default text-sm font-bold transition-all">
                <Settings className="w-4 h-4" /> Notification Settings
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

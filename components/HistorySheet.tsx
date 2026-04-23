'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Upload, ShieldX, CheckCircle, Target, Trash2, Loader2 } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { formatDistanceToNow } from 'date-fns';

interface HistorySheetProps {
  open: boolean;
  onClose: () => void;
}

export default function HistorySheet({ open, onClose }: HistorySheetProps) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (open) fetchLogs();
  }, [open]);

  const fetchLogs = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('activity_log')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (data) setLogs(data);
    setLoading(false);
  };

  const clearLogs = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('activity_log').delete().eq('user_id', user.id);
    setLogs([]);
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'upload': return <Upload className="w-4 h-4 text-accent" />;
      case 'cancelled': return <ShieldX className="w-4 h-4 text-danger" />;
      case 'dismissed': return <X className="w-4 h-4 text-text-tertiary" />;
      case 'confirmed': return <CheckCircle className="w-4 h-4 text-success" />;
      case 'goal_set': return <Target className="w-4 h-4 text-warning" />;
      default: return <Clock className="w-4 h-4 text-text-tertiary" />;
    }
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
                <History className="w-5 h-5 text-accent" />
                <h2 className="text-lg font-bold text-text-primary">Activity History</h2>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={clearLogs} className="p-2 hover:bg-red-50 text-text-tertiary hover:text-danger rounded-full transition-colors" title="Clear All">
                  <Trash2 className="w-4 h-4" />
                </button>
                <button onClick={onClose} className="p-2 hover:bg-surface-muted rounded-full transition-colors">
                  <X className="w-5 h-5 text-text-tertiary" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-6 h-6 animate-spin text-accent" />
                </div>
              ) : logs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-3">
                  <div className="w-12 h-12 bg-surface-muted rounded-full flex items-center justify-center">
                    <Clock className="w-6 h-6 text-text-tertiary" />
                  </div>
                  <p className="text-sm font-bold text-text-secondary">No activity yet</p>
                  <p className="text-xs text-text-tertiary max-w-[200px]">Actions like uploads and cancellations will appear here.</p>
                </div>
              ) : (
                <div className="space-y-6 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-px before:bg-border">
                  {logs.map((log) => (
                    <div key={log.id} className="relative pl-10">
                      <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-surface border border-border flex items-center justify-center z-10">
                        {getActionIcon(log.action)}
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-text-primary capitalize">{log.action}</p>
                        <p className="text-xs text-text-tertiary">
                          {log.metadata?.merchant_name || log.metadata?.filename || 'System action'}
                        </p>
                        <p className="text-[10px] text-text-tertiary font-medium">
                          {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function History({ className }: { className?: string }) {
  return <Clock className={className} />;
}

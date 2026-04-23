'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Activity, TrendingUp, CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import type { DetectedSubscription } from '@/types';
import { useCurrency } from '@/hooks/useCurrency';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { format } from 'date-fns';

interface InvestigateDrawerProps {
  sub: DetectedSubscription | null;
  open: boolean;
  onClose: () => void;
  onConfirm?: (id: string) => void;
  onDismiss?: (id: string) => void;
}

export default function InvestigateDrawer({ sub, open, onClose, onConfirm, onDismiss }: InvestigateDrawerProps) {
  const { format: formatCurrency } = useCurrency();

  // Sort and format data only if sub exists
  const chartData = sub ? sub.transactions
    .slice()
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(t => ({
      date: format(new Date(t.date), 'MMM d'),
      amount: t.amount,
      rawDate: t.date
    })) : [];

  const timeline = sub ? sub.transactions
    .slice()
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) : [];

  return (
    <AnimatePresence>
      {open && sub && (

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
            className="fixed inset-y-0 right-0 w-full max-w-[500px] bg-surface shadow-2xl z-50 flex flex-col border-l border-border"
          >
            {/* Header */}
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${
                  sub.confidence === 'high' ? 'bg-success' : 
                  sub.confidence === 'medium' ? 'bg-warning' : 'bg-danger'
                }`} />
                <div>
                  <h2 className="text-xl font-bold text-text-primary">{sub.matchedMerchant?.name || sub.cleanName}</h2>
                  <span className="text-xs font-medium text-text-tertiary uppercase tracking-wider">{sub.category}</span>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-surface-muted rounded-full transition-colors">
                <X className="w-5 h-5 text-text-tertiary" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-surface-muted p-4 rounded-default">
                  <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-1">Total Spent</span>
                  <span className="text-lg font-bold text-text-primary">{formatCurrency(sub.avgAmount * sub.transactions.length)}</span>
                </div>
                <div className="bg-surface-muted p-4 rounded-default">
                  <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-1">Avg Charge</span>
                  <span className="text-lg font-bold text-text-primary">{formatCurrency(sub.avgAmount)}</span>
                </div>
                <div className="bg-surface-muted p-4 rounded-default">
                  <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-1">Charges</span>
                  <span className="text-lg font-bold text-text-primary">{sub.transactions.length}</span>
                </div>
              </div>

              {/* Chart */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-text-secondary flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" /> Amount Variance
                </h3>
                <div className="h-[140px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <XAxis dataKey="date" hide />
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-white p-2 shadow-lg border border-border rounded text-xs">
                                <p className="font-bold">{payload[0].payload.date}</p>
                                <p className="text-accent">{formatCurrency(payload[0].value as number)}</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="amount" radius={[2, 2, 0, 0]}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill="#4F46E5" fillOpacity={0.8} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Timeline */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-text-secondary flex items-center gap-2">
                    <Activity className="w-4 h-4" /> Subscription History
                  </h3>
                  <span className="text-[10px] text-text-tertiary">
                    {format(new Date(sub.firstSeen), 'MMM d, yyyy')} — {format(new Date(sub.lastSeen), 'MMM d, yyyy')}
                  </span>
                </div>
                
                <div className="relative pl-4 space-y-6 before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-[2px] before:bg-border">
                  {timeline.map((t, i) => {
                    const prev = timeline[i + 1];
                    const daysDiff = prev ? Math.round((new Date(t.date).getTime() - new Date(prev.date).getTime()) / (1000 * 3600 * 24)) : null;

                    return (
                      <div key={i} className="relative">
                        <div className="absolute -left-[13px] top-1.5 w-2 h-2 rounded-full bg-border ring-4 ring-surface" />
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm font-bold text-text-primary">{format(new Date(t.date), 'MMM d, yyyy')}</p>
                            <p className="text-xs text-text-tertiary line-clamp-1 mt-0.5">{t.description}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-text-primary">{formatCurrency(t.amount)}</p>
                            {daysDiff && (
                              <span className="text-[10px] font-medium bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">
                                {daysDiff}d interval
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-6 border-t border-border bg-surface-muted grid grid-cols-2 gap-3">
              <button 
                onClick={() => onDismiss?.(sub.id)}
                className="flex items-center justify-center gap-2 bg-white border border-border hover:border-danger hover:text-danger text-text-secondary py-2.5 rounded-default text-sm font-bold transition-all"
              >
                <XCircle className="w-4 h-4" /> Dismiss
              </button>
              <button 
                onClick={() => onConfirm?.(sub.id)}
                className="flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover text-white py-2.5 rounded-default text-sm font-bold transition-all"
              >
                <CheckCircle className="w-4 h-4" /> Mark Active
              </button>
              {sub.matchedMerchant?.cancel_url && (
                <a 
                  href={sub.matchedMerchant.cancel_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="col-span-2 flex items-center justify-center gap-2 bg-white border border-border hover:bg-slate-50 text-text-primary py-2.5 rounded-default text-sm font-bold transition-all mt-1"
                >
                  <ExternalLink className="w-4 h-4" /> Cancel Subscription
                </a>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

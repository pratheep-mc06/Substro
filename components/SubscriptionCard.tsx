import { useState } from 'react';
import type { DetectedSubscription } from '@/types';
import { ExternalLink, Check, X } from 'lucide-react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import confetti from 'canvas-confetti';

interface SubscriptionCardProps {
  subscription: DetectedSubscription;
  onCancel: (id: string) => void;
  onDismiss: (id: string) => void;
  isCancelled?: boolean;
}

export default function SubscriptionCard({ subscription, onCancel, onDismiss, isCancelled }: SubscriptionCardProps) {
  const { matchedMerchant, cleanName, category, confidence, monthlyEstimate, annualEstimate, firstSeen, lastSeen } = subscription;
  
  const handleCancelClick = () => {
    // Basic Confetti
    if (!isCancelled) {
       confetti({
         particleCount: 100,
         spread: 70,
         origin: { y: 0.6 },
         colors: ['#4F46E5', '#FFFFFF']
       });
    }
    onCancel(subscription.id);
  };

  const getInitials = (name: string) => name.substring(0, 2).toUpperCase();
  
  const ConfidenceDot = () => {
    let color = 'bg-slate-300';
    if (confidence === 'high') color = 'bg-success';
    if (confidence === 'medium') color = 'bg-warning';
    
    return (
      <div title={`Confidence: ${confidence}`} className="flex items-center justify-center w-6 h-6 rounded-full hover:bg-slate-100 cursor-help transition-colors">
         <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
      </div>
    );
  };

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -2, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
      className={clsx(
        "bg-surface border border-border rounded-default p-5 flex flex-col relative transition-all duration-200",
        isCancelled && "bg-surface-muted opacity-75"
      )}
    >
      {/* Top section */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-accent-light text-accent flex items-center justify-center font-bold text-xs shrink-0">
            {getInitials(matchedMerchant?.name || cleanName)}
          </div>
          <div>
            <div className={clsx("font-semibold text-[15px] text-text-primary leading-tight", isCancelled && "line-through text-text-secondary")}>
              {matchedMerchant?.name || cleanName}
            </div>
            <div className="text-[11px] font-medium text-text-secondary uppercase tracking-wider mt-0.5">
              {category}
            </div>
          </div>
        </div>
        {isCancelled ? (
          <span className="text-[11px] font-bold text-success bg-green-50 px-2 py-0.5 rounded-sm uppercase tracking-wider">Cancelled</span>
        ) : (
          <ConfidenceDot />
        )}
      </div>

      {/* Middle section */}
      <div className="py-4 border-t border-b border-border/60 mb-4 flex-grow flex flex-col justify-center">
        <div className="flex items-baseline gap-1">
          <span className="text-xl font-bold text-text-primary">${monthlyEstimate.toFixed(2)}</span>
          <span className="text-sm font-medium text-text-secondary">/mo</span>
        </div>
        <div className="text-xs text-text-secondary mt-1">
          ${annualEstimate.toFixed(2)}/yr
        </div>
        <div className="text-[11px] text-text-tertiary mt-2">
          Last charged {lastSeen}
        </div>
      </div>

      {/* Bottom section */}
      <div className="flex items-center justify-between gap-2 mt-auto">
        {isCancelled ? (
          <button onClick={() => onCancel(subscription.id)} className="text-sm font-medium text-text-secondary hover:text-text-primary">
            Undo
          </button>
        ) : confidence === 'high' ? (
          <>
            <a 
              href={matchedMerchant?.cancel_url || '#'} 
              target="_blank" 
              rel="noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 bg-accent hover:bg-accent-hover text-white text-sm font-medium py-2 px-3 rounded shrink-0 transition-colors"
            >
              Cancel <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <button onClick={handleCancelClick} className="flex-1 text-sm font-medium text-accent hover:text-accent-hover py-2 px-2 shrink-0">
              Mark Cancelled
            </button>
          </>
        ) : confidence === 'medium' ? (
          <>
            <button className="flex-1 flex items-center justify-center gap-1 border border-accent text-accent hover:bg-accent-light text-sm font-medium py-2 px-3 rounded transition-colors">
              Investigate &rarr;
            </button>
            <button onClick={() => onDismiss(subscription.id)} className="text-sm font-medium text-text-secondary hover:text-text-primary py-2 px-3">
              Dismiss
            </button>
          </>
        ) : (
          <>
             <span className="text-xs font-medium text-warning flex-1">Possible recurring</span>
             <button onClick={() => onDismiss(subscription.id)} className="text-sm font-medium text-text-secondary hover:text-text-primary py-2 px-3">
              Dismiss
            </button>
          </>
        )}
      </div>
    </motion.div>
  );
}

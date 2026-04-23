'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import type { DetectedSubscription } from '@/types';
import SubscriptionCard from '@/components/SubscriptionCard';
import InvestigateDrawer from '@/components/InvestigateDrawer';
import LogoMenu from '@/components/LogoMenu';
import { Download, Cloud, LogIn, LayoutDashboard, PlusCircle, History as HistoryIcon, Bell, Settings as SettingsIcon } from 'lucide-react';
import { exportToPDF } from '@/lib/export';
import { useAuth } from '@/hooks/useAuth';
import { useSubscriptions } from '@/hooks/useSubscriptions';
import AuthModal from '@/components/AuthModal';
import { useCurrency } from '@/hooks/useCurrency';
import { logActivity } from '@/lib/activity';

function AnimatedNumber({ value }: { value: number }) {
  const { format: formatCurrency } = useCurrency();
  const spring = useSpring(0, { bounce: 0, duration: 1500 });
  const [display, setDisplay] = useState('');
  
  const springValue = useTransform(spring, (current) => Math.round(current));

  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  useEffect(() => {
    return springValue.on('change', (v) => setDisplay(formatCurrency(v)));
  }, [springValue, formatCurrency]);

  return <motion.span>{display || formatCurrency(0)}</motion.span>;
}

export default function Dashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { subscriptions: cloudSubs, loading: subsLoading, saveToCloud } = useSubscriptions(user);
  const { format: formatCurrency } = useCurrency();
  
  const [subscriptions, setSubscriptions] = useState<DetectedSubscription[]>([]);
  const [cancelledIds, setCancelledIds] = useState<Set<string>>(new Set());
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [isLoaded, setIsLoaded] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [investigateTarget, setInvestigateTarget] = useState<DetectedSubscription | null>(null);
  const [filter, setFilter] = useState<'all' | 'high'>('all');


  useEffect(() => {
    if (user && isAuthModalOpen) {
      setIsAuthModalOpen(false);
    }
  }, [user, isAuthModalOpen]);

  useEffect(() => {
    if (!authLoading && !subsLoading) {
      if (cloudSubs.length > 0) {
        setSubscriptions(cloudSubs);
      } else {
        const saved = localStorage.getItem('substro_results');
        if (saved) {
          try {
            setSubscriptions(JSON.parse(saved));
          } catch (e) {
            console.error("Failed to load subscriptions", e);
          }
        } else {
          router.push('/');
        }
      }
      setIsLoaded(true);
    }
  }, [authLoading, subsLoading, cloudSubs, router]);

  const handleSaveToCloud = async () => {
    if (!user) {
      setIsAuthModalOpen(true);
    } else {
      await saveToCloud(subscriptions);
      logActivity('upload', { count: subscriptions.length });
    }
  };

  const toggleCancel = (id: string) => {
    const isNowCancelled = !cancelledIds.has(id);
    setCancelledIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

    if (isNowCancelled) {
      const sub = subscriptions.find(s => s.id === id);
      logActivity('cancelled', { merchant_name: sub?.matchedMerchant?.name || sub?.cleanName });
    }
  };

  const dismiss = (id: string) => {
    setDismissedIds(prev => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    const sub = subscriptions.find(s => s.id === id);
    logActivity('dismissed', { merchant_name: sub?.matchedMerchant?.name || sub?.cleanName });
  };

  if (!isLoaded) return null;

  if (!user) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-accent-light text-accent rounded-full flex items-center justify-center mb-6">
          <LogIn className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-bold text-text-primary mb-4">Login Required</h1>
        <p className="text-text-secondary max-w-[400px] mb-8">
          To protect your financial data and save your results, you must sign in to view your subscription report.
        </p>
        <button 
          onClick={() => setIsAuthModalOpen(true)}
          className="bg-accent hover:bg-accent-hover text-white px-8 py-3 rounded-default font-bold transition-all shadow-sm"
        >
          Sign in to Substro
        </button>
        <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      </div>
    );
  }

  const activeSubs = subscriptions.filter(s => !dismissedIds.has(s.id));

  const filteredSubs = filter === 'high' ? activeSubs.filter(s => s.confidence === 'high') : activeSubs;

  const activeCount = activeSubs.filter(s => !cancelledIds.has(s.id)).length;
  const activeMonthly = activeSubs.filter(s => !cancelledIds.has(s.id)).reduce((acc, s) => acc + s.monthlyEstimate, 0);
  const activeAnnual = activeSubs.filter(s => !cancelledIds.has(s.id)).reduce((acc, s) => acc + s.annualEstimate, 0);

  const sortedSubs = [...filteredSubs].sort((a, b) => {
     if (cancelledIds.has(a.id) && !cancelledIds.has(b.id)) return 1;
     if (!cancelledIds.has(a.id) && cancelledIds.has(b.id)) return -1;
     const confScore = { high: 3, medium: 2, low: 1 };
     if (confScore[a.confidence] !== confScore[b.confidence]) {
         return confScore[b.confidence] - confScore[a.confidence];
     }
     return b.annualEstimate - a.annualEstimate;
  });


  return (
    <div className="min-h-screen bg-surface-muted text-text-primary pb-20">
      {/* Top Bar */}
      <nav className="h-14 border-b border-border flex items-center justify-between px-6 bg-surface z-50 sticky top-0">

        <LogoMenu />
        <div className="flex items-center gap-3">
          <button 
            onClick={() => window.dispatchEvent(new CustomEvent('substro:open', { detail: 'profile' }))}
            className="flex items-center gap-2 group transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center font-semibold text-sm ring-offset-2 ring-accent/0 group-hover:ring-2 group-hover:ring-accent transition-all">
              {user?.email?.[0].toUpperCase() || 'U'}
            </div>
          </button>
        </div>
      </nav>

      {/* Summary Strip */}
      <div className="w-full bg-surface border-b border-border py-6 px-6">
        <div className="max-w-[1024px] mx-auto grid grid-cols-3 divide-x divide-border">
          <div className="px-6 flex flex-col items-center text-center">
            <span className="text-sm font-medium text-text-secondary uppercase tracking-wider mb-2">Monthly Spend</span>
            <div className="text-3xl font-bold text-accent flex items-baseline">
              <AnimatedNumber value={activeMonthly} />
              <span className="text-lg text-text-secondary font-medium ml-1">/mo</span>
            </div>
          </div>
          <div className="px-6 flex flex-col items-center text-center">
            <span className="text-sm font-medium text-text-secondary uppercase tracking-wider mb-2">Annual Cost</span>
            <div className="text-3xl font-bold text-text-primary flex items-baseline">
              <AnimatedNumber value={activeAnnual} />
              <span className="text-lg text-text-secondary font-medium ml-1">/yr</span>
            </div>
          </div>
          <div className="px-6 flex flex-col items-center text-center">
            <span className="text-sm font-medium text-text-secondary uppercase tracking-wider mb-2">Active Subs</span>
            <div className="text-3xl font-bold text-text-primary">
              <motion.span>{activeCount}</motion.span>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="max-w-[1024px] mx-auto px-6 py-4 flex items-center justify-between sticky top-14 bg-surface-muted/90 backdrop-blur z-10">
        <div className="flex gap-4 text-sm font-medium">
          <button 
            onClick={() => setFilter('all')}
            className={`pb-1 transition-all ${filter === 'all' ? 'text-text-primary border-b-2 border-accent font-bold' : 'text-text-secondary hover:text-text-primary'}`}
          >
            All Detected
          </button>
          <button 
            onClick={() => setFilter('high')}
            className={`pb-1 transition-all ${filter === 'high' ? 'text-text-primary border-b-2 border-accent font-bold' : 'text-text-secondary hover:text-text-primary'}`}
          >
            High Confidence
          </button>
        </div>

        <div className="flex gap-3">
           <button 
             onClick={handleSaveToCloud}
             className="flex items-center gap-2 text-sm font-medium text-accent hover:bg-accent-light bg-white border border-accent px-3 py-1.5 rounded shadow-sm transition-colors"
           >
              <Cloud className="w-4 h-4" /> Save to Cloud
           </button>
           <button 
             onClick={() => exportToPDF(activeSubs)}
             className="flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-text-primary bg-white border border-border px-3 py-1.5 rounded shadow-sm transition-colors"
           >
              <Download className="w-4 h-4" /> Export PDF
           </button>
        </div>
      </div>

      {/* Grid */}
      <main className="max-w-[1024px] mx-auto px-6 pt-4">
        {sortedSubs.length === 0 ? (
          <div className="text-center py-24 bg-surface rounded-2xl border border-border border-dashed">
            <LayoutDashboard className="w-12 h-12 text-text-tertiary mx-auto mb-4 opacity-20" />
            <h2 className="text-xl font-bold text-text-primary mb-2">Ready to find savings?</h2>
            <p className="text-text-secondary mb-8">Upload your statement on the home page to begin analysis.</p>
            <button 
              onClick={() => router.push('/')}
              className="bg-accent text-white px-6 py-2 rounded-default font-bold"
            >
              Upload Statement
            </button>
          </div>
        ) : (
          <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {sortedSubs.map((sub) => (
                <SubscriptionCard 
                  key={sub.id} 
                  subscription={sub} 
                  onCancel={toggleCancel}
                  onDismiss={dismiss}
                  onInvestigate={(s) => setInvestigateTarget(s)}
                  isCancelled={cancelledIds.has(sub.id)}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </main>

      <InvestigateDrawer 
        sub={investigateTarget}
        open={!!investigateTarget}
        onClose={() => setInvestigateTarget(null)}
        onConfirm={(id) => { toggleCancel(id); setInvestigateTarget(null); }}
        onDismiss={(id) => { dismiss(id); setInvestigateTarget(null); }}
      />

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </div>
  );
}

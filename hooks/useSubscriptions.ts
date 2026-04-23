import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import type { DetectedSubscription } from '@/types';
import { toast } from 'sonner';

export function useSubscriptions(user: any) {
  const [subscriptions, setSubscriptions] = useState<DetectedSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchSubs() {
      if (!user) {
        const local = localStorage.getItem('substro_results');
        if (local) setSubscriptions(JSON.parse(local));
        setLoading(false);
        return;
      }

      setLoading(true);
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        toast.error(`Failed to load subscriptions: ${error.message}`);
      } else if (data && data.length > 0) {
        const mapped: DetectedSubscription[] = data.map(item => ({
          id: item.id,
          cleanName: item.raw_name,
          matchedMerchant: null,
          transactions: [],
          avgAmount: Number(item.amount),
          amountVariance: 0,
          intervalDays: item.frequency === 'monthly' ? 30 : 365,
          frequency: item.frequency as any,
          confidence: item.confidence as any,
          monthlyEstimate: Number(item.amount),
          annualEstimate: Number(item.amount) * (item.frequency === 'monthly' ? 12 : 1),
          category: item.category || 'General',
          firstSeen: item.last_date,
          lastSeen: item.last_date,
        }));
        setSubscriptions(mapped);
      } else {
        const local = localStorage.getItem('substro_results');
        if (local) setSubscriptions(JSON.parse(local));
      }
      setLoading(false);
    }

    fetchSubs();
  }, [user]); // Only depend on user object

  const saveToCloud = async (localSubs: DetectedSubscription[]) => {
    if (!user) return;

    const toInsert = localSubs.map(sub => ({
      user_id: user.id,
      raw_name: sub.matchedMerchant?.name || sub.cleanName,
      amount: sub.monthlyEstimate,
      frequency: sub.frequency === 'annual' ? 'annual' : 'monthly',
      last_date: sub.lastSeen,
      confidence: sub.confidence,
      category: sub.category,
      status: 'active'
    }));

    // For a clean sync, we delete existing and re-insert local results
    const { error: deleteError } = await supabase
      .from('user_subscriptions')
      .delete()
      .eq('user_id', user.id);

    if (deleteError) {
      toast.error(`Sync failed: ${deleteError.message}`);
      return;
    }

    const { error: insertError } = await supabase
      .from('user_subscriptions')
      .insert(toInsert);

    if (insertError) {
      toast.error(`Failed to save to cloud: ${insertError.message}`);
    } else {
      toast.success('All results securely synced to your account');
    }
  };

  return { subscriptions, loading, saveToCloud };
}

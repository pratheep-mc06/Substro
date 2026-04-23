'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

export function useCurrency() {
  const [currency, setCurrency] = useState('INR');
  const supabase = createClient();

  useEffect(() => {
    async function fetchCurrency() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('currency')
          .eq('id', user.id)
          .single();
        if (data?.currency) setCurrency(data.currency);
      }
    }
    fetchCurrency();
  }, []);

  const format = (amount: number) => {
    const symbols: Record<string, string> = { 
      INR: '₹', 
      USD: '$', 
      EUR: '€', 
      GBP: '£', 
      SGD: 'S$' 
    };
    
    const localeMap: Record<string, string> = {
      INR: 'en-IN',
      USD: 'en-US',
      EUR: 'de-DE',
      GBP: 'en-GB',
      SGD: 'en-SG'
    };

    return `${symbols[currency] ?? '₹'}${amount.toLocaleString(localeMap[currency] || 'en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  return { currency, setCurrency, format };
}

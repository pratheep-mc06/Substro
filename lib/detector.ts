import Fuse from 'fuse.js';
import type { Transaction, DetectedSubscription, Merchant } from '@/types';
import merchantsData from './merchants.json';

const merchants: Merchant[] = merchantsData;

export function detectSubscriptions(transactions: Transaction[]): DetectedSubscription[] {
  // Step A - Clean
  const cleanDescription = (desc: string) => {
    let clean = desc.toUpperCase();
    const noise = ["POS", "ACH", "DEBIT", "PURCHASE", "RECURRING", "PAYMENT", "CHECKCARD", "TRNSFR", "WWW", "HTTPSWWW"];
    noise.forEach(n => {
      clean = clean.replace(new RegExp(`\\b${n}\\b`, 'g'), '');
    });
    clean = clean.replace(/[\d]/g, '');
    clean = clean.replace(/[^\w\s]/g, ' ');
    // Remove state abbreviations (simple heuristic)
    clean = clean.replace(/\b[A-Z]{2}\b/g, '');
    return clean.replace(/\s+/g, ' ').trim();
  };

  const cleanedTransactions = transactions.map(t => ({
    ...t,
    cleanName: cleanDescription(t.description)
  })).filter(t => t.cleanName.length > 2);

  // Step B - Group
  const groups: Record<string, typeof cleanedTransactions> = {};
  cleanedTransactions.forEach(t => {
    if (!groups[t.cleanName]) groups[t.cleanName] = [];
    groups[t.cleanName].push(t);
  });

  const fuse = new Fuse(merchants, {
    keys: ['name'],
    threshold: 0.35,
  });

  const detected: DetectedSubscription[] = [];

  // Step C & D - Pattern Analysis
  for (const entry of Object.entries(groups)) {
    const [cleanName, group] = entry;
    if (group.length < 2) continue;

    const amounts = group.map(t => t.amount);
    const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const varianceSq = amounts.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / amounts.length;
    const stddev = Math.sqrt(varianceSq);
    const amountVariance = mean === 0 ? 0 : (stddev / mean) * 100;

    const dates = group.map(t => new Date(t.date).getTime()).sort((a, b) => a - b);
    const intervals = [];
    for (let i = 1; i < dates.length; i++) {
      intervals.push((dates[i] - dates[i - 1]) / (1000 * 60 * 60 * 24));
    }
    intervals.sort((a, b) => a - b);
    const intervalDays = intervals.length > 0 ? intervals[Math.floor(intervals.length / 2)] : 0;

    let frequency: DetectedSubscription['frequency'] = 'irregular';
    if (intervalDays >= 5 && intervalDays <= 9) frequency = 'weekly';
    else if (intervalDays >= 25 && intervalDays <= 35) frequency = 'monthly';
    else if (intervalDays >= 85 && intervalDays <= 95) frequency = 'quarterly';
    else if (intervalDays >= 355 && intervalDays <= 375) frequency = 'annual';

    // Fuzzy Match
    const match = fuse.search(cleanName);
    const matchedMerchant = match.length > 0 ? match[0].item : null;

    // Step E - Confidence
    let confidence: DetectedSubscription['confidence'] = 'low';
    const isRecognizedFreq = frequency !== 'irregular';

    if (matchedMerchant && group.length >= 3 && amountVariance < 5 && isRecognizedFreq) {
      confidence = 'high';
    } else if (matchedMerchant || (group.length >= 2 && amountVariance < 15 && isRecognizedFreq)) {
      confidence = 'medium';
    } else {
      confidence = 'low';
    }

    let monthlyEstimate = 0;
    let annualEstimate = 0;
    if (frequency === 'weekly') { monthlyEstimate = mean * 4.33; annualEstimate = mean * 52; }
    else if (frequency === 'monthly') { monthlyEstimate = mean; annualEstimate = mean * 12; }
    else if (frequency === 'quarterly') { monthlyEstimate = mean / 3; annualEstimate = mean * 4; }
    else if (frequency === 'annual') { monthlyEstimate = mean / 12; annualEstimate = mean; }

    detected.push({
      id: crypto.randomUUID(),
      cleanName,
      matchedMerchant,
      transactions: group,
      avgAmount: mean,
      amountVariance,
      intervalDays,
      frequency,
      confidence,
      monthlyEstimate,
      annualEstimate,
      category: matchedMerchant?.category || 'Uncategorized',
      firstSeen: new Date(dates[0]).toISOString().split('T')[0],
      lastSeen: new Date(dates[dates.length - 1]).toISOString().split('T')[0],
    });
  }

  // Step F - Deduplication (Simplistic implementation: Merge by matchedMerchant slug)
  const dedupedMap: Record<string, DetectedSubscription> = {};
  const finals: DetectedSubscription[] = [];

  for (const sub of detected) {
    if (sub.matchedMerchant) {
      const existing = dedupedMap[sub.matchedMerchant.slug];
      if (existing) {
        if (sub.transactions.length > existing.transactions.length) {
          dedupedMap[sub.matchedMerchant.slug] = { ...sub, id: existing.id }; // replace but keep ID (or just replace)
        }
      } else {
        dedupedMap[sub.matchedMerchant.slug] = sub;
      }
    } else {
      finals.push(sub);
    }
  }

  finals.push(...Object.values(dedupedMap));

  return finals.sort((a, b) => b.annualEstimate - a.annualEstimate);
}

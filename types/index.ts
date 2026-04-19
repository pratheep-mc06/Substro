export interface Transaction {
  date: string;       // ISO format YYYY-MM-DD
  description: string;
  amount: number;     // always positive
  raw: string;
}

export interface Merchant {
  name: string;
  slug: string;
  category: string;
  cancel_url: string;
  logo_url: string;
}

export interface DetectedSubscription {
  id: string;
  cleanName: string;
  matchedMerchant: Merchant | null;
  transactions: Transaction[];
  avgAmount: number;
  amountVariance: number; // percentage
  intervalDays: number;
  frequency: 'weekly' | 'monthly' | 'quarterly' | 'annual' | 'irregular';
  confidence: 'high' | 'medium' | 'low';
  monthlyEstimate: number;
  annualEstimate: number;
  category: string;
  firstSeen: string;
  lastSeen: string;
}

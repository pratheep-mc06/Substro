'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Lock, Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function UpdatePassword() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const supabase = createClient();

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.updateUser({
      password: password
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen bg-surface-muted flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-[400px] bg-surface rounded-default shadow-xl border border-border p-8"
      >
        <div className="flex items-center gap-2 mb-8 justify-center">
          <div className="w-6 h-6 bg-accent rounded-sm" />
          <span className="font-bold text-xl tracking-tight text-text-primary">Substro</span>
        </div>

        {success ? (
          <div className="text-center py-4">
            <div className="w-12 h-12 bg-green-50 text-success rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-text-primary mb-2">Password set!</h3>
            <p className="text-text-secondary">
              Your account is now secure. Redirecting to dashboard...
            </p>
          </div>
        ) : (
          <>
            <h3 className="text-2xl font-bold text-text-primary mb-2 text-center">Set your password</h3>
            <p className="text-text-secondary text-sm mb-8 text-center">
              Please choose a secure password to use for future logins.
            </p>

            <form onSubmit={handleUpdate} className="space-y-6">
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 w-4 h-4 text-text-tertiary" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="New Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 bg-surface-muted border border-border rounded-default text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-text-tertiary hover:text-text-secondary transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {error && <p className="text-xs text-danger font-medium text-center">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-accent hover:bg-accent-hover text-white py-3 rounded-default font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Secure My Account"}
              </button>
            </form>
          </>
        )}
      </motion.div>
    </div>
  );
}

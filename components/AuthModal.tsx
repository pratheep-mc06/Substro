'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Mail, Loader2, CheckCircle2, Lock, Eye, EyeOff, User, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  isForced?: boolean;
}

export default function AuthModal({ isOpen, onClose, isForced = false }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const supabase = createClient();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (mode === 'signup') {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?type=signup`,
          data: { full_name: name }
        },
      });
      if (error) setError(error.message);
      else setSent(true);
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) setError(error.message);
      else onClose();
    }
    
    setLoading(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={!isForced ? onClose : undefined}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="w-full max-w-[420px] bg-surface rounded-default shadow-2xl border border-border p-8 relative z-10"
          >
            {!isForced && (
              <button 
                onClick={onClose}
                className="absolute top-4 right-4 text-text-tertiary hover:text-text-secondary transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}

            <AnimatePresence mode="wait">
              {sent ? (
                <motion.div
                  key="sent"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-4"
                >
                  <div className="w-12 h-12 bg-green-50 text-success rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-text-primary mb-2">Check your email</h3>
                  <p className="text-text-secondary">
                    We've sent a magic link to <strong>{email}</strong>. Click it to complete your registration and set your password.
                  </p>
                </motion.div>
              ) : (
                <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <div className="flex gap-4 mb-8 border-b border-border">
                    <button 
                      onClick={() => { setMode('login'); setError(null); }}
                      className={`pb-2 text-sm font-bold transition-colors ${mode === 'login' ? 'text-accent border-b-2 border-accent' : 'text-text-tertiary hover:text-text-secondary'}`}
                    >
                      Login
                    </button>
                    <button 
                      onClick={() => { setMode('signup'); setError(null); }}
                      className={`pb-2 text-sm font-bold transition-colors ${mode === 'signup' ? 'text-accent border-b-2 border-accent' : 'text-text-tertiary hover:text-text-secondary'}`}
                    >
                      Sign Up
                    </button>
                  </div>

                  <h3 className="text-xl font-bold text-text-primary mb-2">
                    {mode === 'login' ? 'Welcome back' : 'Create an account'}
                  </h3>
                  <p className="text-text-secondary text-sm mb-6">
                    {mode === 'login' ? 'Sign in with your email and password.' : 'Enter your details to receive a magic login link.'}
                  </p>

                  <form onSubmit={handleAuth} className="space-y-4">
                    {mode === 'signup' && (
                      <div className="relative">
                        <User className="absolute left-3 top-3 w-4 h-4 text-text-tertiary" />
                        <input
                          type="text"
                          required
                          placeholder="Your Name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 bg-surface-muted border border-border rounded-default text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                        />
                      </div>
                    )}

                    <div className="relative">
                      <Mail className="absolute left-3 top-3 w-4 h-4 text-text-tertiary" />
                      <input
                        type="email"
                        required
                        placeholder="Email Address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-surface-muted border border-border rounded-default text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                      />
                    </div>

                    {mode === 'login' && (
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 w-4 h-4 text-text-tertiary" />
                        <input
                          type={showPassword ? "text" : "password"}
                          required
                          placeholder="Password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full pl-10 pr-10 py-2.5 bg-surface-muted border border-border rounded-default text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-3 text-text-tertiary hover:text-text-secondary transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    )}

                    {error && <p className="text-xs text-danger font-medium">{error}</p>}

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-accent hover:bg-accent-hover text-white py-2.5 rounded-default font-bold text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-70 mt-2"
                    >
                      {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        mode === 'login' ? "Sign In" : "Send Magic Link"
                      )}
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

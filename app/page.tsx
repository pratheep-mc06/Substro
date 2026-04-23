'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, FileType, Zap } from 'lucide-react';
import DropZone from '@/components/DropZone';
import ProcessingTerminal from '@/components/ProcessingTerminal';
import { parseFile } from '@/lib/parser';
import { detectSubscriptions } from '@/lib/detector';
import { useAuth } from '@/hooks/useAuth';
import AuthModal from '@/components/AuthModal';

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [terminalLines, setTerminalLines] = useState<string[]>([]);
  const [showResultsBtn, setShowResultsBtn] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [summary, setSummary] = useState({ count: 0, amount: 0 });
  const [currentFile, setCurrentFile] = useState<File | null>(null);


  useEffect(() => {
    if (user && isAuthModalOpen) {
      setIsAuthModalOpen(false);
      setShowResultsBtn(true);
    }
  }, [user, isAuthModalOpen]);


  const handleFileDrop = async (file: File) => {
    setCurrentFile(file);
    setIsProcessing(true);
    setTerminalLines(['Parsing transactions...']);
    
    try {
      const transactions = await parseFile(file);
      setTerminalLines(prev => [...prev, `Parsing transactions...                     [✓ ${transactions.length} found]`]);
      
      await new Promise(r => setTimeout(r, 400));
      setTerminalLines(prev => [...prev, 'Cleaning merchant names...                  [✓ done]']);
      
      await new Promise(r => setTimeout(r, 400));
      const detected = detectSubscriptions(transactions);
      
      setTerminalLines(prev => [...prev, 'Matching against 100 known services...      [✓ done]']);
      
      await new Promise(r => setTimeout(r, 400));
      setTerminalLines(prev => [...prev, 'Detecting recurring patterns...             [✓ done]']);
      
      await new Promise(r => setTimeout(r, 400));
      setTerminalLines(prev => [...prev, 'Calculating your annual spend...']);
      
      const totalAnnual = detected.reduce((sum, sub) => sum + sub.annualEstimate, 0);
      
      await new Promise(r => setTimeout(r, 600));
      setTerminalLines(prev => [
        ...prev,
        '──────────────────────────────────────────',
        `Found ${detected.length} subscriptions · $${Math.round(totalAnnual)}/year`,
        '──────────────────────────────────────────'
      ]);

      setSummary({ count: detected.length, amount: Math.round(totalAnnual) });
      
      // Save to localStorage
      localStorage.setItem('substro_results', JSON.stringify(detected));
      localStorage.setItem('substro_summary', JSON.stringify({ count: detected.length, amount: Math.round(totalAnnual) }));
      
    } catch (error) {
      setTerminalLines(prev => [...prev, 'Error processing file. Please try again.']);
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface text-text-primary">
      {/* Navigation */}
      <nav className="h-14 border-b border-border flex items-center justify-between px-6 bg-surface z-10 sticky top-0">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push('/')}>
          <div className="w-5 h-5 bg-accent rounded-sm" />
          <span className="font-semibold text-lg tracking-tight">Substro</span>
        </div>
        {user ? (
          <button 
            onClick={() => router.push('/dashboard')}
            className="text-sm font-medium text-accent hover:text-accent-hover transition-colors"
          >
            Dashboard
          </button>
        ) : (
          <button 
            onClick={() => router.push('/dashboard')}
            className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
          >
            Sign in
          </button>
        )}
      </nav>

      <main className="flex-grow flex flex-col items-center pt-20 px-6">
        {/* Hero */}
        <div className="max-w-[640px] text-center mb-12">
          <h1 className="text-[48px] font-bold leading-tight tracking-tight mb-4 text-[#0A0A0A]">
            Find every subscription draining your account.
          </h1>
          <p className="text-[18px] text-slate-500 mb-8">
            Upload your bank statement. Substro finds recurring charges automatically — no account linking required.
          </p>

          <div className="mb-10 flex flex-col items-center gap-3">
             <div className="text-sm font-medium text-text-tertiary">
               Already have an account? <button onClick={() => router.push('/dashboard')} className="text-accent hover:text-accent-hover font-bold underline underline-offset-4">Sign in here</button>
             </div>
          </div>
          
          <div className="flex flex-wrap justify-center gap-4 text-sm font-medium text-text-secondary">
            <span className="flex items-center gap-1 bg-surface-muted px-3 py-1 rounded-full border border-border">
              <ShieldCheck className="w-4 h-4 text-accent" /> Processed locally
            </span>
            <span className="flex items-center gap-1 bg-surface-muted px-3 py-1 rounded-full border border-border">
              <FileType className="w-4 h-4 text-accent" /> CSV & PDF supported
            </span>
            <span className="flex items-center gap-1 bg-surface-muted px-3 py-1 rounded-full border border-border">
              <Zap className="w-4 h-4 text-accent" /> No sign-up to analyze
            </span>
          </div>
        </div>

        {/* Upload & Processing */}
        <div className="w-full relative z-0">
          <DropZone onFileDrop={handleFileDrop} isProcessing={isProcessing} file={currentFile} />
          
          <AnimatePresence>
            {terminalLines.length > 0 && (
              <ProcessingTerminal 
                lines={terminalLines} 
                onComplete={() => {
                  setShowResultsBtn(true);
                }} 
              />
            )}
          </AnimatePresence>


          <AnimatePresence>
            {showResultsBtn && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center mt-6"
              >
                <button
                  onClick={() => {
                    if (!user) {
                      setIsAuthModalOpen(true);
                    } else {
                      router.push('/dashboard');
                    }
                  }}
                  className="bg-accent hover:bg-accent-hover text-white px-8 py-4 rounded-default font-bold transition-all shadow-lg text-lg flex items-center gap-2 group"
                >
                  View My Report 
                  <motion.span animate={{ x: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>&rarr;</motion.span>
                </button>
                <p className="text-sm text-text-secondary mt-4 max-w-[320px] text-center font-medium">
                  {user ? "Your analysis is ready!" : "Sign in securely to access your personalized analysis."}
                </p>
              </motion.div>
            )}
          </AnimatePresence>


        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-[960px] w-full mt-32 mb-20">
          <div className="space-y-2">
            <Zap className="w-6 h-6 text-accent" />
            <h3 className="font-bold">Instant Detection</h3>
            <p className="text-text-secondary text-sm">Pattern-matched against 100 known subscription services.</p>
          </div>
          <div className="space-y-2">
            <ShieldCheck className="w-6 h-6 text-accent" />
            <h3 className="font-bold">No Account Linking</h3>
            <p className="text-text-secondary text-sm">Your file is parsed in your browser. Nothing is uploaded.</p>
          </div>
          <div className="space-y-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-mouse-pointer-click text-accent"><path d="m9 9 5 12 1.8-5.2L21 14Z"/><path d="M7.2 2.2 8 5.1"/><path d="m5.1 8-2.9-.8"/><path d="M14 4.1 12 6"/><path d="m6 12-1.9 2"/></svg>
            <h3 className="font-bold">One-Click Cancellation</h3>
            <p className="text-text-secondary text-sm">Direct links to every service's cancellation page.</p>
          </div>
        </div>
      </main>

      <footer className="border-t border-border py-6 px-6 flex justify-between text-sm text-text-tertiary bg-surface">
        <span>&copy; 2025 Substro</span>
        <div className="space-x-4">
          <a href="#" className="hover:text-text-secondary">Privacy</a>
          <a href="#" className="hover:text-text-secondary">Terms</a>
        </div>
      </footer>


      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        isForced={false}
      />
    </div>
  );
}


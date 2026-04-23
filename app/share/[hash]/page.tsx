'use client';

import { useRouter } from 'next/navigation';

export default function SharePage({ params }: { params: { hash: string } }) {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface-muted p-6">
      <div className="max-w-[600px] w-full bg-surface border border-border rounded-default p-12 text-center shadow-sm">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-6 h-6 bg-accent rounded-sm" />
          <span className="font-bold text-xl tracking-tight text-text-primary">Substro</span>
        </div>
        
        <h1 className="text-3xl font-bold text-text-primary mb-4">
          Someone found extra savings with Substro.
        </h1>
        <p className="text-text-secondary text-lg mb-8">
          Upload your bank statement and find every recurring charge draining your account in seconds.
        </p>

        <button 
          onClick={() => router.push('/')}
          className="bg-accent hover:bg-accent-hover text-white px-8 py-4 rounded-default font-bold transition-colors text-lg"
        >
          Analyze My Statement &rarr;
        </button>
        
        <p className="mt-8 text-sm text-text-tertiary">
          🔒 Processed locally in your browser. No account linking required.
        </p>
      </div>
    </div>
  );
}

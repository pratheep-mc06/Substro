'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDown, Home, LayoutDashboard, UploadCloud, 
  History, Bell, Settings, Keyboard, Share2, MessageSquare,
  LogOut, PlusCircle
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function LogoMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const handleAction = (type: string) => {
    setIsOpen(false);
    
    if (type === 'home') router.push('/');
    if (type === 'dashboard') router.push('/dashboard');
    if (type === 'upload') {
      localStorage.removeItem('substro_results');
      localStorage.removeItem('substro_summary');
      router.push('/');
    }
    if (['history', 'notifications', 'settings'].includes(type)) {
      window.dispatchEvent(new CustomEvent('substro:open', { detail: type }));
    }
    if (type === 'share') {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard');
    }
    if (type === 'feedback') {
      window.location.href = 'mailto:hello@substro.app';
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 group p-1 pr-2 rounded-lg hover:bg-surface-muted transition-colors"
      >
        <div className="w-6 h-6 bg-accent rounded-sm shadow-sm group-hover:scale-105 transition-transform" />
        <span className="font-bold text-lg tracking-tight text-text-primary">Substro</span>
        <ChevronDown className={`w-4 h-4 text-text-tertiary transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-sm" 
              onClick={() => setIsOpen(false)} 
            />
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              className="absolute top-full left-0 mt-3 w-64 bg-white border border-slate-200 rounded-2xl shadow-[0_30px_60px_-12px_rgba(0,0,0,0.3)] z-[90] overflow-hidden"
            >




              {/* Premium Gradient Header */}
              <div className="px-4 py-3 bg-gradient-to-br from-accent to-indigo-600">
                <p className="text-[10px] font-bold text-white/70 uppercase tracking-[0.2em]">Workspace</p>
                <p className="text-sm font-bold text-white">Substro Suite</p>
              </div>

              <div className="py-2">
                <div className="px-4 py-2 text-[10px] font-bold text-text-tertiary uppercase tracking-widest">Navigation</div>
                <MenuButton icon={<Home className="w-4 h-4" />} label="Home" onClick={() => handleAction('home')} />
                <MenuButton icon={<LayoutDashboard className="w-4 h-4" />} label="Dashboard" onClick={() => handleAction('dashboard')} />
                <MenuButton icon={<PlusCircle className="w-4 h-4" />} label="Upload New" onClick={() => handleAction('upload')} />
                
                <div className="h-px bg-border/50 my-2 mx-3" />
                <div className="px-4 py-2 text-[10px] font-bold text-text-tertiary uppercase tracking-widest">Tools</div>
                <MenuButton icon={<History className="w-4 h-4" />} label="Activity History" onClick={() => handleAction('history')} />
                <MenuButton icon={<Bell className="w-4 h-4" />} label="Notifications" onClick={() => handleAction('notifications')} />
                <MenuButton icon={<Settings className="w-4 h-4" />} label="Settings" onClick={() => handleAction('settings')} />
                
                <div className="h-px bg-border/50 my-2 mx-3" />
                <MenuButton icon={<Share2 className="w-4 h-4" />} label="Share Results" onClick={() => handleAction('share')} />
                <MenuButton icon={<MessageSquare className="w-4 h-4" />} label="Send Feedback" onClick={() => handleAction('feedback')} />
              </div>
            </motion.div>

          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function MenuButton({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-text-secondary hover:bg-surface-muted hover:text-accent transition-colors text-left font-medium"
    >
      <span className="text-text-tertiary group-hover:text-accent transition-colors">{icon}</span>
      {label}
    </button>
  );
}

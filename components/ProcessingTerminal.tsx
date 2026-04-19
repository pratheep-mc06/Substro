'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface ProcessingTerminalProps {
  lines: string[];
  onComplete: () => void;
}

export default function ProcessingTerminal({ lines, onComplete }: ProcessingTerminalProps) {
  const [visibleLines, setVisibleLines] = useState<string[]>([]);

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      if (index < lines.length) {
        setVisibleLines(prev => [...prev, lines[index]]);
        index++;
      } else {
        clearInterval(interval);
        onComplete();
      }
    }, 180);

    return () => clearInterval(interval);
  }, [lines, onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-[480px] mx-auto mt-6 bg-[#0A0A0A] rounded-default p-4 border border-slate-800 shadow-sm font-mono text-[14px] text-slate-300"
    >
      {visibleLines.map((line, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="whitespace-pre-wrap leading-relaxed"
        >
          {line}
        </motion.div>
      ))}
    </motion.div>
  );
}

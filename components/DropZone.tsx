'use client';

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, File as FileIcon } from 'lucide-react';

interface DropZoneProps {
  onFileDrop: (file: File) => void;
  isProcessing: boolean;
  file: File | null;
}

export default function DropZone({ onFileDrop, isProcessing, file }: DropZoneProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileDrop(acceptedFiles[0]);
    }
  }, [onFileDrop]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/pdf': ['.pdf']
    },
    maxFiles: 1,
    disabled: isProcessing
  });

  return (
    <div
      {...getRootProps()}
      className={`relative w-full max-w-[480px] mx-auto p-12 rounded-default border-2 transition-all duration-150 ease-in-out cursor-pointer overflow-hidden
        ${isProcessing 
          ? 'border-accent bg-surface shadow-sm' 
          : isDragActive 
            ? 'border-accent bg-accent-light' 
            : 'border-dashed border-slate-300 hover:border-accent hover:bg-accent-light bg-surface'
        }`}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center justify-center text-center space-y-4">
        {isProcessing && file ? (
          <motion.div
            initial={{ scale: 0.98, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center w-full"
          >
            <div className="w-12 h-12 bg-accent-light rounded-full flex items-center justify-center mb-2">
              <FileIcon className="w-6 h-6 text-accent" />
            </div>
            <p className="font-semibold text-text-primary text-sm mb-1">{file.name}</p>
            <p className="text-xs text-text-tertiary mb-6">Analyzing your statement...</p>
            
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden relative">
              <motion.div 
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 2, ease: "easeInOut" }}
                className="absolute inset-y-0 left-0 bg-accent"
              />
            </div>
          </motion.div>
        ) : (
          <>
            <UploadCloud className={`w-8 h-8 ${isDragActive ? 'text-accent' : 'text-accent'}`} />
            <div>
              <p className="font-semibold text-text-primary">Drop your statement here</p>
              <p className="text-sm text-text-secondary mt-1">CSV or PDF &middot; Your data never leaves your device</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}


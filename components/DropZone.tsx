'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DropZoneProps {
  onFileDrop: (file: File) => void;
  isProcessing: boolean;
}

export default function DropZone({ onFileDrop, isProcessing }: DropZoneProps) {
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
          ? 'border-accent bg-accent-light' 
          : isDragActive 
            ? 'border-accent bg-accent-light' 
            : 'border-dashed border-slate-300 hover:border-accent hover:bg-accent-light bg-surface'
        }`}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center justify-center text-center space-y-4">
        {isProcessing ? (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center"
          >
            <FileText className="w-8 h-8 text-accent mb-2" />
            <p className="font-semibold text-text-primary">Processing...</p>
            <div className="absolute bottom-0 left-0 h-1 bg-accent w-full origin-left animate-pulse" />
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

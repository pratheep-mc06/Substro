import { FileQuestion } from 'lucide-react';

export default function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-6">
        <FileQuestion className="w-8 h-8 text-slate-400" />
      </div>
      <h3 className="text-xl font-bold text-text-primary mb-2">No subscriptions detected</h3>
      <p className="text-text-secondary max-w-[320px]">
        Your statement looks clean — or try uploading a different date range to find more patterns.
      </p>
    </div>
  );
}

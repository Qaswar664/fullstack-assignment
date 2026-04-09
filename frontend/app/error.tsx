'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50">
      <h2 className="text-2xl font-semibold text-red-600">Something went wrong</h2>
      <p className="text-slate-500">{error.message}</p>
      <Button className="bg-slate-900 hover:bg-slate-800 text-white" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}

'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error('[error boundary]', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center">
        <div className="inline-flex rounded-2xl bg-destructive/10 p-4 mb-4">
          <AlertTriangle className="h-8 w-8 text-destructive" />
        </div>
        <h2 className="text-2xl font-heading font-bold mb-2">Something went wrong</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          An unexpected error occurred. Please try again.
        </p>
        <Button onClick={reset} className="cursor-pointer">
          Try Again
        </Button>
      </div>
    </div>
  );
}

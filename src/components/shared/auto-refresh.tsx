'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Re-fetches the current server component on an interval while `active`.
// Used to surface async generation results (pending → complete) without a
// manual reload.
export function AutoRefresh({ active, intervalMs = 4000 }: { active: boolean; intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => router.refresh(), intervalMs);
    return () => clearInterval(t);
  }, [active, intervalMs, router]);

  return null;
}

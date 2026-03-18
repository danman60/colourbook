'use client';

import { Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function CreditsBadge({ credits }: { credits: number }) {
  return (
    <Badge
      variant={credits > 5 ? 'default' : 'destructive'}
      className="gap-1 cursor-default"
    >
      <Sparkles className="h-3 w-3" />
      {credits} credit{credits !== 1 ? 's' : ''}
    </Badge>
  );
}

'use client';

import { motion } from 'motion/react';
import { Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export function CreditsBadge({ credits }: { credits: number }) {
  return (
    <Link href="/credits">
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Badge
          variant={credits > 5 ? 'default' : 'destructive'}
          className="gap-1.5 cursor-pointer px-3 py-1.5 text-sm"
        >
          <motion.div
            animate={{ rotate: [0, 15, -15, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            <Sparkles className="h-3.5 w-3.5" />
          </motion.div>
          {credits} credit{credits !== 1 ? 's' : ''}
        </Badge>
      </motion.div>
    </Link>
  );
}

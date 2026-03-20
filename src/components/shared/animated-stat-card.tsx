'use client';

import { motion } from 'motion/react';
import { NumberTicker } from '@/components/ui/number-ticker';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';

interface AnimatedStatCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  href: string;
  color: string;
  bg: string;
  index: number;
}

export function AnimatedStatCard({ label, value, icon: Icon, href, color, bg, index }: AnimatedStatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08, ease: 'easeOut' }}
    >
      <Link href={href}>
        <motion.div whileHover={{ y: -4, scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }}>
          <Card className="cursor-pointer hover:shadow-lg transition-shadow duration-300">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-heading font-bold">
                    {value > 0 ? <NumberTicker value={value} /> : '0'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">{label}</p>
                </div>
                <div className={`${bg} rounded-xl p-2.5`}>
                  <Icon className={`h-6 w-6 ${color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </Link>
    </motion.div>
  );
}

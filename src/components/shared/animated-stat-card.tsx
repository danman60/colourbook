'use client';

import { motion } from 'motion/react';
import { NumberTicker } from '@/components/ui/number-ticker';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { Users, Image, BookOpen, ShoppingBag, type LucideIcon } from 'lucide-react';

// Icons are resolved by name here: a server component cannot pass a component
// (function) across the client boundary, so the dashboard passes a string key.
const ICONS: Record<string, LucideIcon> = { Users, Image, BookOpen, ShoppingBag };

interface AnimatedStatCardProps {
  label: string;
  value: number;
  icon: string;
  href: string;
  color: string;
  bg: string;
  index: number;
}

export function AnimatedStatCard({ label, value, icon, href, color, bg, index }: AnimatedStatCardProps) {
  const Icon = ICONS[icon] ?? Image;
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

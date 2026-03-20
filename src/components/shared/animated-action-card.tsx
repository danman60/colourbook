'use client';

import { motion } from 'motion/react';
import { Card, CardContent } from '@/components/ui/card';
import { BorderBeam } from '@/components/ui/border-beam';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';

interface AnimatedActionCardProps {
  href: string;
  icon: LucideIcon;
  color: string;
  bg: string;
  title: string;
  subtitle: string;
  index: number;
  featured?: boolean;
}

export function AnimatedActionCard({ href, icon: Icon, color, bg, title, subtitle, index, featured }: AnimatedActionCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.4 + index * 0.1, ease: 'easeOut' }}
    >
      <Link href={href}>
        <motion.div whileHover={{ y: -4, scale: 1.02 }} whileTap={{ scale: 0.97 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }}>
          <Card className="cursor-pointer relative overflow-hidden border-dashed hover:border-solid transition-all duration-300">
            {featured && <BorderBeam size={80} duration={8} colorFrom="#E85D75" colorTo="#2EC4B6" />}
            <CardContent className="pt-6 text-center">
              <div className={`inline-flex ${bg} rounded-2xl p-3 mb-3`}>
                <Icon className={`h-7 w-7 ${color}`} />
              </div>
              <p className="font-heading font-semibold">{title}</p>
              <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
            </CardContent>
          </Card>
        </motion.div>
      </Link>
    </motion.div>
  );
}

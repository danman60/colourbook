'use client';

import { motion } from 'motion/react';
import { SparklesText } from '@/components/ui/sparkles-text';
import { ArrowRight, Sparkles, Star, Heart, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function HeroAnimated() {
  return (
    <section className="relative px-6 py-20 md:py-32 max-w-5xl mx-auto text-center">
      {/* Floating decorative elements */}
      <motion.div
        className="absolute top-10 left-8 opacity-20 hidden md:block"
        animate={{ y: [0, -12, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Star className="h-12 w-12 text-warm-amber" fill="currentColor" />
      </motion.div>
      <motion.div
        className="absolute top-24 right-12 opacity-15 hidden md:block"
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      >
        <Heart className="h-10 w-10 text-primary" fill="currentColor" />
      </motion.div>
      <motion.div
        className="absolute bottom-20 left-16 opacity-10 hidden md:block"
        animate={{ y: [0, -15, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
      >
        <Palette className="h-14 w-14 text-teal" />
      </motion.div>
      <motion.div
        className="absolute bottom-32 right-20 opacity-15 hidden md:block"
        animate={{ rotate: [0, 15, -15, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Sparkles className="h-8 w-8 text-warm-amber" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-medium mb-6">
          <Sparkles className="h-4 w-4" />
          AI-Powered Family Coloring Books
        </div>
      </motion.div>

      <motion.h1
        className="text-4xl md:text-6xl lg:text-7xl font-heading font-bold text-foreground leading-tight mb-6"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.15 }}
      >
        Turn Your Family Photos Into{' '}
        <SparklesText
          className="text-4xl md:text-6xl lg:text-7xl font-heading"
          colors={{ first: '#E85D75', second: '#F4A261' }}
          sparklesCount={6}
        >
          Beautiful Coloring Books
        </SparklesText>
      </motion.h1>

      <motion.p
        className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        Upload photos of your family, let AI create stunning coloring pages, and order a
        professionally printed book — or download free PDFs to color at home.
      </motion.p>

      <motion.div
        className="flex flex-col sm:flex-row gap-4 justify-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.45 }}
      >
        <Link href="/signup">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
            <Button size="lg" className="cursor-pointer text-base px-8 gap-2 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-shadow duration-300">
              Start Creating <ArrowRight className="h-4 w-4" />
            </Button>
          </motion.div>
        </Link>
        <Link href="/pricing">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
            <Button size="lg" variant="outline" className="cursor-pointer text-base px-8 hover:bg-muted/50 transition-colors duration-300">
              View Pricing
            </Button>
          </motion.div>
        </Link>
      </motion.div>

      <motion.p
        className="text-sm text-muted-foreground mt-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        20 free coloring pages included — no credit card required
      </motion.p>
    </section>
  );
}

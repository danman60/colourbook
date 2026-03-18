'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Menu, LogOut, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { CreditsBadge } from '@/components/shared/credits-badge';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/types';
import { Sidebar } from './sidebar';

export function Header({ profile }: { profile: Profile }) {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-card">
      <div className="flex items-center gap-2">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="cursor-pointer">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <Sidebar profile={profile} />
          </SheetContent>
        </Sheet>
        <Link href="/dashboard" className="flex items-center gap-1.5 cursor-pointer">
          <Palette className="h-5 w-5 text-primary" />
          <span className="font-bold font-heading">Colourbook</span>
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <CreditsBadge credits={profile.generation_credits} />
        <Button variant="ghost" size="icon" onClick={handleLogout} className="cursor-pointer">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}

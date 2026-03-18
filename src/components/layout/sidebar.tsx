'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Wand2,
  Image,
  BookOpen,
  ShoppingBag,
  Settings,
  Shield,
  Palette,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CreditsBadge } from '@/components/shared/credits-badge';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/types';

const userLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/family', label: 'Family', icon: Users },
  { href: '/generate', label: 'Generate', icon: Wand2 },
  { href: '/gallery', label: 'Gallery', icon: Image },
  { href: '/books', label: 'Books', icon: BookOpen },
  { href: '/orders', label: 'Orders', icon: ShoppingBag },
];

const adminLinks = [
  { href: '/admin', label: 'Admin Dashboard', icon: Shield },
  { href: '/admin/orders', label: 'All Orders', icon: ShoppingBag },
  { href: '/admin/print-partners', label: 'Print Partners', icon: Settings },
  { href: '/admin/regions', label: 'Regions', icon: Settings },
  { href: '/admin/prompts', label: 'Prompts', icon: Wand2 },
  { href: '/admin/users', label: 'Users', icon: Users },
];

export function Sidebar({ profile }: { profile: Profile }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard';
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  }

  const initials = (profile.full_name || profile.email)
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside className="hidden md:flex md:flex-col md:w-64 border-r border-border bg-card min-h-screen">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <Link href="/dashboard" className="flex items-center gap-2 cursor-pointer">
          <Palette className="h-7 w-7 text-primary" />
          <span className="text-xl font-bold font-heading text-foreground">Colourbook</span>
        </Link>
      </div>

      {/* Credits */}
      <div className="px-6 py-3 border-b border-border">
        <CreditsBadge credits={profile.generation_credits} />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {userLinks.map(link => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer relative',
              isActive(link.href)
                ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <link.icon className="h-4 w-4" />
            {link.label}
          </Link>
        ))}

        {profile.role === 'admin' && (
          <>
            <div className="pt-4 pb-2">
              <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Admin
              </p>
            </div>
            {adminLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer',
                  isActive(link.href)
                    ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            ))}
          </>
        )}
      </nav>

      {/* User info + logout */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-primary">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{profile.full_name || profile.email}</p>
            <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 cursor-pointer text-muted-foreground hover:text-destructive"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
}

import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Image, ArrowRight, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AnimatedStatCard } from '@/components/shared/animated-stat-card';
import { AnimatedActionCard } from '@/components/shared/animated-action-card';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [
    { count: familyCount },
    { count: pageCount },
    { count: bookCount },
    { count: orderCount },
    { data: recentPages },
    { data: profile },
  ] = await Promise.all([
    supabase.from('cb_family_members').select('*', { count: 'exact', head: true }).eq('user_id', user!.id),
    supabase.from('cb_pages').select('*', { count: 'exact', head: true }).eq('user_id', user!.id),
    supabase.from('cb_books').select('*', { count: 'exact', head: true }).eq('user_id', user!.id),
    supabase.from('cb_orders').select('*', { count: 'exact', head: true }).eq('user_id', user!.id),
    supabase.from('cb_pages').select('*').eq('user_id', user!.id).eq('generation_status', 'complete').order('created_at', { ascending: false }).limit(4),
    supabase.from('cb_profiles').select('full_name, generation_credits').eq('id', user!.id).single(),
  ]);

  const firstName = profile?.full_name?.split(' ')[0] || 'there';

  const stats = [
    { label: 'Family Members', value: familyCount || 0, icon: 'Users', href: '/family', color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Pages Generated', value: pageCount || 0, icon: 'Image', href: '/gallery', color: 'text-accent', bg: 'bg-accent/10' },
    { label: 'Books Created', value: bookCount || 0, icon: 'BookOpen', href: '/books', color: 'text-secondary', bg: 'bg-secondary/10' },
    { label: 'Orders', value: orderCount || 0, icon: 'ShoppingBag', href: '/orders', color: 'text-primary', bg: 'bg-primary/10' },
  ];

  const quickActions = [
    { href: '/family', icon: 'Users', color: 'text-primary', bg: 'bg-primary/10', title: 'Upload Family Photos', subtitle: 'Add your family members' },
    { href: '/generate', icon: 'Wand2', color: 'text-accent', bg: 'bg-accent/10', title: 'Generate a Page', subtitle: 'Create AI coloring pages', featured: true },
    { href: '/books', icon: 'BookOpen', color: 'text-secondary', bg: 'bg-secondary/10', title: 'Build a Book', subtitle: 'Compile your coloring book' },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div>
        <h1 className="text-3xl font-heading font-bold">
          Hey {firstName} <span className="inline-block animate-wiggle">👋</span>
        </h1>
        <p className="text-muted-foreground mt-1">Welcome to your Colourbook studio</p>
      </div>

      {/* Stats — animated with NumberTicker */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <AnimatedStatCard key={stat.label} {...stat} index={i} />
        ))}
      </div>

      {/* Quick Actions — animated with BorderBeam on featured */}
      <div className="grid md:grid-cols-3 gap-4">
        {quickActions.map((action, i) => (
          <AnimatedActionCard key={action.href} {...action} index={i} />
        ))}
      </div>

      {/* Credits reminder */}
      {profile && profile.generation_credits > 0 && (
        <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
          <CardContent className="pt-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 rounded-xl p-2">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">You have {profile.generation_credits} generation credits</p>
                <p className="text-sm text-muted-foreground">Each credit creates one AI coloring page</p>
              </div>
            </div>
            <Link href="/generate">
              <Button size="sm" className="cursor-pointer gap-1">
                Generate <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Recent Pages */}
      {recentPages && recentPages.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-heading font-semibold">Recent Pages</h2>
            <Link href="/gallery">
              <Button variant="ghost" size="sm" className="cursor-pointer gap-1">
                View All <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {recentPages.map(page => (
              <Link key={page.id} href={`/gallery/${page.id}`}>
                <Card className="cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 overflow-hidden group">
                  {page.coloring_page_url ? (
                    <img
                      src={page.coloring_page_url}
                      alt={page.prompt}
                      className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full aspect-square bg-muted flex items-center justify-center">
                      <Image className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <CardContent className="p-3">
                    <p className="text-sm truncate">{page.prompt}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

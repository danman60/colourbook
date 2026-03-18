import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Users, Wand2, Image, BookOpen, ShoppingBag, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [
    { count: familyCount },
    { count: pageCount },
    { count: bookCount },
    { count: orderCount },
    { data: recentPages },
  ] = await Promise.all([
    supabase.from('cb_family_members').select('*', { count: 'exact', head: true }).eq('user_id', user!.id),
    supabase.from('cb_pages').select('*', { count: 'exact', head: true }).eq('user_id', user!.id),
    supabase.from('cb_books').select('*', { count: 'exact', head: true }).eq('user_id', user!.id),
    supabase.from('cb_orders').select('*', { count: 'exact', head: true }).eq('user_id', user!.id),
    supabase.from('cb_pages').select('*').eq('user_id', user!.id).eq('generation_status', 'complete').order('created_at', { ascending: false }).limit(4),
  ]);

  const stats = [
    { label: 'Family Members', value: familyCount || 0, icon: Users, href: '/family', color: 'text-primary' },
    { label: 'Pages Generated', value: pageCount || 0, icon: Image, href: '/gallery', color: 'text-teal' },
    { label: 'Books Created', value: bookCount || 0, icon: BookOpen, href: '/books', color: 'text-warm-amber' },
    { label: 'Orders', value: orderCount || 0, icon: ShoppingBag, href: '/orders', color: 'text-primary' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-heading font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome to your Colourbook studio</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(stat => (
          <Link key={stat.label} href={stat.href}>
            <Card className="cursor-pointer hover:shadow-md transition-shadow duration-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-heading font-bold">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                  <stat.icon className={`h-8 w-8 ${stat.color} opacity-60`} />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-4">
        <Link href="/family">
          <Card className="cursor-pointer hover:shadow-md transition-shadow duration-200 border-dashed">
            <CardContent className="pt-6 text-center">
              <Users className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="font-medium">Upload Family Photos</p>
              <p className="text-sm text-muted-foreground">Add your family members</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/generate">
          <Card className="cursor-pointer hover:shadow-md transition-shadow duration-200 border-dashed">
            <CardContent className="pt-6 text-center">
              <Wand2 className="h-8 w-8 text-teal mx-auto mb-2" />
              <p className="font-medium">Generate a Page</p>
              <p className="text-sm text-muted-foreground">Create AI coloring pages</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/books">
          <Card className="cursor-pointer hover:shadow-md transition-shadow duration-200 border-dashed">
            <CardContent className="pt-6 text-center">
              <BookOpen className="h-8 w-8 text-warm-amber mx-auto mb-2" />
              <p className="font-medium">Build a Book</p>
              <p className="text-sm text-muted-foreground">Compile your coloring book</p>
            </CardContent>
          </Card>
        </Link>
      </div>

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
                <Card className="cursor-pointer hover:shadow-md transition-shadow duration-200 overflow-hidden">
                  {page.coloring_page_url ? (
                    <img
                      src={page.coloring_page_url}
                      alt={page.prompt}
                      className="w-full aspect-square object-cover"
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

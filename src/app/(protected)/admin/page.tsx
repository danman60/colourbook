import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingBag, Users, MapPin, Wand2 } from 'lucide-react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const [
    { count: orderCount },
    { count: userCount },
    { count: partnerCount },
    { data: recentOrders },
    { data: revenue },
  ] = await Promise.all([
    supabase.from('cb_orders').select('*', { count: 'exact', head: true }),
    supabase.from('cb_profiles').select('*', { count: 'exact', head: true }),
    supabase.from('cb_print_partners').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('cb_orders').select('*').order('created_at', { ascending: false }).limit(5),
    supabase.from('cb_orders').select('amount_cents').in('status', ['paid', 'processing', 'printing', 'shipped', 'delivered']),
  ]);

  const totalRevenue = (revenue || []).reduce((sum, o) => sum + o.amount_cents, 0);

  const stats = [
    { label: 'Total Orders', value: orderCount || 0, icon: ShoppingBag, href: '/admin/orders' },
    { label: 'Total Users', value: userCount || 0, icon: Users, href: '/admin/users' },
    { label: 'Print Partners', value: partnerCount || 0, icon: MapPin, href: '/admin/print-partners' },
    { label: 'Revenue', value: formatCurrency(totalRevenue), icon: Wand2, href: '/admin/orders' },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-heading font-bold">Admin Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(stat => (
          <Link key={stat.label} href={stat.href}>
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <stat.icon className="h-6 w-6 text-primary mb-2" />
                <p className="text-2xl font-heading font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle className="font-heading">Recent Orders</CardTitle></CardHeader>
        <CardContent>
          {!recentOrders || recentOrders.length === 0 ? (
            <p className="text-muted-foreground">No orders yet</p>
          ) : (
            <div className="space-y-3">
              {recentOrders.map(order => (
                <div key={order.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium">{order.shipping_name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{order.status}</p>
                  </div>
                  <p className="font-heading font-bold">{formatCurrency(order.amount_cents)}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { ShoppingBag } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate, formatCurrency } from '@/lib/utils';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-blue-100 text-blue-800',
  processing: 'bg-purple-100 text-purple-800',
  printing: 'bg-indigo-100 text-indigo-800',
  shipped: 'bg-teal/10 text-teal',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export default async function OrdersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: orders } = await supabase
    .from('cb_orders')
    .select('*, book:cb_books(title, page_count)')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-heading font-bold">My Orders</h1>
        <p className="text-muted-foreground mt-1">Track your printed coloring book orders</p>
      </div>

      {!orders || orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <ShoppingBag className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No orders yet</h3>
          <p className="text-muted-foreground max-w-md">Create a coloring book and order a printed copy!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <Link key={order.id} href={`/orders/${order.id}`}>
              <Card className="cursor-pointer hover:shadow-md transition-shadow duration-200 mb-4">
                <CardContent className="flex items-center justify-between pt-6">
                  <div>
                    <p className="font-heading font-semibold">{order.book?.title || 'Coloring Book'}</p>
                    <p className="text-sm text-muted-foreground">{formatDate(order.created_at)} &middot; {order.book?.page_count || 0} pages</p>
                  </div>
                  <div className="text-right">
                    <p className="font-heading font-bold">{formatCurrency(order.amount_cents, order.currency)}</p>
                    <Badge className={statusColors[order.status] || ''}>
                      {order.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

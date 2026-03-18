import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Package, Truck, Check, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/server';
import { formatDate, formatCurrency } from '@/lib/utils';

const statusSteps = ['pending', 'paid', 'processing', 'printing', 'shipped', 'delivered'];

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: order } = await supabase
    .from('cb_orders')
    .select('*, book:cb_books(title, page_count), print_partner:cb_print_partners(name, city, province, turnaround_days)')
    .eq('id', id)
    .eq('user_id', user!.id)
    .single();

  if (!order) notFound();

  const currentStepIndex = statusSteps.indexOf(order.status);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link href="/orders" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground cursor-pointer">
        <ArrowLeft className="h-4 w-4" /> Back to Orders
      </Link>

      <h1 className="text-3xl font-heading font-bold">Order Details</h1>

      {/* Status Timeline */}
      <Card>
        <CardHeader><CardTitle className="font-heading">Status</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            {statusSteps.map((step, i) => {
              const isActive = i <= currentStepIndex;
              const isCurrent = i === currentStepIndex;
              return (
                <div key={step} className="flex flex-col items-center gap-1 flex-1">
                  <div className={`rounded-full p-2 ${isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'} ${isCurrent ? 'ring-2 ring-primary ring-offset-2' : ''}`}>
                    {step === 'shipped' ? <Truck className="h-4 w-4" /> :
                     step === 'delivered' ? <Check className="h-4 w-4" /> :
                     step === 'printing' ? <Package className="h-4 w-4" /> :
                     <Clock className="h-4 w-4" />}
                  </div>
                  <span className={`text-xs capitalize ${isActive ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>{step}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Order Info */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="font-heading text-base">Book</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p>{order.book?.title}</p>
            <p className="text-muted-foreground">{order.book?.page_count} pages</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="font-heading text-base">Print Partner</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p>{order.print_partner?.name}</p>
            <p className="text-muted-foreground">{order.print_partner?.city}, {order.print_partner?.province}</p>
            <p className="text-muted-foreground">~{order.print_partner?.turnaround_days} day turnaround</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="font-heading text-base">Shipping</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p>{order.shipping_name}</p>
            <p>{order.shipping_address_line1}</p>
            {order.shipping_address_line2 && <p>{order.shipping_address_line2}</p>}
            <p>{order.shipping_city}, {order.shipping_province} {order.shipping_postal_code}</p>
            {order.tracking_number && (
              <p className="mt-2"><Badge variant="secondary">Tracking: {order.tracking_number}</Badge></p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="font-heading text-base">Payment</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p className="text-lg font-heading font-bold">{formatCurrency(order.amount_cents, order.currency)}</p>
            <p className="text-muted-foreground">Ordered {formatDate(order.created_at)}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

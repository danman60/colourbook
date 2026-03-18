'use client';

import { useState, useEffect } from 'react';
import { Loader2, ShoppingBag } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { getAllOrders, updateOrderStatus } from '@/lib/actions/orders';
import { formatDate, formatCurrency } from '@/lib/utils';
import type { Order, OrderStatus } from '@/types';
import { toast } from 'sonner';

const ALL_STATUSES: OrderStatus[] = ['pending', 'paid', 'processing', 'printing', 'shipped', 'delivered', 'cancelled'];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState<OrderStatus>('paid');
  const [trackingNumber, setTrackingNumber] = useState('');

  useEffect(() => { loadOrders(); }, [filter]);

  async function loadOrders() {
    setLoading(true);
    const { data } = await getAllOrders(filter !== 'all' ? filter as OrderStatus : undefined);
    if (data) setOrders(data);
    setLoading(false);
  }

  async function handleUpdateStatus() {
    if (!selectedOrder) return;
    const { error } = await updateOrderStatus(selectedOrder.id, newStatus, {
      tracking_number: trackingNumber || undefined,
    });
    if (error) { toast.error(error); return; }
    toast.success('Order updated');
    setSelectedOrder(null);
    setTrackingNumber('');
    loadOrders();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-heading font-bold">All Orders</h1>
        <Select value={filter} onValueChange={(v: string | null) => v !== null && setFilter(v)}>
          <SelectTrigger className="w-40 cursor-pointer"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="cursor-pointer">All</SelectItem>
            {ALL_STATUSES.map(s => <SelectItem key={s} value={s} className="cursor-pointer capitalize">{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20">
          <ShoppingBag className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No orders found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map(order => (
            <Card key={order.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => { setSelectedOrder(order); setNewStatus(order.status); }}>
              <CardContent className="flex items-center justify-between pt-6">
                <div>
                  <p className="font-medium">{order.shipping_name}</p>
                  <p className="text-sm text-muted-foreground">{order.book?.title} &middot; {formatDate(order.created_at)}</p>
                  <p className="text-xs text-muted-foreground">{order.shipping_city}, {order.shipping_province}</p>
                </div>
                <div className="text-right">
                  <p className="font-heading font-bold">{formatCurrency(order.amount_cents)}</p>
                  <Badge className="capitalize">{order.status}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!selectedOrder} onOpenChange={open => !open && setSelectedOrder(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-heading">Update Order</DialogTitle></DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="text-sm space-y-1">
                <p><span className="text-muted-foreground">Customer:</span> {selectedOrder.shipping_name}</p>
                <p><span className="text-muted-foreground">Book:</span> {selectedOrder.book?.title}</p>
                <p><span className="text-muted-foreground">Amount:</span> {formatCurrency(selectedOrder.amount_cents)}</p>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={newStatus} onValueChange={v => setNewStatus(v as OrderStatus)}>
                  <SelectTrigger className="cursor-pointer"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ALL_STATUSES.map(s => <SelectItem key={s} value={s} className="cursor-pointer capitalize">{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tracking Number (optional)</Label>
                <Input value={trackingNumber} onChange={e => setTrackingNumber(e.target.value)} placeholder="Enter tracking number" />
              </div>
              <Button onClick={handleUpdateStatus} className="w-full cursor-pointer">Update Order</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

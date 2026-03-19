'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, Printer, Package, Truck, Check, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { getPrintQueue, updatePrintQueueStatus } from '@/lib/actions/print-queue';
import { formatDateTime } from '@/lib/utils';
import type { PrintQueueItem, PrintStatus } from '@/types';
import { toast } from 'sonner';

const STATUS_CONFIG: Record<PrintStatus, { label: string; color: string; icon: typeof Printer }> = {
  queued: { label: 'Queued', color: 'bg-yellow-100 text-yellow-800', icon: Printer },
  printed: { label: 'Printed', color: 'bg-blue-100 text-blue-800', icon: Check },
  shipped: { label: 'Shipped', color: 'bg-purple-100 text-purple-800', icon: Truck },
  delivered: { label: 'Delivered', color: 'bg-green-100 text-green-800', icon: Package },
};

export default function PrintQueuePage() {
  const [items, setItems] = useState<PrintQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<PrintStatus | 'all'>('all');
  const [trackingInputs, setTrackingInputs] = useState<Record<string, string>>({});
  const [updating, setUpdating] = useState<string | null>(null);

  const load = useCallback(async () => {
    const statusFilter = filter === 'all' ? undefined : filter;
    const { data, error } = await getPrintQueue(statusFilter);
    if (error) {
      toast.error(error);
    } else {
      setItems(data || []);
    }
    setLoading(false);
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  async function handleStatusUpdate(id: string, status: PrintStatus, trackingNumber?: string) {
    setUpdating(id);
    const { error } = await updatePrintQueueStatus(id, status, trackingNumber);
    if (error) {
      toast.error(error);
    } else {
      toast.success(`Marked as ${status}`);
      load();
    }
    setUpdating(null);
  }

  async function handleBulkPrinted() {
    const queued = items.filter(i => i.status === 'queued');
    for (const item of queued) {
      await updatePrintQueueStatus(item.id, 'printed');
    }
    toast.success(`Marked ${queued.length} items as printed`);
    load();
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const queuedCount = items.filter(i => i.status === 'queued').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold">Print Queue</h1>
          <p className="text-muted-foreground">{items.length} items total, {queuedCount} queued</p>
        </div>
        {queuedCount > 0 && (
          <Button onClick={handleBulkPrinted} className="gap-2 cursor-pointer">
            <Printer className="h-4 w-4" />
            Mark All Queued as Printed ({queuedCount})
          </Button>
        )}
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {(['all', 'queued', 'printed', 'shipped', 'delivered'] as const).map(s => (
          <Button
            key={s}
            variant={filter === s ? 'default' : 'outline'}
            size="sm"
            onClick={() => { setFilter(s); setLoading(true); }}
            className="cursor-pointer capitalize"
          >
            {s}
          </Button>
        ))}
      </div>

      {items.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            No items in queue{filter !== 'all' ? ` with status "${filter}"` : ''}.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {items.map(item => {
            const config = STATUS_CONFIG[item.status];
            return (
              <Card key={item.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-heading font-bold">{item.book?.title || 'Book'}</h3>
                        <Badge className={config.color}>{config.label}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Order: {item.order_id.slice(0, 8)}... | User: {item.profile?.email || item.user_id.slice(0, 8)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Queued: {formatDateTime(item.created_at)}
                        {item.printed_at && ` | Printed: ${formatDateTime(item.printed_at)}`}
                        {item.shipped_at && ` | Shipped: ${formatDateTime(item.shipped_at)}`}
                      </p>
                      {item.tracking_number && (
                        <p className="text-sm">Tracking: <span className="font-mono">{item.tracking_number}</span></p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* PDF Download */}
                      <a href={item.pdf_url} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm" className="gap-1 cursor-pointer">
                          <Download className="h-3 w-3" /> PDF
                        </Button>
                      </a>

                      {/* Status Actions */}
                      {item.status === 'queued' && (
                        <Button
                          size="sm"
                          onClick={() => handleStatusUpdate(item.id, 'printed')}
                          disabled={updating === item.id}
                          className="gap-1 cursor-pointer"
                        >
                          {updating === item.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Printer className="h-3 w-3" />}
                          Mark Printed
                        </Button>
                      )}

                      {item.status === 'printed' && (
                        <div className="flex items-center gap-2">
                          <Input
                            placeholder="Tracking #"
                            value={trackingInputs[item.id] || ''}
                            onChange={e => setTrackingInputs(prev => ({ ...prev, [item.id]: e.target.value }))}
                            className="w-40 h-8"
                          />
                          <Button
                            size="sm"
                            onClick={() => handleStatusUpdate(item.id, 'shipped', trackingInputs[item.id])}
                            disabled={updating === item.id || !trackingInputs[item.id]}
                            className="gap-1 cursor-pointer"
                          >
                            {updating === item.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Truck className="h-3 w-3" />}
                            Ship
                          </Button>
                        </div>
                      )}

                      {item.status === 'shipped' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusUpdate(item.id, 'delivered')}
                          disabled={updating === item.id}
                          className="gap-1 cursor-pointer"
                        >
                          {updating === item.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Package className="h-3 w-3" />}
                          Delivered
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

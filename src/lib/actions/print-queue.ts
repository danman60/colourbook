'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/actions/admin';
import { revalidatePath } from 'next/cache';
import type { ActionResult, PrintQueueItem, PrintStatus } from '@/types';

export async function getPrintQueue(statusFilter?: PrintStatus): Promise<ActionResult<PrintQueueItem[]>> {
  const adminId = await requireAdmin();
  if (!adminId) return { data: null, error: 'Admin access required' };

  let query = (supabaseAdmin
    .from('cb_print_queue') as any)
    .select('*, order:cb_orders(*), book:cb_books(id, title, page_count), profile:cb_profiles(id, email, full_name)')
    .order('created_at', { ascending: true });

  if (statusFilter) {
    query = query.eq('status', statusFilter);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[getPrintQueue] error:', error.message);
    return { data: null, error: error.message };
  }

  return { data: data as PrintQueueItem[], error: null };
}

export async function updatePrintQueueStatus(
  id: string,
  status: PrintStatus,
  trackingNumber?: string
): Promise<ActionResult<null>> {
  const adminId = await requireAdmin();
  if (!adminId) return { data: null, error: 'Admin access required' };

  const updates: Record<string, unknown> = { status };

  if (status === 'printed') {
    updates.printed_at = new Date().toISOString();
  } else if (status === 'shipped') {
    updates.shipped_at = new Date().toISOString();
    if (trackingNumber) {
      updates.tracking_number = trackingNumber;
      // Also update the order's tracking number
      const { data: item } = await (supabaseAdmin
        .from('cb_print_queue') as any)
        .select('order_id')
        .eq('id', id)
        .single();

      if (item) {
        await (supabaseAdmin
          .from('cb_orders') as any)
          .update({
            tracking_number: trackingNumber,
            status: 'shipped',
            updated_at: new Date().toISOString(),
          })
          .eq('id', item.order_id);
      }
    }
  } else if (status === 'delivered') {
    // Update order status too
    const { data: item } = await (supabaseAdmin
      .from('cb_print_queue') as any)
      .select('order_id')
      .eq('id', id)
      .single();

    if (item) {
      await (supabaseAdmin
        .from('cb_orders') as any)
        .update({
          status: 'delivered',
          updated_at: new Date().toISOString(),
        })
        .eq('id', item.order_id);
    }
  }

  const { error } = await (supabaseAdmin
    .from('cb_print_queue') as any)
    .update(updates)
    .eq('id', id);

  if (error) {
    console.error('[updatePrintQueueStatus] error:', error.message);
    return { data: null, error: error.message };
  }

  revalidatePath('/admin/print-queue');
  revalidatePath('/admin/orders');
  return { data: null, error: null };
}

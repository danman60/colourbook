'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { ActionResult, Order, CreateOrder, OrderStatus } from '@/types';

export async function getOrders(): Promise<ActionResult<Order[]>> {
  console.log('[getOrders] called');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: 'Not authenticated' };

  const { data, error } = await supabase
    .from('cb_orders')
    .select('*, book:cb_books(*), print_partner:cb_print_partners(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[getOrders] error:', error.message);
    return { data: null, error: error.message };
  }

  console.log('[getOrders] found', data.length, 'orders');
  return { data: data as Order[], error: null };
}

export async function getOrder(id: string): Promise<ActionResult<Order>> {
  console.log('[getOrder] id:', id);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: 'Not authenticated' };

  const { data, error } = await supabase
    .from('cb_orders')
    .select('*, book:cb_books(*), print_partner:cb_print_partners(*)')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error) {
    console.error('[getOrder] error:', error.message);
    return { data: null, error: error.message };
  }

  return { data: data as Order, error: null };
}

export async function createOrder(input: CreateOrder): Promise<ActionResult<Order>> {
  console.log('[createOrder] called with:', JSON.stringify(input));
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: 'Not authenticated' };

  // Get print partner pricing
  const { data: partner } = await supabase
    .from('cb_print_partners')
    .select('*')
    .eq('id', input.print_partner_id)
    .single();

  if (!partner) return { data: null, error: 'Print partner not found' };

  // Get book page count for pricing
  const { data: book } = await supabase
    .from('cb_books')
    .select('page_count')
    .eq('id', input.book_id)
    .eq('user_id', user.id)
    .single();

  if (!book) return { data: null, error: 'Book not found' };
  if (book.page_count < 1) return { data: null, error: 'Book must have at least 1 page' };

  const baseCents = partner.price_per_book_cents;
  const extraPages = Math.max(0, book.page_count - 10); // 10 pages included
  const extraCents = extraPages * partner.price_per_extra_page_cents;
  const shippingCents = partner.shipping_flat_rate_cents;
  const totalCents = baseCents + extraCents + shippingCents;

  console.log('[createOrder] pricing:', { baseCents, extraCents, shippingCents, totalCents });

  const { data, error } = await supabase
    .from('cb_orders')
    .insert({
      user_id: user.id,
      book_id: input.book_id,
      print_partner_id: input.print_partner_id,
      status: 'pending' as OrderStatus,
      amount_cents: totalCents,
      currency: 'cad',
      shipping_name: input.shipping_name,
      shipping_address_line1: input.shipping_address_line1,
      shipping_address_line2: input.shipping_address_line2 || null,
      shipping_city: input.shipping_city,
      shipping_province: input.shipping_province,
      shipping_postal_code: input.shipping_postal_code,
      shipping_country: input.shipping_country || 'CA',
    })
    .select()
    .single();

  if (error) {
    console.error('[createOrder] error:', error.message);
    return { data: null, error: error.message };
  }

  // Update book status
  await supabase
    .from('cb_books')
    .update({ status: 'ordered', updated_at: new Date().toISOString() })
    .eq('id', input.book_id);

  console.log('[createOrder] success, id:', data.id, 'amount:', totalCents);
  revalidatePath('/orders');
  revalidatePath('/books');
  return { data: data as Order, error: null };
}

export async function updateOrderStatus(id: string, status: OrderStatus, extra?: { tracking_number?: string; notes?: string }): Promise<ActionResult<Order>> {
  console.log('[updateOrderStatus] id:', id, 'status:', status);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('cb_orders')
    .update({
      status,
      ...extra,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[updateOrderStatus] error:', error.message);
    return { data: null, error: error.message };
  }

  revalidatePath('/orders');
  revalidatePath(`/orders/${id}`);
  revalidatePath('/admin/orders');
  return { data: data as Order, error: null };
}

// Admin: get all orders
export async function getAllOrders(statusFilter?: OrderStatus): Promise<ActionResult<Order[]>> {
  console.log('[getAllOrders] statusFilter:', statusFilter);
  const supabase = await createClient();

  let query = supabase
    .from('cb_orders')
    .select('*, book:cb_books(*), print_partner:cb_print_partners(*)')
    .order('created_at', { ascending: false });

  if (statusFilter) {
    query = query.eq('status', statusFilter);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[getAllOrders] error:', error.message);
    return { data: null, error: error.message };
  }

  return { data: data as Order[], error: null };
}

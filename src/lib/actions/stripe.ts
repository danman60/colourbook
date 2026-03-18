'use server';

import { getStripe } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';
import type { ActionResult } from '@/types';

export async function createCheckoutSession(orderId: string): Promise<ActionResult<{ url: string }>> {
  console.log('[createCheckoutSession] orderId:', orderId);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: 'Not authenticated' };

  // Get order with book details
  const { data: order } = await supabase
    .from('cb_orders')
    .select('*, book:cb_books(title, page_count)')
    .eq('id', orderId)
    .eq('user_id', user.id)
    .single();

  if (!order) return { data: null, error: 'Order not found' };

  const stripe = getStripe();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    currency: order.currency,
    line_items: [
      {
        price_data: {
          currency: order.currency,
          unit_amount: order.amount_cents,
          product_data: {
            name: `Colourbook: ${order.book?.title || 'Custom Coloring Book'}`,
            description: `${order.book?.page_count || 0} page custom coloring book — printed and bound`,
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      order_id: orderId,
      user_id: user.id,
    },
    success_url: `${appUrl}/orders/${orderId}?payment=success`,
    cancel_url: `${appUrl}/orders/${orderId}?payment=cancelled`,
  });

  // Save checkout session ID
  await supabase
    .from('cb_orders')
    .update({ stripe_checkout_session_id: session.id })
    .eq('id', orderId);

  console.log('[createCheckoutSession] session created:', session.id);
  return { data: { url: session.url! }, error: null };
}

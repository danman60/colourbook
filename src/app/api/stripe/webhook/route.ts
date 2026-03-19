import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { addCredits } from '@/lib/actions/credits';
import type Stripe from 'stripe';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  if (!sig) {
    console.error('[stripe/webhook] missing signature');
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  const stripe = getStripe();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[stripe/webhook] signature verification failed:', message);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  console.log('[stripe/webhook] event:', event.type);

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

    // Check if this is a credit purchase
    if (session.metadata?.type === 'credit_purchase') {
      const userId = session.metadata.user_id;
      const credits = parseInt(session.metadata.credits, 10);
      const priceCents = parseInt(session.metadata.price_cents, 10);
      const packId = session.metadata.pack_id;

      console.log('[stripe/webhook] credit purchase:', { userId, credits, priceCents, packId });

      await addCredits(userId, 'purchase', credits, priceCents, {
        stripe_session_id: session.id,
        stripe_payment_intent: session.payment_intent,
        pack_id: packId,
      });

      console.log('[stripe/webhook] credits added successfully');
    } else {
      // Legacy: physical book order payment
      const orderId = session.metadata?.order_id;

      if (orderId) {
        console.log('[stripe/webhook] payment complete for order:', orderId);

        await (supabaseAdmin
          .from('cb_orders') as any)
          .update({
            status: 'paid',
            stripe_payment_intent_id: session.payment_intent as string,
            stripe_checkout_session_id: session.id,
            updated_at: new Date().toISOString(),
          })
          .eq('id', orderId);
      }
    }
  } else if (event.type === 'checkout.session.expired') {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.order_id;

    if (orderId) {
      console.log('[stripe/webhook] checkout expired for order:', orderId);

      await (supabaseAdmin
        .from('cb_orders') as any)
        .update({
          status: 'cancelled',
          notes: 'Payment session expired',
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId)
        .eq('status', 'pending'); // Only cancel if still pending
    }
  }

  return NextResponse.json({ received: true });
}

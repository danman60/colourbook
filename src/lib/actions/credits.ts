'use server';

import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/actions/admin';
import { getStripe } from '@/lib/stripe';
import { revalidatePath } from 'next/cache';
import type { ActionResult, CreditAction, CreditTransaction, CreditPack } from '@/types';

export async function getCreditBalance(userId?: string): Promise<ActionResult<number>> {
  const supabase = await createClient();

  if (!userId) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: 'Not authenticated' };
    userId = user.id;
  }

  const { data: profile, error } = await supabase
    .from('cb_profiles')
    .select('generation_credits')
    .eq('id', userId)
    .single();

  if (error || !profile) return { data: null, error: error?.message || 'Profile not found' };
  return { data: profile.generation_credits, error: null };
}

export async function getCreditHistory(userId?: string): Promise<ActionResult<CreditTransaction[]>> {
  const supabase = await createClient();

  if (!userId) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: 'Not authenticated' };
    userId = user.id;
  }

  const { data, error } = await supabase
    .from('cb_credit_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) return { data: null, error: error.message };
  return { data: data as CreditTransaction[], error: null };
}

export async function getCreditPacks(): Promise<ActionResult<CreditPack[]>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('cb_credit_packs')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');

  if (error) return { data: null, error: error.message };
  return { data: data as CreditPack[], error: null };
}

/**
 * Atomic credit spend: deducts credits, logs transaction, returns updated balance.
 * Credits param should be positive (will be stored as negative).
 */
export async function spendCredits(
  userId: string,
  action: CreditAction,
  credits: number,
  referenceId?: string,
  costCents?: number
): Promise<ActionResult<{ balanceAfter: number }>> {
  console.log('[spendCredits]', { userId, action, credits, referenceId, costCents });

  // Get current balance using admin client for atomic operation
  const { data: profile, error: profileErr } = await (supabaseAdmin
    .from('cb_profiles') as any)
    .select('generation_credits')
    .eq('id', userId)
    .single();

  if (profileErr || !profile) {
    return { data: null, error: 'Failed to get user profile' };
  }

  if (profile.generation_credits < credits) {
    return { data: null, error: `Not enough credits. Need ${credits}, have ${profile.generation_credits}.` };
  }

  const newBalance = profile.generation_credits - credits;

  // Deduct credits
  const { error: updateErr } = await (supabaseAdmin
    .from('cb_profiles') as any)
    .update({ generation_credits: newBalance })
    .eq('id', userId);

  if (updateErr) {
    console.error('[spendCredits] update error:', updateErr.message);
    return { data: null, error: 'Failed to deduct credits' };
  }

  // Log transaction
  const { error: txnErr } = await (supabaseAdmin
    .from('cb_credit_transactions') as any)
    .insert({
      user_id: userId,
      action,
      credits: -credits,
      balance_after: newBalance,
      reference_id: referenceId || null,
      cost_cents: costCents ?? 0,
      revenue_cents: 0,
    });

  if (txnErr) {
    console.error('[spendCredits] transaction log error:', txnErr.message);
    // Credits already deducted — log failure but don't fail the operation
  }

  console.log('[spendCredits] success, new balance:', newBalance);
  return { data: { balanceAfter: newBalance }, error: null };
}

/**
 * Add credits to a user (for purchases or admin grants).
 */
export async function addCredits(
  userId: string,
  action: CreditAction,
  credits: number,
  revenueCents: number = 0,
  metadata: Record<string, unknown> = {}
): Promise<ActionResult<{ balanceAfter: number }>> {
  console.log('[addCredits]', { userId, action, credits, revenueCents });

  const { data: profile, error: profileErr } = await (supabaseAdmin
    .from('cb_profiles') as any)
    .select('generation_credits')
    .eq('id', userId)
    .single();

  if (profileErr || !profile) {
    return { data: null, error: 'Failed to get user profile' };
  }

  const newBalance = profile.generation_credits + credits;

  const { error: updateErr } = await (supabaseAdmin
    .from('cb_profiles') as any)
    .update({ generation_credits: newBalance })
    .eq('id', userId);

  if (updateErr) {
    return { data: null, error: 'Failed to add credits' };
  }

  await (supabaseAdmin
    .from('cb_credit_transactions') as any)
    .insert({
      user_id: userId,
      action,
      credits: credits,
      balance_after: newBalance,
      revenue_cents: revenueCents,
      cost_cents: 0,
      metadata,
    });

  console.log('[addCredits] success, new balance:', newBalance);
  return { data: { balanceAfter: newBalance }, error: null };
}

/**
 * Admin: grant credits to a user.
 */
export async function grantCredits(userId: string, amount: number, reason: string): Promise<ActionResult<{ balanceAfter: number }>> {
  const adminId = await requireAdmin();
  if (!adminId) return { data: null, error: 'Admin access required' };

  return addCredits(userId, 'grant', amount, 0, { reason, granted_by: adminId });
}

/**
 * Purchase credits: creates a Stripe checkout session for a credit pack.
 */
export async function purchaseCredits(packId: string): Promise<ActionResult<{ url: string }>> {
  console.log('[purchaseCredits] packId:', packId);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: 'Not authenticated' };

  const { data: pack } = await supabase
    .from('cb_credit_packs')
    .select('*')
    .eq('id', packId)
    .eq('is_active', true)
    .single();

  if (!pack) return { data: null, error: 'Credit pack not found' };

  const stripe = getStripe();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    currency: pack.currency,
    line_items: [
      {
        price_data: {
          currency: pack.currency,
          unit_amount: pack.price_cents,
          product_data: {
            name: `${pack.name} Credit Pack`,
            description: `${pack.credits} Colourbook credits`,
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      type: 'credit_purchase',
      pack_id: packId,
      user_id: user.id,
      credits: String(pack.credits),
      price_cents: String(pack.price_cents),
    },
    success_url: `${appUrl}/credits?purchase=success`,
    cancel_url: `${appUrl}/credits?purchase=cancelled`,
  });

  console.log('[purchaseCredits] session created:', session.id);
  return { data: { url: session.url! }, error: null };
}

/**
 * Admin: get customer profitability data.
 */
export async function getCustomerProfitability(): Promise<ActionResult<Array<{
  user_id: string;
  email: string;
  full_name: string | null;
  total_revenue: number;
  total_cost: number;
  profit: number;
  generations: number;
  downloads: number;
  prints: number;
  total_transactions: number;
}>>> {
  const adminId = await requireAdmin();
  if (!adminId) return { data: null, error: 'Admin access required' };

  const { data, error } = await (supabaseAdmin as any).rpc('exec_sql', {
    query: `
      SELECT
        t.user_id,
        p.email,
        p.full_name,
        COALESCE(SUM(t.revenue_cents), 0)::int as total_revenue,
        COALESCE(SUM(t.cost_cents), 0)::int as total_cost,
        (COALESCE(SUM(t.revenue_cents), 0) - COALESCE(SUM(t.cost_cents), 0))::int as profit,
        COUNT(*) FILTER (WHERE t.action IN ('generate_page', 'regenerate_page'))::int as generations,
        COUNT(*) FILTER (WHERE t.action = 'download_pdf')::int as downloads,
        COUNT(*) FILTER (WHERE t.action = 'print_ship')::int as prints,
        COUNT(*)::int as total_transactions
      FROM cb_credit_transactions t
      JOIN cb_profiles p ON p.id = t.user_id
      GROUP BY t.user_id, p.email, p.full_name
      ORDER BY total_revenue DESC
    `
  });

  // Fallback: query separately if RPC not available
  if (error) {
    console.log('[getCustomerProfitability] RPC failed, using direct queries');

    const { data: txns } = await (supabaseAdmin
      .from('cb_credit_transactions') as any)
      .select('user_id, action, revenue_cents, cost_cents');

    const { data: profiles } = await (supabaseAdmin
      .from('cb_profiles') as any)
      .select('id, email, full_name');

    if (!txns || !profiles) return { data: null, error: 'Failed to fetch data' };

    const profileMap = new Map(profiles.map((p: any) => [p.id, p]));
    const userMap = new Map<string, any>();

    for (const txn of txns) {
      if (!userMap.has(txn.user_id)) {
        const prof: any = profileMap.get(txn.user_id);
        userMap.set(txn.user_id, {
          user_id: txn.user_id,
          email: prof?.email || 'unknown',
          full_name: prof?.full_name || null,
          total_revenue: 0,
          total_cost: 0,
          profit: 0,
          generations: 0,
          downloads: 0,
          prints: 0,
          total_transactions: 0,
        });
      }
      const u = userMap.get(txn.user_id);
      u.total_revenue += txn.revenue_cents || 0;
      u.total_cost += txn.cost_cents || 0;
      u.profit = u.total_revenue - u.total_cost;
      u.total_transactions++;
      if (txn.action === 'generate_page' || txn.action === 'regenerate_page') u.generations++;
      if (txn.action === 'download_pdf') u.downloads++;
      if (txn.action === 'print_ship') u.prints++;
    }

    return { data: Array.from(userMap.values()).sort((a, b) => b.total_revenue - a.total_revenue), error: null };
  }

  return { data: data || [], error: null };
}

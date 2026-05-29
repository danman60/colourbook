'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { spendCredits } from '@/lib/actions/credits';
import { CREDIT_COSTS } from '@/lib/credit-costs';
import type { ActionResult, Page, CreatePage } from '@/types';

export async function getPages(): Promise<ActionResult<Page[]>> {
  console.log('[getPages] called');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: 'Not authenticated' };

  const { data, error } = await supabase
    .from('cb_pages')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[getPages] error:', error.message);
    return { data: null, error: error.message };
  }

  console.log('[getPages] found', data.length, 'pages');
  return { data: data as Page[], error: null };
}

export async function getPage(id: string): Promise<ActionResult<Page>> {
  console.log('[getPage] id:', id);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: 'Not authenticated' };

  const { data, error } = await supabase
    .from('cb_pages')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error) {
    console.error('[getPage] error:', error.message);
    return { data: null, error: error.message };
  }

  return { data: data as Page, error: null };
}

export async function generatePage(input: CreatePage): Promise<ActionResult<Page>> {
  console.log('[generatePage] called with:', JSON.stringify(input));
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: 'Not authenticated' };

  // Create page record with pending status
  const { data: page, error: insertError } = await supabase
    .from('cb_pages')
    .insert({
      user_id: user.id,
      prompt: input.prompt,
      family_member_id: input.family_member_id || null,
      original_image_url: input.original_image_url || null,
      generation_status: 'pending',
    })
    .select()
    .single();

  if (insertError) {
    console.error('[generatePage] insert error:', insertError.message);
    return { data: null, error: insertError.message };
  }

  // Deduct credit via credits system
  const cost = CREDIT_COSTS.generate_page;
  const { error: creditErr } = await spendCredits(user.id, 'generate_page', cost.credits, page.id, cost.costCents);
  if (creditErr) {
    // Rollback: delete the page we just created
    await supabase.from('cb_pages').delete().eq('id', page.id);
    return { data: null, error: creditErr };
  }

  console.log('[generatePage] page created, id:', page.id);

  // NOTE: generation is triggered from the BROWSER (see the /generate client
  // page) so the request to /api/generate carries the user's session cookie.
  // A server-to-server fetch from here is unauthenticated → /api/generate 401s
  // and the page would be stuck 'pending' with the credit already spent.

  revalidatePath('/gallery');
  revalidatePath('/dashboard');
  return { data: page as Page, error: null };
}

export async function deletePage(id: string): Promise<ActionResult<null>> {
  console.log('[deletePage] id:', id);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: 'Not authenticated' };

  // Remove from any books first
  await supabase.from('cb_book_pages').delete().eq('page_id', id);

  const { error } = await supabase
    .from('cb_pages')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    console.error('[deletePage] error:', error.message);
    return { data: null, error: error.message };
  }

  console.log('[deletePage] success');
  revalidatePath('/gallery');
  return { data: null, error: null };
}

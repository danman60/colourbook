'use server';

import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/actions/admin';
import { revalidatePath } from 'next/cache';
import type { ActionResult, PromptSuggestion, CreatePromptSuggestion } from '@/types';

export async function getPromptSuggestions(): Promise<ActionResult<PromptSuggestion[]>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('cb_prompt_suggestions')
    .select('*')
    .eq('is_active', true)
    .order('category', { ascending: true })
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('[getPromptSuggestions] error:', error.message);
    return { data: null, error: error.message };
  }

  return { data: data as PromptSuggestion[], error: null };
}

export async function getRandomSuggestions(count = 6): Promise<ActionResult<PromptSuggestion[]>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('cb_prompt_suggestions')
    .select('*')
    .eq('is_active', true);

  if (error) {
    console.error('[getRandomSuggestions] error:', error.message);
    return { data: null, error: error.message };
  }

  // Fisher-Yates shuffle and take first N
  const shuffled = [...(data || [])];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return { data: shuffled.slice(0, count) as PromptSuggestion[], error: null };
}

// Admin: create suggestion (uses admin client to bypass RLS)
export async function createSuggestion(input: CreatePromptSuggestion): Promise<ActionResult<PromptSuggestion>> {
  console.log('[createSuggestion] called:', JSON.stringify(input));
  const adminId = await requireAdmin();
  if (!adminId) return { data: null, error: 'Admin access required' };

  const { data, error } = await (supabaseAdmin
    .from('cb_prompt_suggestions') as any)
    .insert({ ...input, is_active: true })
    .select()
    .single();

  if (error) {
    console.error('[createSuggestion] error:', error.message);
    return { data: null, error: error.message };
  }

  revalidatePath('/admin/prompts');
  return { data: data as PromptSuggestion, error: null };
}

// Admin: update suggestion (uses admin client to bypass RLS)
export async function updateSuggestion(id: string, updates: Partial<PromptSuggestion>): Promise<ActionResult<PromptSuggestion>> {
  const adminId = await requireAdmin();
  if (!adminId) return { data: null, error: 'Admin access required' };

  const { data, error } = await (supabaseAdmin
    .from('cb_prompt_suggestions') as any)
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return { data: null, error: error.message };

  revalidatePath('/admin/prompts');
  return { data: data as PromptSuggestion, error: null };
}

// Admin: delete suggestion (uses admin client to bypass RLS)
export async function deleteSuggestion(id: string): Promise<ActionResult<null>> {
  const adminId = await requireAdmin();
  if (!adminId) return { data: null, error: 'Admin access required' };

  const { error } = await (supabaseAdmin
    .from('cb_prompt_suggestions') as any).delete().eq('id', id);
  if (error) return { data: null, error: error.message };
  revalidatePath('/admin/prompts');
  return { data: null, error: null };
}

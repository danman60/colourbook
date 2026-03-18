'use server';

import { createClient } from '@/lib/supabase/server';
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

  // Fetch all active, then randomly sample client-side
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

export async function createSuggestion(input: CreatePromptSuggestion): Promise<ActionResult<PromptSuggestion>> {
  console.log('[createSuggestion] called:', JSON.stringify(input));
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('cb_prompt_suggestions')
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

export async function updateSuggestion(id: string, updates: Partial<PromptSuggestion>): Promise<ActionResult<PromptSuggestion>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('cb_prompt_suggestions')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return { data: null, error: error.message };

  revalidatePath('/admin/prompts');
  return { data: data as PromptSuggestion, error: null };
}

export async function deleteSuggestion(id: string): Promise<ActionResult<null>> {
  const supabase = await createClient();
  const { error } = await supabase.from('cb_prompt_suggestions').delete().eq('id', id);
  if (error) return { data: null, error: error.message };
  revalidatePath('/admin/prompts');
  return { data: null, error: null };
}

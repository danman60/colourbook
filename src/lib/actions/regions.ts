'use server';

import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/actions/admin';
import { revalidatePath } from 'next/cache';
import type { ActionResult, Region, CreateRegion } from '@/types';

export async function getRegions(activeOnly = true): Promise<ActionResult<Region[]>> {
  console.log('[getRegions] activeOnly:', activeOnly);
  const supabase = await createClient();

  let query = supabase
    .from('cb_regions')
    .select('*')
    .order('name', { ascending: true });

  if (activeOnly) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[getRegions] error:', error.message);
    return { data: null, error: error.message };
  }

  return { data: data as Region[], error: null };
}

export async function getRegion(id: string): Promise<ActionResult<Region>> {
  const supabase = await createClient();
  const { data, error } = await supabase.from('cb_regions').select('*').eq('id', id).single();
  if (error) return { data: null, error: error.message };
  return { data: data as Region, error: null };
}

// Admin: create region (uses admin client to bypass RLS)
export async function createRegion(input: CreateRegion): Promise<ActionResult<Region>> {
  console.log('[createRegion] called:', JSON.stringify(input));
  const adminId = await requireAdmin();
  if (!adminId) return { data: null, error: 'Admin access required' };

  const { data, error } = await (supabaseAdmin
    .from('cb_regions') as any)
    .insert({ ...input, is_active: true })
    .select()
    .single();

  if (error) {
    console.error('[createRegion] error:', error.message);
    return { data: null, error: error.message };
  }

  revalidatePath('/admin/regions');
  return { data: data as Region, error: null };
}

// Admin: update region (uses admin client to bypass RLS)
export async function updateRegion(id: string, updates: Partial<Region>): Promise<ActionResult<Region>> {
  console.log('[updateRegion] id:', id);
  const adminId = await requireAdmin();
  if (!adminId) return { data: null, error: 'Admin access required' };

  const { data, error } = await (supabaseAdmin
    .from('cb_regions') as any)
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[updateRegion] error:', error.message);
    return { data: null, error: error.message };
  }

  revalidatePath('/admin/regions');
  return { data: data as Region, error: null };
}

'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { ActionResult, PrintPartner, CreatePrintPartner, UpdatePrintPartner } from '@/types';

export async function getPrintPartners(activeOnly = true): Promise<ActionResult<PrintPartner[]>> {
  console.log('[getPrintPartners] activeOnly:', activeOnly);
  const supabase = await createClient();

  let query = supabase
    .from('cb_print_partners')
    .select('*, region:cb_regions(*)')
    .order('name', { ascending: true });

  if (activeOnly) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[getPrintPartners] error:', error.message);
    return { data: null, error: error.message };
  }

  return { data: data as PrintPartner[], error: null };
}

export async function getPrintPartner(id: string): Promise<ActionResult<PrintPartner>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('cb_print_partners')
    .select('*, region:cb_regions(*)')
    .eq('id', id)
    .single();

  if (error) return { data: null, error: error.message };
  return { data: data as PrintPartner, error: null };
}

export async function createPrintPartner(input: CreatePrintPartner): Promise<ActionResult<PrintPartner>> {
  console.log('[createPrintPartner] called');
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('cb_print_partners')
    .insert(input)
    .select('*, region:cb_regions(*)')
    .single();

  if (error) {
    console.error('[createPrintPartner] error:', error.message);
    return { data: null, error: error.message };
  }

  revalidatePath('/admin/print-partners');
  return { data: data as PrintPartner, error: null };
}

export async function updatePrintPartner(id: string, updates: UpdatePrintPartner): Promise<ActionResult<PrintPartner>> {
  console.log('[updatePrintPartner] id:', id);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('cb_print_partners')
    .update(updates)
    .eq('id', id)
    .select('*, region:cb_regions(*)')
    .single();

  if (error) {
    console.error('[updatePrintPartner] error:', error.message);
    return { data: null, error: error.message };
  }

  revalidatePath('/admin/print-partners');
  return { data: data as PrintPartner, error: null };
}

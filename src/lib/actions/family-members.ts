'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { ActionResult, FamilyMember, CreateFamilyMember, UpdateFamilyMember } from '@/types';

export async function getFamilyMembers(): Promise<ActionResult<FamilyMember[]>> {
  console.log('[getFamilyMembers] called');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: 'Not authenticated' };

  const { data, error } = await supabase
    .from('cb_family_members')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[getFamilyMembers] error:', error.message);
    return { data: null, error: error.message };
  }

  console.log('[getFamilyMembers] found', data.length, 'members');
  return { data: data as FamilyMember[], error: null };
}

export async function getFamilyMember(id: string): Promise<ActionResult<FamilyMember>> {
  console.log('[getFamilyMember] id:', id);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: 'Not authenticated' };

  const { data, error } = await supabase
    .from('cb_family_members')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error) {
    console.error('[getFamilyMember] error:', error.message);
    return { data: null, error: error.message };
  }

  return { data: data as FamilyMember, error: null };
}

export async function createFamilyMember(input: CreateFamilyMember): Promise<ActionResult<FamilyMember>> {
  console.log('[createFamilyMember] called with:', JSON.stringify(input));
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: 'Not authenticated' };

  const { data, error } = await supabase
    .from('cb_family_members')
    .insert({ ...input, user_id: user.id })
    .select()
    .single();

  if (error) {
    console.error('[createFamilyMember] error:', error.message);
    return { data: null, error: error.message };
  }

  console.log('[createFamilyMember] success, id:', data.id);
  revalidatePath('/family');
  revalidatePath('/dashboard');
  return { data: data as FamilyMember, error: null };
}

export async function updateFamilyMember(id: string, updates: UpdateFamilyMember): Promise<ActionResult<FamilyMember>> {
  console.log('[updateFamilyMember] id:', id, 'updates:', JSON.stringify(updates));
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: 'Not authenticated' };

  const { data, error } = await supabase
    .from('cb_family_members')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    console.error('[updateFamilyMember] error:', error.message);
    return { data: null, error: error.message };
  }

  revalidatePath('/family');
  return { data: data as FamilyMember, error: null };
}

export async function deleteFamilyMember(id: string): Promise<ActionResult<null>> {
  console.log('[deleteFamilyMember] id:', id);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: 'Not authenticated' };

  const { error } = await supabase
    .from('cb_family_members')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    console.error('[deleteFamilyMember] error:', error.message);
    return { data: null, error: error.message };
  }

  console.log('[deleteFamilyMember] success');
  revalidatePath('/family');
  revalidatePath('/dashboard');
  return { data: null, error: null };
}

'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { ActionResult, Profile } from '@/types';

export async function getProfile(): Promise<ActionResult<Profile>> {
  console.log('[getProfile] called');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    console.log('[getProfile] no authenticated user');
    return { data: null, error: 'Not authenticated' };
  }

  const { data, error } = await supabase
    .from('cb_profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) {
    console.error('[getProfile] error:', error.message);
    return { data: null, error: error.message };
  }

  console.log('[getProfile] success, role:', data.role);
  return { data: data as Profile, error: null };
}

export async function updateProfile(updates: { full_name?: string; avatar_url?: string }): Promise<ActionResult<Profile>> {
  console.log('[updateProfile] called with:', JSON.stringify(updates));
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { data: null, error: 'Not authenticated' };

  const { data, error } = await supabase
    .from('cb_profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', user.id)
    .select()
    .single();

  if (error) {
    console.error('[updateProfile] error:', error.message);
    return { data: null, error: error.message };
  }

  console.log('[updateProfile] success');
  revalidatePath('/dashboard');
  return { data: data as Profile, error: null };
}

'use server';

import { createClient } from '@/lib/supabase/server';

/**
 * Verify the current user is an admin. Call at the top of every admin action.
 * Returns the user id on success, null on failure.
 */
export async function requireAdmin(): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('cb_profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') return null;
  return user.id;
}

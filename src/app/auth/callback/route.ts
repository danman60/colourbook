import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const redirect = searchParams.get('redirect') || '/dashboard';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('[auth/callback] code exchange error:', error.message);
      return NextResponse.redirect(`${origin}/login?error=auth_failed`);
    }

    console.log('[auth/callback] success, redirecting to:', redirect);
    return NextResponse.redirect(`${origin}${redirect}`);
  }

  console.error('[auth/callback] no code in query params');
  return NextResponse.redirect(`${origin}/login?error=no_code`);
}

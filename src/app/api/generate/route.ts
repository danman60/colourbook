import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateColoringPage } from '@/lib/actions/openai';

// gpt-image-1 generation + storage upload runs ~15-40s — beyond the default limit.
export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    let body: { pageId?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    const { pageId } = body;

    if (!pageId) {
      return NextResponse.json({ error: 'Missing pageId' }, { status: 400 });
    }

    // Authenticate from session — never trust client-supplied userId
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.error('[api/generate] unauthenticated request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify the page belongs to this user
    const { data: page } = await supabase
      .from('cb_pages')
      .select('id')
      .eq('id', pageId)
      .eq('user_id', user.id)
      .single();

    if (!page) {
      console.error('[api/generate] page not found or not owned by user');
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    console.log('[api/generate] pageId:', pageId, 'userId:', user.id);
    const result = await generateColoringPage(pageId, user.id);

    if (result.error) {
      console.error('[api/generate] generation failed:', result.error);
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, imageUrl: result.data?.imageUrl });
  } catch (error) {
    console.error('[api/generate] unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

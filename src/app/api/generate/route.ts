import { NextRequest, NextResponse } from 'next/server';
import { generateColoringPage } from '@/lib/actions/openai';

export async function POST(request: NextRequest) {
  try {
    const { pageId, userId } = await request.json();
    console.log('[api/generate] pageId:', pageId, 'userId:', userId);

    if (!pageId || !userId) {
      return NextResponse.json({ error: 'Missing pageId or userId' }, { status: 400 });
    }

    const result = await generateColoringPage(pageId, userId);

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

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { spendCredits } from '@/lib/actions/credits';
import { CREDIT_COSTS } from '@/lib/credit-costs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookId: string }> }
) {
  const { bookId } = await params;
  console.log('[download] bookId:', bookId);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  // Verify book ownership and get pages
  const { data: book } = await supabase
    .from('cb_books')
    .select('*, book_pages:cb_book_pages(*, page:cb_pages(*))')
    .eq('id', bookId)
    .eq('user_id', user.id)
    .single();

  if (!book) {
    return NextResponse.json({ error: 'Book not found' }, { status: 404 });
  }

  const pages = (book.book_pages || [])
    .sort((a: any, b: any) => a.page_order - b.page_order)
    .map((bp: any) => bp.page)
    .filter((p: any) => p?.coloring_page_url);

  if (pages.length === 0) {
    return NextResponse.json({ error: 'Book has no completed pages' }, { status: 400 });
  }

  // Spend credits
  const cost = CREDIT_COSTS.download_pdf;
  const { error: creditErr } = await spendCredits(
    user.id,
    'download_pdf',
    cost.credits,
    bookId,
    cost.costCents
  );

  if (creditErr) {
    return NextResponse.json({ error: creditErr }, { status: 402 });
  }

  // Fetch all images and build a simple HTML-based printable document
  // For a production app, you'd use pdf-lib here. This returns image URLs
  // that the client can use to generate a PDF client-side.
  const imageUrls = pages.map((p: any) => p.coloring_page_url);

  return NextResponse.json({
    title: book.title,
    pages: imageUrls,
    pageCount: imageUrls.length,
  });
}

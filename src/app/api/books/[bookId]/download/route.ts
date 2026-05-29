import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';
import { createClient } from '@/lib/supabase/server';
import { spendCredits } from '@/lib/actions/credits';
import { CREDIT_COSTS } from '@/lib/credit-costs';

// PDF compilation fetches + embeds N images — allow headroom over the default.
export const runtime = 'nodejs';
export const maxDuration = 60;

const LETTER_WIDTH = 612; // US Letter portrait, points (8.5in)
const LETTER_HEIGHT = 792; // 11in
const MARGIN = 36; // 0.5in

function isPng(bytes: Uint8Array): boolean {
  return bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
}

function isJpg(bytes: Uint8Array): boolean {
  return bytes[0] === 0xff && bytes[1] === 0xd8;
}

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'colouring-book'
  );
}

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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pages = (book.book_pages || [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .sort((a: any, b: any) => a.page_order - b.page_order)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((bp: any) => bp.page)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((p: any) => p?.coloring_page_url);

  if (pages.length === 0) {
    return NextResponse.json({ error: 'Book has no completed pages' }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const imageUrls: string[] = pages.map((p: any) => p.coloring_page_url);

  // Build the PDF BEFORE charging — a build failure must not cost credits.
  let pdfBytes: Uint8Array;
  try {
    const pdf = await PDFDocument.create();
    pdf.setTitle(book.title || 'Colouring Book');

    for (const url of imageUrls) {
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Failed to fetch page image (${res.status})`);
      }
      const bytes = new Uint8Array(await res.arrayBuffer());

      const image = isPng(bytes)
        ? await pdf.embedPng(bytes)
        : isJpg(bytes)
          ? await pdf.embedJpg(bytes)
          : null;
      if (!image) {
        throw new Error('Unsupported page image format (expected PNG or JPEG)');
      }

      const page = pdf.addPage([LETTER_WIDTH, LETTER_HEIGHT]);
      const maxW = LETTER_WIDTH - MARGIN * 2;
      const maxH = LETTER_HEIGHT - MARGIN * 2;
      const scale = Math.min(maxW / image.width, maxH / image.height);
      const w = image.width * scale;
      const h = image.height * scale;
      page.drawImage(image, {
        x: (LETTER_WIDTH - w) / 2,
        y: (LETTER_HEIGHT - h) / 2,
        width: w,
        height: h,
      });
    }

    pdfBytes = await pdf.save();
  } catch (err) {
    console.error('[download] PDF compilation failed:', err);
    return NextResponse.json(
      { error: 'Failed to compile PDF', detail: String(err) },
      { status: 502 }
    );
  }

  // Charge credits only after a successful build. If the user lacks credits,
  // the (already-built) PDF is discarded — they are never billed for nothing
  // and never receive a PDF without paying.
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

  const filename = `${slugify(book.title || 'colouring-book')}.pdf`;

  return new NextResponse(Buffer.from(pdfBytes), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': String(pdfBytes.length),
    },
  });
}

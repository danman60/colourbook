'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ChevronLeft, ChevronRight, ShoppingBag, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { getBook } from '@/lib/actions/books';
import { getBookPages } from '@/lib/actions/book-pages';
import type { Book, BookPage } from '@/types';

export default function BookPreviewPage() {
  const params = useParams();
  const bookId = params.id as string;
  const [book, setBook] = useState<Book | null>(null);
  const [pages, setPages] = useState<BookPage[]>([]);
  const [currentPage, setCurrentPage] = useState(0);

  const load = useCallback(async () => {
    const [bookRes, pagesRes] = await Promise.all([getBook(bookId), getBookPages(bookId)]);
    if (bookRes.data) setBook(bookRes.data);
    if (pagesRes.data) setPages(pagesRes.data);
  }, [bookId]);

  useEffect(() => { load(); }, [load]);

  if (!book || pages.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Loading preview...</p>
      </div>
    );
  }

  const page = pages[currentPage];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link href={`/books/${bookId}`} className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground cursor-pointer">
        <ArrowLeft className="h-4 w-4" /> Back to Book
      </Link>

      <div className="text-center">
        <h1 className="text-2xl font-heading font-bold">{book.title}</h1>
        <p className="text-muted-foreground">Page {currentPage + 1} of {pages.length}</p>
      </div>

      <Card className="overflow-hidden">
        {page.page?.coloring_page_url ? (
          <img src={page.page.coloring_page_url} alt={page.page.prompt || ''} className="w-full" />
        ) : (
          <div className="w-full aspect-square bg-muted flex items-center justify-center">
            <Image className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
      </Card>

      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => setCurrentPage(p => Math.max(0, p - 1))} disabled={currentPage === 0} className="cursor-pointer gap-1">
          <ChevronLeft className="h-4 w-4" /> Previous
        </Button>
        <Link href={`/checkout/${bookId}`}>
          <Button className="cursor-pointer gap-2">
            <ShoppingBag className="h-4 w-4" /> Order Print
          </Button>
        </Link>
        <Button variant="outline" onClick={() => setCurrentPage(p => Math.min(pages.length - 1, p + 1))} disabled={currentPage === pages.length - 1} className="cursor-pointer gap-1">
          Next <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

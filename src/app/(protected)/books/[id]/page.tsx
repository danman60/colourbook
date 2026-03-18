'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2, GripVertical, Loader2, Eye, ShoppingBag, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { EmptyState } from '@/components/shared/empty-state';
import { getBook } from '@/lib/actions/books';
import { getBookPages, addPageToBook, removePageFromBook, reorderBookPages } from '@/lib/actions/book-pages';
import { getPages } from '@/lib/actions/pages';
import type { Book, BookPage, Page } from '@/types';
import { toast } from 'sonner';

export default function BookBuilderPage() {
  const params = useParams();
  const router = useRouter();
  const bookId = params.id as string;

  const [book, setBook] = useState<Book | null>(null);
  const [bookPages, setBookPages] = useState<BookPage[]>([]);
  const [allPages, setAllPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const loadData = useCallback(async () => {
    const [bookResult, pagesResult, allPagesResult] = await Promise.all([
      getBook(bookId),
      getBookPages(bookId),
      getPages(),
    ]);
    if (bookResult.data) setBook(bookResult.data);
    if (pagesResult.data) setBookPages(pagesResult.data);
    if (allPagesResult.data) setAllPages(allPagesResult.data.filter(p => p.generation_status === 'complete'));
    setLoading(false);
  }, [bookId]);

  useEffect(() => { loadData(); }, [loadData]);

  async function handleAddPage(pageId: string) {
    const { error } = await addPageToBook(bookId, pageId);
    if (error) { toast.error(error); return; }
    toast.success('Page added to book');
    setAddDialogOpen(false);
    loadData();
  }

  async function handleRemovePage(bookPageId: string) {
    const { error } = await removePageFromBook(bookId, bookPageId);
    if (error) { toast.error(error); return; }
    toast.success('Page removed');
    loadData();
  }

  async function movePageUp(index: number) {
    if (index === 0) return;
    const newOrder = [...bookPages];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    setBookPages(newOrder);
    await reorderBookPages(bookId, newOrder.map(p => p.id));
  }

  async function movePageDown(index: number) {
    if (index === bookPages.length - 1) return;
    const newOrder = [...bookPages];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    setBookPages(newOrder);
    await reorderBookPages(bookId, newOrder.map(p => p.id));
  }

  const existingPageIds = new Set(bookPages.map(bp => bp.page_id));
  const availablePages = allPages.filter(p => !existingPageIds.has(p.id));

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!book) {
    return <p>Book not found</p>;
  }

  return (
    <div className="space-y-6">
      <Link href="/books" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground cursor-pointer">
        <ArrowLeft className="h-4 w-4" /> Back to Books
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold">{book.title}</h1>
          <p className="text-muted-foreground mt-1">{bookPages.length} page{bookPages.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="cursor-pointer gap-2">
                <Plus className="h-4 w-4" /> Add Pages
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader><DialogTitle className="font-heading">Add Pages to Book</DialogTitle></DialogHeader>
              {availablePages.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No available pages. Generate some coloring pages first!</p>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {availablePages.map(page => (
                    <Card key={page.id} className="overflow-hidden cursor-pointer hover:ring-2 ring-primary transition-all" onClick={() => handleAddPage(page.id)}>
                      {page.coloring_page_url ? (
                        <img src={page.coloring_page_url} alt={page.prompt} className="w-full aspect-square object-cover" />
                      ) : (
                        <div className="w-full aspect-square bg-muted flex items-center justify-center">
                          <Image className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      <CardContent className="p-2">
                        <p className="text-xs truncate">{page.prompt}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </DialogContent>
          </Dialog>

          {bookPages.length > 0 && (
            <>
              <Link href={`/books/${bookId}/preview`}>
                <Button variant="outline" className="cursor-pointer gap-2">
                  <Eye className="h-4 w-4" /> Preview
                </Button>
              </Link>
              <Link href={`/checkout/${bookId}`}>
                <Button className="cursor-pointer gap-2">
                  <ShoppingBag className="h-4 w-4" /> Order Print
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>

      {bookPages.length === 0 ? (
        <EmptyState icon={Image} title="This book is empty" description="Add coloring pages from your gallery to build your book!" actionLabel="Add Pages" onAction={() => setAddDialogOpen(true)} />
      ) : (
        <div className="space-y-3">
          {bookPages.map((bp, index) => (
            <Card key={bp.id} className="flex items-center gap-4 p-4">
              <div className="flex flex-col gap-1">
                <Button variant="ghost" size="icon" className="h-6 w-6 cursor-pointer" onClick={() => movePageUp(index)} disabled={index === 0}>
                  <GripVertical className="h-4 w-4 rotate-180" />
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6 cursor-pointer" onClick={() => movePageDown(index)} disabled={index === bookPages.length - 1}>
                  <GripVertical className="h-4 w-4" />
                </Button>
              </div>
              <span className="text-lg font-heading font-bold text-muted-foreground w-8 text-center">{index + 1}</span>
              {bp.page?.coloring_page_url ? (
                <img src={bp.page.coloring_page_url} alt={bp.page.prompt || ''} className="h-16 w-16 object-cover rounded-lg" />
              ) : (
                <div className="h-16 w-16 bg-muted rounded-lg flex items-center justify-center">
                  <Image className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{bp.page?.prompt || 'Untitled'}</p>
              </div>
              <Button variant="ghost" size="icon" className="cursor-pointer text-destructive" onClick={() => handleRemovePage(bp.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

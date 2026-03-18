'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BookOpen, Plus, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/shared/empty-state';
import { getBooks, createBook, deleteBook } from '@/lib/actions/books';
import type { Book } from '@/types';
import { toast } from 'sonner';

export default function BooksPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const router = useRouter();

  useEffect(() => { loadBooks(); }, []);

  async function loadBooks() {
    const { data } = await getBooks();
    if (data) setBooks(data);
    setLoading(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    const { data, error } = await createBook({ title, description: description || null });
    if (error) {
      toast.error(error);
      setCreating(false);
      return;
    }
    toast.success('Book created!');
    setDialogOpen(false);
    setTitle('');
    setDescription('');
    setCreating(false);
    router.push(`/books/${data!.id}`);
  }

  async function handleDelete(id: string, bookTitle: string) {
    if (!confirm(`Delete "${bookTitle}"?`)) return;
    const { error } = await deleteBook(id);
    if (error) toast.error(error);
    else { toast.success('Book deleted'); loadBooks(); }
  }

  function statusColor(status: string) {
    switch (status) {
      case 'draft': return 'secondary';
      case 'complete': return 'default';
      case 'ordered': return 'default';
      default: return 'secondary';
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold">My Books</h1>
          <p className="text-muted-foreground mt-1">Build and order custom coloring books</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="cursor-pointer gap-2"><Plus className="h-4 w-4" /> New Book</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-heading">Create New Book</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. The Smith Family Colouring Book" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="desc">Description (optional)</Label>
                <Textarea id="desc" value={description} onChange={e => setDescription(e.target.value)} placeholder="A book for the whole family..." rows={2} />
              </div>
              <Button type="submit" className="w-full cursor-pointer" disabled={creating}>
                {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Book
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {books.length === 0 ? (
        <EmptyState icon={BookOpen} title="No books yet" description="Create your first coloring book and add pages from your gallery!" actionLabel="Create Book" onAction={() => setDialogOpen(true)} />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {books.map(book => (
            <Card key={book.id} className="group hover:shadow-md transition-shadow duration-200">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <Link href={`/books/${book.id}`} className="cursor-pointer flex-1">
                    <CardTitle className="font-heading text-lg">{book.title}</CardTitle>
                  </Link>
                  {book.status === 'draft' && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleDelete(book.id, book.title)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{book.page_count} page{book.page_count !== 1 ? 's' : ''}</span>
                  <Badge variant={statusColor(book.status)} className="capitalize">{book.status}</Badge>
                </div>
                {book.description && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{book.description}</p>}
                <Link href={`/books/${book.id}`}>
                  <Button variant="outline" size="sm" className="w-full mt-4 cursor-pointer">
                    {book.status === 'draft' ? 'Edit Book' : 'View Book'}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

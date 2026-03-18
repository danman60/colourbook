'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Image, Loader2, Trash2, Download, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/shared/empty-state';
import { getPages, deletePage } from '@/lib/actions/pages';
import type { Page } from '@/types';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function GalleryPage() {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadPages();
  }, []);

  async function loadPages() {
    const { data } = await getPages();
    if (data) setPages(data);
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this coloring page?')) return;
    const { error } = await deletePage(id);
    if (error) {
      toast.error(error);
    } else {
      toast.success('Page deleted');
      loadPages();
    }
  }

  function statusBadge(status: string) {
    switch (status) {
      case 'complete': return <Badge className="bg-teal text-white">Complete</Badge>;
      case 'generating': return <Badge className="bg-warm-amber text-white">Generating...</Badge>;
      case 'pending': return <Badge variant="secondary">Pending</Badge>;
      case 'failed': return <Badge variant="destructive">Failed</Badge>;
      default: return null;
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold">My Gallery</h1>
          <p className="text-muted-foreground mt-1">{pages.length} coloring page{pages.length !== 1 ? 's' : ''}</p>
        </div>
        <Link href="/generate">
          <Button className="cursor-pointer gap-2">Generate New Page</Button>
        </Link>
      </div>

      {pages.length === 0 ? (
        <EmptyState
          icon={Image}
          title="No coloring pages yet"
          description="Generate your first AI coloring page and it will appear here!"
          actionLabel="Generate a Page"
          onAction={() => router.push('/generate')}
        />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {pages.map(page => (
            <Card key={page.id} className="overflow-hidden group cursor-pointer hover:shadow-md transition-shadow duration-200">
              <Link href={`/gallery/${page.id}`}>
                <div className="relative">
                  {page.coloring_page_url ? (
                    <img src={page.coloring_page_url} alt={page.prompt} className="w-full aspect-square object-cover" />
                  ) : (
                    <div className="w-full aspect-square bg-muted flex items-center justify-center">
                      {page.generation_status === 'generating' ? (
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      ) : (
                        <Image className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>
                  )}
                  <div className="absolute top-2 left-2">{statusBadge(page.generation_status)}</div>
                </div>
              </Link>
              <CardContent className="p-3">
                <p className="text-sm truncate mb-2">{page.prompt}</p>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {page.coloring_page_url && (
                    <Button variant="ghost" size="icon" className="h-7 w-7 cursor-pointer" asChild>
                      <a href={page.coloring_page_url} download target="_blank" rel="noreferrer">
                        <Download className="h-3.5 w-3.5" />
                      </a>
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" className="h-7 w-7 cursor-pointer text-destructive" onClick={() => handleDelete(page.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

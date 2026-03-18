'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Image, Loader2, Trash2, Download } from 'lucide-react';
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
      case 'complete': return <Badge className="bg-accent text-white text-[10px]">Complete</Badge>;
      case 'generating': return <Badge className="bg-secondary text-white text-[10px]">Generating...</Badge>;
      case 'pending': return <Badge variant="secondary" className="text-[10px]">Pending</Badge>;
      case 'failed': return <Badge variant="destructive" className="text-[10px]">Failed</Badge>;
      default: return null;
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <div className="skeleton h-9 w-48 mb-2" />
          <div className="skeleton h-5 w-32" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton aspect-square rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between animate-fade-in-up">
        <div>
          <h1 className="text-3xl font-heading font-bold">My Gallery</h1>
          <p className="text-muted-foreground mt-1">{pages.length} coloring page{pages.length !== 1 ? 's' : ''}</p>
        </div>
        <Link href="/generate">
          <Button className="cursor-pointer gap-2 shadow-sm">Generate New Page</Button>
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
          {pages.map((page, i) => (
            <Card
              key={page.id}
              className={`overflow-hidden group cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-300 animate-fade-in-up stagger-${Math.min(i + 1, 8)}`}
            >
              <Link href={`/gallery/${page.id}`}>
                <div className="relative overflow-hidden">
                  {page.coloring_page_url ? (
                    <img
                      src={page.coloring_page_url}
                      alt={page.prompt}
                      className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-300"
                    />
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
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 cursor-pointer text-destructive hover:text-destructive"
                    onClick={(e) => { e.preventDefault(); handleDelete(page.id); }}
                  >
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

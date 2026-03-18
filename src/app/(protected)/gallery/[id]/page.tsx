import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Download, BookOpen, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/server';
import { formatDateTime } from '@/lib/utils';

export default async function PageDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: page } = await supabase
    .from('cb_pages')
    .select('*, family_member:cb_family_members(name, relationship)')
    .eq('id', id)
    .eq('user_id', user!.id)
    .single();

  if (!page) notFound();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link href="/gallery" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground cursor-pointer">
        <ArrowLeft className="h-4 w-4" /> Back to Gallery
      </Link>

      {page.coloring_page_url ? (
        <Card className="overflow-hidden">
          <img src={page.coloring_page_url} alt={page.prompt} className="w-full" />
        </Card>
      ) : page.generation_status === 'generating' ? (
        <Card className="p-20 text-center">
          <Clock className="h-12 w-12 text-primary animate-pulse mx-auto mb-4" />
          <p className="text-lg font-heading">Your page is being generated...</p>
          <p className="text-muted-foreground mt-2">This usually takes 15-30 seconds. Refresh to check.</p>
        </Card>
      ) : page.generation_status === 'failed' ? (
        <Card className="p-20 text-center">
          <p className="text-lg font-heading text-destructive">Generation Failed</p>
          <p className="text-muted-foreground mt-2">{page.generation_error || 'An unexpected error occurred.'}</p>
        </Card>
      ) : null}

      <div className="space-y-3">
        <h1 className="text-xl font-heading font-bold">Page Details</h1>
        <div className="space-y-2 text-sm">
          <div><span className="text-muted-foreground">Prompt:</span> {page.prompt}</div>
          {page.family_member && (
            <div><span className="text-muted-foreground">Family Member:</span> {page.family_member.name} ({page.family_member.relationship})</div>
          )}
          <div><span className="text-muted-foreground">Status:</span> <Badge variant="secondary" className="capitalize">{page.generation_status}</Badge></div>
          <div><span className="text-muted-foreground">Created:</span> {formatDateTime(page.created_at)}</div>
        </div>
      </div>

      <div className="flex gap-3">
        {page.coloring_page_url && (
          <Button asChild className="cursor-pointer gap-2">
            <a href={page.coloring_page_url} download target="_blank" rel="noreferrer">
              <Download className="h-4 w-4" /> Download
            </a>
          </Button>
        )}
        <Link href="/books">
          <Button variant="outline" className="cursor-pointer gap-2">
            <BookOpen className="h-4 w-4" /> Add to Book
          </Button>
        </Link>
      </div>
    </div>
  );
}

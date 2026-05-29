import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Download, BookOpen, Clock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/server';
import { formatDateTime } from '@/lib/utils';
import { AutoRefresh } from '@/components/shared/auto-refresh';

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

  const isInProgress =
    !page.coloring_page_url &&
    (page.generation_status === 'pending' || page.generation_status === 'generating');

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <AutoRefresh active={isInProgress} />
      <Link href="/gallery" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Gallery
      </Link>

      {page.coloring_page_url ? (
        <Card className="overflow-hidden shadow-lg animate-scale-in">
          <img src={page.coloring_page_url} alt={page.prompt} className="w-full" />
        </Card>
      ) : page.generation_status === 'generating' || page.generation_status === 'pending' ? (
        <Card className="p-20 text-center animate-fade-in-up">
          <div className="bg-primary/10 rounded-2xl p-4 inline-block mb-4">
            <Clock className="h-10 w-10 text-primary animate-pulse" />
          </div>
          <p className="text-xl font-heading font-semibold">Your page is being generated...</p>
          <p className="text-muted-foreground mt-2">This usually takes 15-30 seconds. Refresh to check.</p>
        </Card>
      ) : page.generation_status === 'failed' ? (
        <Card className="p-20 text-center animate-fade-in-up">
          <div className="bg-destructive/10 rounded-2xl p-4 inline-block mb-4">
            <AlertTriangle className="h-10 w-10 text-destructive" />
          </div>
          <p className="text-xl font-heading font-semibold text-destructive">Generation Failed</p>
          <p className="text-muted-foreground mt-2">{page.generation_error || 'An unexpected error occurred.'}</p>
        </Card>
      ) : null}

      <div className="space-y-3 animate-fade-in-up stagger-2">
        <h2 className="text-xl font-heading font-bold">Page Details</h2>
        <div className="bg-card border border-border rounded-2xl p-5 space-y-3 text-sm">
          <div className="flex items-start gap-2">
            <span className="text-muted-foreground shrink-0 w-28">Prompt</span>
            <span className="font-medium">{page.prompt}</span>
          </div>
          {page.family_member && (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground shrink-0 w-28">Family Member</span>
              <span className="font-medium">{page.family_member.name} <span className="text-muted-foreground">({page.family_member.relationship})</span></span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground shrink-0 w-28">Status</span>
            <Badge variant="secondary" className="capitalize">{page.generation_status}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground shrink-0 w-28">Created</span>
            <span>{formatDateTime(page.created_at)}</span>
          </div>
        </div>
      </div>

      <div className="flex gap-3 animate-fade-in-up stagger-3">
        {page.coloring_page_url && (
          <Button asChild className="cursor-pointer gap-2 shadow-sm">
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

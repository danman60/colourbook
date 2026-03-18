'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { ActionResult, BookPage } from '@/types';

export async function getBookPages(bookId: string): Promise<ActionResult<BookPage[]>> {
  console.log('[getBookPages] bookId:', bookId);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: 'Not authenticated' };

  const { data, error } = await supabase
    .from('cb_book_pages')
    .select('*, page:cb_pages(*)')
    .eq('book_id', bookId)
    .order('page_order', { ascending: true });

  if (error) {
    console.error('[getBookPages] error:', error.message);
    return { data: null, error: error.message };
  }

  console.log('[getBookPages] found', data.length, 'pages');
  return { data: data as BookPage[], error: null };
}

export async function addPageToBook(bookId: string, pageId: string): Promise<ActionResult<BookPage>> {
  console.log('[addPageToBook] bookId:', bookId, 'pageId:', pageId);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: 'Not authenticated' };

  // Get current max order
  const { data: existing } = await supabase
    .from('cb_book_pages')
    .select('page_order')
    .eq('book_id', bookId)
    .order('page_order', { ascending: false })
    .limit(1);

  const nextOrder = (existing && existing.length > 0) ? existing[0].page_order + 1 : 0;

  const { data, error } = await supabase
    .from('cb_book_pages')
    .insert({ book_id: bookId, page_id: pageId, page_order: nextOrder })
    .select()
    .single();

  if (error) {
    console.error('[addPageToBook] error:', error.message);
    return { data: null, error: error.message };
  }

  // Update book page count
  await supabase
    .from('cb_books')
    .update({ page_count: nextOrder + 1, updated_at: new Date().toISOString() })
    .eq('id', bookId);

  console.log('[addPageToBook] success, order:', nextOrder);
  revalidatePath(`/books/${bookId}`);
  return { data: data as BookPage, error: null };
}

export async function removePageFromBook(bookId: string, bookPageId: string): Promise<ActionResult<null>> {
  console.log('[removePageFromBook] bookId:', bookId, 'bookPageId:', bookPageId);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: 'Not authenticated' };

  const { error } = await supabase
    .from('cb_book_pages')
    .delete()
    .eq('id', bookPageId)
    .eq('book_id', bookId);

  if (error) {
    console.error('[removePageFromBook] error:', error.message);
    return { data: null, error: error.message };
  }

  // Recalculate page count
  const { count } = await supabase
    .from('cb_book_pages')
    .select('*', { count: 'exact', head: true })
    .eq('book_id', bookId);

  await supabase
    .from('cb_books')
    .update({ page_count: count || 0, updated_at: new Date().toISOString() })
    .eq('id', bookId);

  revalidatePath(`/books/${bookId}`);
  return { data: null, error: null };
}

export async function reorderBookPages(bookId: string, pageIds: string[]): Promise<ActionResult<null>> {
  console.log('[reorderBookPages] bookId:', bookId, 'order:', pageIds);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: 'Not authenticated' };

  // Update each page's order
  for (let i = 0; i < pageIds.length; i++) {
    const { error } = await supabase
      .from('cb_book_pages')
      .update({ page_order: i })
      .eq('id', pageIds[i])
      .eq('book_id', bookId);

    if (error) {
      console.error('[reorderBookPages] error at index', i, ':', error.message);
      return { data: null, error: error.message };
    }
  }

  console.log('[reorderBookPages] success');
  revalidatePath(`/books/${bookId}`);
  return { data: null, error: null };
}

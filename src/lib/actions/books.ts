'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { ActionResult, Book, CreateBook, UpdateBook } from '@/types';

export async function getBooks(): Promise<ActionResult<Book[]>> {
  console.log('[getBooks] called');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: 'Not authenticated' };

  const { data, error } = await supabase
    .from('cb_books')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('[getBooks] error:', error.message);
    return { data: null, error: error.message };
  }

  console.log('[getBooks] found', data.length, 'books');
  return { data: data as Book[], error: null };
}

export async function getBook(id: string): Promise<ActionResult<Book>> {
  console.log('[getBook] id:', id);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: 'Not authenticated' };

  const { data, error } = await supabase
    .from('cb_books')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error) {
    console.error('[getBook] error:', error.message);
    return { data: null, error: error.message };
  }

  return { data: data as Book, error: null };
}

export async function createBook(input: CreateBook): Promise<ActionResult<Book>> {
  console.log('[createBook] called with:', JSON.stringify(input));
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: 'Not authenticated' };

  const { data, error } = await supabase
    .from('cb_books')
    .insert({
      user_id: user.id,
      title: input.title,
      description: input.description || null,
      status: 'draft',
      page_count: 0,
    })
    .select()
    .single();

  if (error) {
    console.error('[createBook] error:', error.message);
    return { data: null, error: error.message };
  }

  console.log('[createBook] success, id:', data.id);
  revalidatePath('/books');
  revalidatePath('/dashboard');
  return { data: data as Book, error: null };
}

export async function updateBook(id: string, updates: UpdateBook): Promise<ActionResult<Book>> {
  console.log('[updateBook] id:', id, 'updates:', JSON.stringify(updates));
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: 'Not authenticated' };

  const { data, error } = await supabase
    .from('cb_books')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    console.error('[updateBook] error:', error.message);
    return { data: null, error: error.message };
  }

  revalidatePath('/books');
  revalidatePath(`/books/${id}`);
  return { data: data as Book, error: null };
}

export async function deleteBook(id: string): Promise<ActionResult<null>> {
  console.log('[deleteBook] id:', id);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: 'Not authenticated' };

  // Remove book pages first
  await supabase.from('cb_book_pages').delete().eq('book_id', id);

  const { error } = await supabase
    .from('cb_books')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    console.error('[deleteBook] error:', error.message);
    return { data: null, error: error.message };
  }

  console.log('[deleteBook] success');
  revalidatePath('/books');
  revalidatePath('/dashboard');
  return { data: null, error: null };
}

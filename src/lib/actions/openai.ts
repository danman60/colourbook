'use server';

import { getOpenAIClient, COLORING_PAGE_SYSTEM_PROMPT } from '@/lib/openai';
import { supabaseAdmin } from '@/lib/supabase/admin';
import type { ActionResult } from '@/types';

export async function generateColoringPage(pageId: string, userId: string): Promise<ActionResult<{ imageUrl: string }>> {
  console.log('[generateColoringPage] pageId:', pageId, 'userId:', userId);

  try {
    // Get page details
    const { data: page, error: pageError } = await (supabaseAdmin
      .from('cb_pages') as any)
      .select('*, family_member:cb_family_members(name, relationship)')
      .eq('id', pageId)
      .single() as { data: any; error: any };

    if (pageError || !page) {
      console.error('[generateColoringPage] page not found:', pageError?.message);
      return { data: null, error: 'Page not found' };
    }

    // Update status to generating
    await (supabaseAdmin
      .from('cb_pages') as any)
      .update({ generation_status: 'generating' })
      .eq('id', pageId);

    // Build the prompt
    let fullPrompt = COLORING_PAGE_SYSTEM_PROMPT + '\n\nScene: ';

    if (page.family_member) {
      fullPrompt += `A ${page.family_member.relationship} named ${page.family_member.name} `;
    }

    fullPrompt += page.prompt;

    console.log('[generateColoringPage] prompt:', fullPrompt.substring(0, 200) + '...');

    // Call gpt-image-1 (returns base64-encoded PNG; no url/style/response_format
    // params — those belong to the retired dall-e-3 API and this key has no dall-e-3).
    const openai = getOpenAIClient();
    const response = await openai.images.generate({
      model: 'gpt-image-1',
      prompt: fullPrompt,
      n: 1,
      size: '1024x1024',
      quality: 'high',
    });

    const b64 = response.data?.[0]?.b64_json;
    if (!b64) {
      throw new Error('No image data in OpenAI response');
    }

    console.log('[generateColoringPage] got image, uploading...');

    // Decode base64 PNG and upload to Supabase Storage
    const imageBuffer = Buffer.from(b64, 'base64');
    const fileName = `${userId}/${pageId}.png`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from('coloring-pages')
      .upload(fileName, imageBuffer, {
        contentType: 'image/png',
        upsert: true,
      });

    if (uploadError) {
      console.error('[generateColoringPage] upload error:', uploadError.message);
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('coloring-pages')
      .getPublicUrl(fileName);

    const publicUrl = urlData.publicUrl;

    // Update page with completed status and URL
    await (supabaseAdmin
      .from('cb_pages') as any)
      .update({
        generation_status: 'complete',
        coloring_page_url: publicUrl,
        thumbnail_url: publicUrl,
        scene_description: fullPrompt,
      })
      .eq('id', pageId);

    console.log('[generateColoringPage] success, url:', publicUrl);
    return { data: { imageUrl: publicUrl }, error: null };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[generateColoringPage] failed:', errorMessage);

    // Update page with error
    await (supabaseAdmin
      .from('cb_pages') as any)
      .update({
        generation_status: 'failed',
        generation_error: errorMessage,
      })
      .eq('id', pageId);

    return { data: null, error: errorMessage };
  }
}

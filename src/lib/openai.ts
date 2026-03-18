import OpenAI from 'openai';

let _client: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (!_client) {
    if (!process.env.OPENAI_API_KEY) throw new Error('Missing OPENAI_API_KEY');
    _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _client;
}

export const COLORING_PAGE_SYSTEM_PROMPT = `Create a black and white coloring book page illustration. Requirements:
- Clean, bold line art with thick outlines (suitable for children aged 3-10 to color)
- NO shading, NO gradients, NO filled areas — pure line drawings on white background
- Family-friendly, cheerful, and wholesome scene
- Clear, distinct shapes that are easy to color inside
- Moderate detail level — not too simple, not too complex
- White background only
- No text or words in the image
- Style: professional coloring book illustration`;

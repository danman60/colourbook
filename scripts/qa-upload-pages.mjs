// Upload QA test coloring pages to the public coloring-pages bucket.
// Prints the public URLs. Idempotent (upsert).
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split('\n')
    .filter((l) => l.includes('='))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')];
    })
);

const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const files = [
  ['qa/qa-page1.png', '/tmp/cb-page1.png'],
  ['qa/qa-page2.png', '/tmp/cb-page2.png'],
];
for (const [path, local] of files) {
  const buf = readFileSync(local);
  const { error } = await sb.storage
    .from('coloring-pages')
    .upload(path, buf, { contentType: 'image/png', upsert: true });
  if (error) {
    console.log('ERR ' + path + ': ' + error.message);
    process.exit(1);
  }
  const { data } = sb.storage.from('coloring-pages').getPublicUrl(path);
  console.log(data.publicUrl);
}

// Produce the exact @supabase/ssr auth cookies for a password-grant session,
// so authenticated HTTP tests against the deployed app can be scripted.
// Usage: node scripts/qa-make-cookie.mjs <email> <password>
// Prints a Cookie header line to stdout (only the sb-*-auth-token chunks).
import { readFileSync } from 'node:fs';
import { createServerClient } from '@supabase/ssr';

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split('\n')
    .filter((l) => l.includes('='))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')];
    })
);

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const anon = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.QA_ANON_KEY;
const email = process.argv[2];
const password = process.argv[3];

const setCookies = new Map();
const store = {
  getAll() {
    return [];
  },
  setAll(cookies) {
    for (const { name, value } of cookies) setCookies.set(name, value);
  },
};

const sb = createServerClient(url, anon, { cookies: store });
const { data, error } = await sb.auth.signInWithPassword({ email, password });
if (error) {
  console.error('LOGIN ERR ' + error.message);
  process.exit(1);
}
// Force a flush of the session into cookies via setSession.
await sb.auth.setSession({
  access_token: data.session.access_token,
  refresh_token: data.session.refresh_token,
});

const header = [...setCookies.entries()]
  .map(([n, v]) => `${n}=${encodeURIComponent(v)}`)
  .join('; ');
const out = process.argv[4] || '/tmp/cb-cookie.txt';
const { writeFileSync } = await import('node:fs');
writeFileSync(out, header);
console.log('cookie written:', out, 'chunks:', setCookies.size);

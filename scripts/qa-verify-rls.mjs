// RLS cross-user isolation test. Creates user B, then uses B's JWT to attempt
// reads of user A (QA)'s rows via the RLS-enforced REST API. Expects 0 rows.
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const env = Object.fromEntries(readFileSync('.env.local', 'utf8').split('\n')
  .filter(l => l.includes('=')).map(l => { const i = l.indexOf('='); return [l.slice(0,i).trim(), l.slice(i+1).trim().replace(/^["']|["']$/g,'')]; }));
const URL = env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.QA_ANON_KEY;
const A = '00119664-df12-46c9-aabf-f0c75e127c03';        // QA user (has data)
const A_BOOK = '0b000000-0000-4000-8000-0000000000aa';
const A_PAGE = '0c000000-0000-4000-8000-0000000000aa';
const admin = createClient(URL, env.SUPABASE_SERVICE_ROLE_KEY);

const emailB = 'qa-rls-b-' + Date.now() + '@example.com';
const { data: bu, error: be } = await admin.auth.admin.createUser({ email: emailB, password: 'RlsTestB2026!', email_confirm: true, user_metadata: { full_name: 'RLS B' } });
if (be) { console.log('create B err', be.message); process.exit(1); }
const B = bu.user.id;

// password grant for B's token
const tok = await (await fetch(`${URL}/auth/v1/token?grant_type=password`, {
  method: 'POST', headers: { apikey: ANON, 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: emailB, password: 'RlsTestB2026!' }),
})).json();
const jwtB = tok.access_token;
if (!jwtB) { console.log('no token for B', tok); process.exit(1); }

async function asB(path) {
  const r = await fetch(`${URL}/rest/v1/${path}`, { headers: { apikey: ANON, Authorization: `Bearer ${jwtB}` } });
  return r.json();
}

const checks = [];
checks.push(['cb_books all (B sees only own = 0)', await asB('cb_books?select=id')]);
checks.push([`cb_books A's book by id`, await asB(`cb_books?select=id&id=eq.${A_BOOK}`)]);
checks.push(['cb_pages all', await asB('cb_pages?select=id')]);
checks.push([`cb_pages A's page by id`, await asB(`cb_pages?select=id&id=eq.${A_PAGE}`)]);
checks.push(['cb_orders all', await asB('cb_orders?select=id')]);
checks.push([`cb_profiles A by id (should be 0 - own only)`, await asB(`cb_profiles?select=id&id=eq.${A}`)]);
checks.push([`cb_profiles B own (should be 1)`, await asB(`cb_profiles?select=id&id=eq.${B}`)]);

let leak = false;
for (const [label, res] of checks) {
  const n = Array.isArray(res) ? res.length : `ERR ${JSON.stringify(res).slice(0,80)}`;
  const isOwnProfile = label.includes('B own');
  const bad = !isOwnProfile && Array.isArray(res) && res.length > 0;
  if (bad) leak = true;
  console.log(`${bad ? 'LEAK ' : 'ok   '}${label}: ${n}`);
}

// cleanup B
await admin.auth.admin.deleteUser(B);
console.log('\nRESULT:', leak ? 'RLS LEAK DETECTED' : 'RLS isolation OK (no cross-user reads)');
process.exit(leak ? 1 : 0);

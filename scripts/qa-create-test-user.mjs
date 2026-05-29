import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split('\n')
    .filter((l) => l.includes('='))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    })
);

const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const email = 'qa-colourbook@example.com';
const password = 'ColourbookQA2026!';

const { data, error } = await sb.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
});

if (error) {
  if (/already.*registered|already.*exists|duplicate/i.test(error.message)) {
    console.log('EXISTS — proceeding to login');
  } else {
    console.log('ERR ' + error.message);
    process.exit(1);
  }
} else {
  console.log('OK ' + data.user.id);
}

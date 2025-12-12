#!/usr/bin/env node

const dns = require('dns');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

const envPath = path.resolve('.env.local');
if (!fs.existsSync(envPath)) {
  console.error('❌ .env.local not found');
  process.exit(1);
}

const env = dotenv.parse(fs.readFileSync(envPath));
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const host = new URL(url).hostname;

console.log('🔎 Resolving host', host);
dns.lookup(host, (err, address) => {
  if (err) {
    console.error('❌ DNS lookup failed:', err.code || err.message);
    console.error('   확인: 프로젝트 ref (https://<ref>.supabase.co) 가 정확한지, 네트워크에서 *.supabase.co 접근이 막히지 않았는지 확인하세요.');
    process.exit(1);
  }
  console.log('✅ DNS resolved:', address);
  console.log('🔗 Testing Supabase fetch…');
  const client = createClient(url, anonKey);
  client.from('questions').select('id', { count: 'exact', head: true }).then(({ error, count }) => {
    if (error) {
      console.error('❌ Supabase query failed:', error.message || error);
      if (error.message && error.message.includes('fetch failed')) {
        console.error('   Network fetch failed. HTTPS 접근이 가능한지 확인하세요.');
      }
      process.exit(1);
    }
    console.log('✅ Supabase reachable. Questions count ~', count ?? 'unknown');
    process.exit(0);
  }).catch(err => {
    console.error('❌ Unexpected error:', err);
    process.exit(1);
  });
});

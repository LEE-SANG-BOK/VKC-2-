#!/usr/bin/env bash
set -euo pipefail

node - <<'NODE'
const fs = require('fs');
const path = require('path');

const repoRoot = process.cwd();
const baselineLang = 'ko';
// NOTE:
// - `en` is allowed to be partial because the app merges `ko` -> `en` as fallback
//   (see `src/i18n/get-dictionary.ts`).
// - `vi` must stay in sync with `ko` to avoid runtime missing keys.
const langs = ['ko', 'en', 'vi'];

const readJson = (filePath) => {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    throw new Error(`Failed to read JSON: ${filePath}: ${error.message}`);
  }
};

const isPlainObject = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const flatten = (value, prefix = '', out = new Map()) => {
  if (isPlainObject(value)) {
    for (const [key, child] of Object.entries(value)) {
      const next = prefix ? `${prefix}.${key}` : key;
      flatten(child, next, out);
    }
    return out;
  }
  if (Array.isArray(value)) {
    out.set(prefix, value);
    return out;
  }
  out.set(prefix, value);
  return out;
};

const files = langs.map((lang) => ({
  lang,
  filePath: path.join(repoRoot, 'messages', `${lang}.json`),
}));

const maps = new Map();
for (const { lang, filePath } of files) {
  if (!fs.existsSync(filePath)) {
    console.error(`[i18n] FAIL: missing file: ${filePath}`);
    process.exit(1);
  }
  const json = readJson(filePath);
  const map = flatten(json);
  maps.set(lang, map);
}

const base = maps.get(baselineLang);
if (!base) {
  console.error(`[i18n] FAIL: baseline lang not loaded: ${baselineLang}`);
  process.exit(1);
}

const baseKeys = new Set(base.keys());
let failed = false;

for (const lang of langs) {
  if (lang === baselineLang) continue;
  const map = maps.get(lang);
  const keys = new Set(map.keys());

  const missing = [...baseKeys].filter((k) => !keys.has(k));
  const extra = [...keys].filter((k) => !baseKeys.has(k));

  const isStrict = lang === 'vi';
  const tag = isStrict ? 'FAIL' : 'WARN';

  if (missing.length || extra.length) {
    if (isStrict) failed = true;
    console[tag === 'FAIL' ? 'error' : 'warn'](`\n[i18n] ${tag}: ${lang} mismatch vs ${baselineLang}`);
    if (missing.length) {
      console[tag === 'FAIL' ? 'error' : 'warn'](`  missing (${missing.length}):`);
      for (const k of missing.slice(0, 50)) console[tag === 'FAIL' ? 'error' : 'warn'](`    - ${k}`);
      if (missing.length > 50) console[tag === 'FAIL' ? 'error' : 'warn'](`    ... (+${missing.length - 50} more)`);
    }
    if (extra.length) {
      console[tag === 'FAIL' ? 'error' : 'warn'](`  extra (${extra.length}):`);
      for (const k of extra.slice(0, 50)) console[tag === 'FAIL' ? 'error' : 'warn'](`    - ${k}`);
      if (extra.length > 50) console[tag === 'FAIL' ? 'error' : 'warn'](`    ... (+${extra.length - 50} more)`);
    }
  }
}

// Vietnamese long-string report (warning only)
const vi = maps.get('vi');
if (vi) {
  const long = [];
  for (const [key, value] of vi.entries()) {
    if (typeof value === 'string') {
      long.push({ key, length: value.length });
    }
  }
  long.sort((a, b) => b.length - a.length);
  const top = long.slice(0, 15);
  const threshold = 180;
  const over = top.filter((row) => row.length >= threshold);
  if (over.length) {
    console.warn(`\n[i18n] WARN: long vi strings (>= ${threshold} chars) - check UI for wrapping/truncation:`);
    for (const row of over) console.warn(`  - ${row.key}: ${row.length}`);
  }
}

if (failed) {
  console.error('\n[i18n] FAIL: key parity mismatch (vi must match ko)');
  process.exit(1);
}
console.log('[i18n] PASS: key parity ok (vi matches ko; en may be partial)');
NODE

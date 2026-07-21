import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const requiredPages = [
  'index.html',
  'start.html',
  'intake-personal.html',
  'intake-company.html',
  'submitted.html',
  'dashboard.html',
];

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(file) : [file];
  }));
  return nested.flat();
}

test('all public routes exist', async () => {
  for (const page of requiredPages) {
    const html = await readFile(new URL(page, root), 'utf8');
    assert.match(html, /<!doctype html>/i, page);
  }
});

test('source contains no unresolved merge conflicts', async () => {
  const files = (await walk(fileURLToPath(root)))
    .filter((file) => !file.includes(`${path.sep}.git${path.sep}`))
    .filter((file) => !file.includes(`${path.sep}node_modules${path.sep}`));
  for (const file of files) {
    const text = await readFile(file, 'utf8').catch(() => '');
    assert.doesNotMatch(text, /^(<<<<<<<|=======|>>>>>>>)/m, file);
  }
});

test('demo browser storage excludes direct identifiers and documents', async () => {
  const app = await readFile(new URL('assets/app.js', root), 'utf8');
  assert.doesNotMatch(app, /safeValue\(form,\s*['"](?:firstName|lastName|personalCode|email|phone|.*Iban|.*Statement)['"]\)/);
  assert.doesNotMatch(app, /statement\s*:/);
  assert.doesNotMatch(app, /iban\s*:/);
});

test('repository ignore rules cover confidential client material', async () => {
  const ignore = await readFile(new URL('.gitignore', root), 'utf8');
  for (const rule of ['Kliendibaas/', '*.pdf', '*.csv', '*.xlsx', '.env*']) {
    assert.ok(ignore.includes(rule), `missing ignore rule: ${rule}`);
  }
});

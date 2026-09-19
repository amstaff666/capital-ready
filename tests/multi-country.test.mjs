import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);

test('EE FI PL markets are enabled and isolated', async () => {
  const config = JSON.parse(await readFile(new URL('config/markets.json', root), 'utf8'));
  const active = config.markets.filter(m => m.enabled);
  assert.deepEqual(active.map(m => m.code).sort(), ['EE','FI','PL']);
  assert.equal(new Set(active.map(m => m.backendEnv)).size, active.length);
  assert.equal(new Set(active.map(m => m.databaseEnv)).size, active.length);
  for (const market of active) {
    const rules = JSON.parse(await readFile(new URL(market.rules, root), 'utf8'));
    assert.equal(rules.market, market.code);
    assert.ok(!String(rules.status).startsWith('disabled'));
  }
});

test('Africa candidates stay disabled until rule review', async () => {
  const config = JSON.parse(await readFile(new URL('config/markets.json', root), 'utf8'));
  for (const code of ['ZA','KE']) {
    const market = config.markets.find(m => m.code === code);
    assert.equal(market.enabled, false);
    const rules = JSON.parse(await readFile(new URL(market.rules, root), 'utf8'));
    assert.match(rules.status, /^disabled/);
  }
});

test('country landing pages exist', async () => {
  for (const page of ['markets/ee.html','markets/fi.html','markets/pl.html']) {
    const html = await readFile(new URL(page, root), 'utf8');
    assert.match(html, /<!doctype html>/i);
    assert.match(html, /market=/i);
  }
});

test('browser storage persists only technical case summary', async () => {
  const app = await readFile(new URL('assets/app.js', root), 'utf8');
  const storageBlock = app.match(/localStorage\.setItem\('aimoneyflowCase',[\s\S]*?\}\)\);/);
  assert.ok(storageBlock);
  assert.doesNotMatch(storageBlock[0], /firstName|lastName|personalCode|email|phone|Iban|filename/i);
  assert.match(storageBlock[0], /caseId/);
  assert.match(storageBlock[0], /reference/);
});

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function loadJson(rel) {
  return JSON.parse(readFileSync(join(root, rel), 'utf8'));
}

function sortedKeys(obj) {
  return Object.keys(obj).sort();
}

const en = loadJson('static/locales/en.json');
const ru = loadJson('static/locales/ru.json');
const pubEn = loadJson('public/locales/en.json');
const pubRu = loadJson('public/locales/ru.json');

const enKeys = sortedKeys(en);
const ruKeys = sortedKeys(ru);
assert.deepEqual(enKeys, ruKeys, 'static en/ru key parity');
assert.deepEqual(sortedKeys(pubEn), enKeys, 'public en matches static en');
assert.deepEqual(sortedKeys(pubRu), ruKeys, 'public ru matches static ru');

const fallbackSrc = readFileSync(join(root, 'src/i18n/fallback.ts'), 'utf8');
const fallbackKeys = [...fallbackSrc.matchAll(/^\s+([A-Za-z][A-Za-z0-9_]*)\s*:/gm)].map((m) => m[1]);
for (const key of fallbackKeys) {
  assert.ok(en[key] !== undefined, `en missing fallback key ${key}`);
  assert.ok(ru[key] !== undefined, `ru missing fallback key ${key}`);
}

const legalKeys = enKeys.filter((k) => /^legal/i.test(k));
assert.ok(legalKeys.length >= 5, 'expected legal locale keys');
for (const key of legalKeys) {
  assert.equal(typeof en[key], 'string');
  assert.equal(typeof ru[key], 'string');
  const minLen = key === 'legalClose' ? 3 : 10;
  assert.ok(en[key].trim().length >= minLen, `${key} en too short`);
  assert.ok(ru[key].trim().length >= minLen, `${key} ru too short`);
}

console.log(`i18n parity ok (${enKeys.length} keys, ${legalKeys.length} legal)`);

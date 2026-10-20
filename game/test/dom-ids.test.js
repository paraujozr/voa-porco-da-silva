import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, readdirSync} from 'node:fs';

// The UI code looks elements up by id; a rename in index.html would otherwise only
// surface at runtime. This statically checks every literal id the code asks for.
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const declared = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]));
const srcDir = new URL('../src/', import.meta.url);

test('todo id usado via $() ou getElementById existe no index.html', () => {
  const missing = [];
  for (const file of readdirSync(srcDir).filter(f => f.endsWith('.js'))) {
    const code = readFileSync(new URL(file, srcDir), 'utf8');
    for (const m of code.matchAll(/(?:\$|getElementById)\(\s*'([^']+)'\s*\)/g)) {
      if (!declared.has(m[1])) missing.push(`${file}: #${m[1]}`);
    }
  }
  assert.deepEqual(missing, []);
});

test('o index.html não repete ids', () => {
  const all = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
  assert.equal(all.length, new Set(all).size);
});

import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, readdirSync} from 'node:fs';
import {ICONS, icon} from '../src/icons.js';

const srcDir = new URL('../src/', import.meta.url);
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

test('todo ícone é uma grade retangular com cores válidas', () => {
  for (const [id, grid] of Object.entries(ICONS)) {
    assert.ok(grid.length >= 5, id);
    assert.ok(
      grid.every(row => row.length === grid[0].length),
      `${id}: linhas com larguras diferentes`,
    );
    assert.match(icon(id), /^<svg class="ico"/, id);
  }
});

test('ícones desconhecidos falham alto', () => {
  assert.throws(() => icon('nao-existe'), /desconhecido/);
});

test('todo ícone pedido no código e no HTML existe', () => {
  const wanted = new Set();
  for (const m of html.matchAll(/data-icon="([^"]+)"/g)) wanted.add(m[1]);
  for (const file of readdirSync(srcDir).filter(f => f.endsWith('.js') && f !== 'icons.js')) {
    const code = readFileSync(new URL(file, srcDir), 'utf8');
    for (const m of code.matchAll(/\bicon\(\s*'([^']+)'\s*\)/g)) wanted.add(m[1]);
    for (const m of code.matchAll(/data-icon="([^"]+)"/g)) wanted.add(m[1]);
  }
  const missing = [...wanted].filter(id => !ICONS[id]);
  assert.deepEqual(missing, []);
});

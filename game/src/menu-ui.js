import {MAPS, PIGS} from './config.js';
import {$} from './dom.js';

export const bestRecord = (save, map, difficulty) => save.best[`${map.id}:${difficulty}`] || 0;

// Paints the menu (wallet, selected map/pig, shop buttons) from the game's current selection.
export function renderMenu({save, mapIndex, charIndex, difficulty}) {
  const map = MAPS[mapIndex],
    data = PIGS[charIndex],
    locked = data.cost && !save.unlocked.includes(data.id);
  $('wallet').textContent = save.coins;
  $('pig-name').textContent = data.name;
  $('selected-name').textContent = data.name;
  $('selected-desc').textContent = data.desc;
  $('selected-cost').textContent = locked ? `${data.cost} moedas para liberar` : '';
  $('pig-desc').textContent = data.desc;
  $('pig-cost').textContent = locked ? `DESBLOQUEIE POR ${data.cost} MOEDAS` : '';
  $('map-tag').textContent = map.tag;
  $('map-desc').textContent = map.desc;
  $('scene-caption').textContent = map.caption;
  $('record').textContent = `RECORDE • ${map.short}: ${bestRecord(save, map, difficulty)}`;
  const mapLocked = map.cost && !save.maps.includes(map.id);
  $('play').innerHTML = mapLocked
    ? `LIBERAR ${map.short} · ${map.cost} ◉ <span>↗</span>`
    : locked
      ? `DESBLOQUEAR · ${data.cost} ◉ <span>↗</span>`
      : 'DECOLAR AGORA <span>↗</span>';
  $('sound').textContent = save.muted ? 'SOM OFF' : 'SOM ON';
  $('maps').innerHTML = MAPS.map(
    (m, i) =>
      `<button class="map ${i === mapIndex ? 'selected' : ''}" data-map="${i}" aria-pressed="${i === mapIndex}"><span class="map-icon">${m.icon}</span><b>${m.name}</b><small>${m.cost && !save.maps.includes(m.id) ? `🔒 ${m.cost} moedas` : '✓ LIBERADO'}</small></button>`,
  ).join('');
  $('characters').innerHTML = PIGS.map(
    (p, i) =>
      `<button class="character ${i === charIndex ? 'selected' : ''}" data-char="${i}" aria-pressed="${i === charIndex}"><span class="avatar">${p.icon}</span><span><b>${p.name}</b><small>${p.cost && !save.unlocked.includes(p.id) ? `◉ ${p.cost} para liberar` : p.label.replace(/\d+ moedas/, 'LIBERADO')}</small></span></button>`,
  ).join('');
  $('collection-grid').innerHTML = $('characters').innerHTML;
  $('open-collection').textContent =
    `VER OS ${PIGS.length} PORCOS · ${charIndex + 1}/${PIGS.length} ↗`;
}

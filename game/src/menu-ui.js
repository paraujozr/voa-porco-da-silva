import {MAPS, PIGS} from './config.js';
import {DIFFICULTY_NAMES} from './difficulty.js';
import {$} from './dom.js';
import {icon, pigPortrait} from './icons.js';

export const bestRecord = (save, map, difficulty) => save.best[`${map.id}:${difficulty}`] || 0;

// Is this skin ('skin') or map ('map') already usable by the player?
export const isOwned = (save, kind, item) =>
  !item.cost || (kind === 'map' ? save.maps : save.unlocked).includes(item.id);

const cost = n => `${n} ${icon('coin')}`;

// Paints the menu (wallet, name bar, play button) and the Porcos and Mapas dialogs from the
// game's current selection.
export function renderMenu({save, mapIndex, charIndex, difficulty}) {
  const map = MAPS[mapIndex],
    pig = PIGS[charIndex],
    pigOwned = isOwned(save, 'skin', pig),
    mapOwned = isOwned(save, 'map', map),
    record = bestRecord(save, map, difficulty);

  $('wallet').textContent = save.coins;
  $('selected-name').textContent = pig.name;
  $('pick-sub').textContent = `${map.name} · ${DIFFICULTY_NAMES[difficulty]}`;
  $('record').textContent = `RECORDE • ${map.short}: ${record}`;
  $('play').innerHTML = !mapOwned
    ? `${icon('lock')} LIBERAR ${map.short}`
    : !pigOwned
      ? `${icon('lock')} LIBERAR PORCO`
      : `BORA VOAR ${icon('arrow-right')}`;
  $('sound').textContent = save.muted ? 'SOM OFF' : 'SOM ON';

  // Porcos dialog
  $('characters').innerHTML = PIGS.map((p, i) => {
    const owned = isOwned(save, 'skin', p);
    return `<button class="character ${i === charIndex ? 'selected' : ''}" data-char="${i}" aria-pressed="${i === charIndex}"><span class="avatar">${pigPortrait(p)}</span><b>${p.name}</b><small>${owned ? 'LIBERADO' : `${icon('lock')} ${cost(p.cost)}`}</small></button>`;
  }).join('');
  $('porco-name').textContent = pig.name;
  $('porco-desc').textContent = pig.desc;
  $('porco-cost').textContent = pigOwned ? pig.label : `${pig.cost} moedas para liberar`;
  $('porco-action').innerHTML = pigOwned
    ? `ESCOLHER ${icon('check')}`
    : `DESBLOQUEAR · ${cost(pig.cost)}`;
  $('porco-action').dataset.mode = pigOwned ? 'pick' : 'buy';

  // Mapas dialog
  $('maps').innerHTML = MAPS.map((m, i) => {
    const owned = isOwned(save, 'map', m);
    return `<button class="map ${i === mapIndex ? 'selected' : ''}" data-map="${i}" aria-pressed="${i === mapIndex}"><span class="map-icon">${icon(m.icon)}</span><b>${m.name}</b><small>${owned ? 'LIBERADO' : `${icon('lock')} ${cost(m.cost)}`}</small></button>`;
  }).join('');
  $('map-tag').textContent = map.tag;
  $('map-desc').textContent = map.desc;
  $('map-record').textContent = `RECORDE • ${map.short}: ${record}`;
  $('map-action').innerHTML = mapOwned
    ? `ESCOLHER ${icon('check')}`
    : `LIBERAR · ${cost(map.cost)}`;
  $('map-action').dataset.mode = mapOwned ? 'pick' : 'buy';
  for (const b of document.querySelectorAll('.levels [data-level]'))
    b.setAttribute('aria-pressed', String(b.dataset.level === difficulty));
}

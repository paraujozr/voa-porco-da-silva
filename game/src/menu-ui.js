import {STAGES, POWERS} from '../core/adventure.js';
import {MAPS, PIGS} from './config.js';
import {DIFFICULTY_NAMES} from './difficulty.js';
import {$} from './dom.js';
import {icon, pigPortrait} from './icons.js';

export const bestRecord = (save, map, difficulty) => save.best[`${map.id}:${difficulty}`] || 0;

// Is this skin ('skin') or map ('map') already usable by the player?
export const isOwned = (save, kind, item) =>
  kind === 'map'
    ? item.id === 'cipo' || save.maps.includes(item.id)
    : !item.cost || save.unlocked.includes(item.id);

const cost = n => `${n} ${icon('coin')}`;

// Paints the menu (wallet, name bar, play button) and the Porcos and Mapas dialogs from the
// game's current selection.
export function renderMenu({save, mapIndex, charIndex, difficulty, mode = 'campaign'}) {
  const map = MAPS[mapIndex],
    pig = PIGS[charIndex],
    pigOwned = isOwned(save, 'skin', pig),
    mapOwned = isOwned(save, 'map', map),
    record = bestRecord(save, map, difficulty);

  $('wallet').textContent = save.coins;
  $('selected-name').textContent = pig.name;
  $('pick-sub').textContent =
    `${map.name} · ${mode === 'campaign' ? 'Campanha' : 'Voo livre'} · ${DIFFICULTY_NAMES[difficulty]}`;
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
  $('porco-desc').textContent =
    `${pig.desc} Poder: ${POWERS[pig.id].name}. ${POWERS[pig.id].description} Recarga: ${POWERS[pig.id].cooldown}s.`;
  $('porco-cost').textContent = pigOwned ? pig.label : `${pig.cost} moedas para liberar`;
  $('porco-action').innerHTML = pigOwned
    ? `ESCOLHER ${icon('check')}`
    : `DESBLOQUEAR · ${cost(pig.cost)}`;
  $('porco-action').dataset.mode = pigOwned ? 'pick' : 'buy';

  // Mapas dialog
  $('maps').innerHTML = MAPS.map((m, i) => {
    const owned = isOwned(save, 'map', m);
    return `<button class="map ${i === mapIndex ? 'selected' : ''}" data-map="${i}" aria-pressed="${i === mapIndex}"><span class="map-icon">${icon(m.icon)}</span><b>${m.name}</b><small>${save.completed?.includes(m.id) ? 'CONCLUÍDO' : owned ? `${STAGES[m.id].goal} CANOS` : `${icon('lock')} CONCLUA ${MAPS[i - 1].short}`}</small></button>`;
  }).join('');
  $('map-tag').textContent = map.tag;
  $('map-desc').textContent =
    `${map.desc} Campanha: ${STAGES[map.id].goal} canos. ${mapOwned ? 'Voo livre também disponível.' : 'Conclua ' + MAPS[mapIndex - 1].name + ' para liberar.'}`;
  $('map-record').textContent = `RECORDE • ${map.short}: ${record}`;
  $('map-action').innerHTML = mapOwned ? `ESCOLHER ${icon('check')}` : 'CONCLUA O MAPA ANTERIOR';
  $('map-action').disabled = !mapOwned;
  for (const b of document.querySelectorAll('[data-flight-mode]'))
    b.setAttribute('aria-pressed', String(b.dataset.flightMode === mode));
  $('map-action').dataset.mode = mapOwned ? 'pick' : 'buy';
  for (const b of document.querySelectorAll('.levels [data-level]'))
    b.setAttribute('aria-pressed', String(b.dataset.level === difficulty));
}

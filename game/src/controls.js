import {PIGS} from './config.js';
import {$, toast} from './dom.js';
import {STATE} from './game.js';

// Wires DOM and window events to the Game. No state of its own.
export function bindControls(game) {
  const {audio, music} = game;
  const closestData = (e, selector) => e.target.closest(selector);

  $('maps').onclick = e => {
    const b = closestData(e, '[data-map]');
    if (b) game.switchMap(Number(b.dataset.map));
  };
  $('characters').onclick = e => {
    const b = closestData(e, '[data-char]');
    if (b) game.switchPig(Number(b.dataset.char));
  };
  $('prev-char').onclick = () => game.switchPig((game.charIndex - 1 + PIGS.length) % PIGS.length);
  $('next-char').onclick = () => game.switchPig((game.charIndex + 1) % PIGS.length);
  $('play').onclick = () => game.startFlight();
  $('retry').onclick = () => game.retry();
  $('continue-run').onclick = () => game.continueRun();
  $('pause').onclick = () => game.pause();
  $('resume').onclick = () => game.resume();
  $('home').onclick = () => game.home();
  $('sound').onclick = () => game.toggleSound();
  $('quality').onclick = () => game.toggleQuality();

  // Dialogs opened from the menu rails.
  for (const [button, panel] of [
    ['porcos-open', 'porcos-panel'],
    ['maps-open', 'maps-panel'],
    ['settings-open', 'settings-panel'],
  ])
    $(button).onclick = () => game.openPanel(panel);
  for (const close of document.querySelectorAll('[data-close]'))
    close.onclick = () => game.closePanel(close.dataset.close);
  for (const dialog of document.querySelectorAll('.dialog'))
    dialog.addEventListener('pointerdown', e => {
      if (e.target === dialog) game.closePanel(dialog.id);
    });
  $('porco-action').onclick = () => game.pigAction();
  $('map-action').onclick = () => game.mapAction();
  for (const level of document.querySelectorAll('.levels [data-level]'))
    level.onclick = () => {
      game.difficulty = level.dataset.level;
      game.refreshUI();
    };

  window.addEventListener('keydown', e => {
    if (e.target.closest?.('input,select,textarea')) return;
    if (e.code === 'Escape' && game.closeOpenDialog()) return;
    if (['Escape', 'KeyP'].includes(e.code)) {
      if (game.state === STATE.PLAYING) game.pause();
      else if (game.state === STATE.PAUSED) game.resume();
    }
    if (['Space', 'ArrowUp'].includes(e.code) && game.state === STATE.PLAYING) {
      e.preventDefault();
      if (!e.repeat) game.flap();
    }
  });
  window.addEventListener(
    'pointerdown',
    () => {
      audio.unlock();
      music.unlock();
    },
    {once: true},
  );
  window.addEventListener('pointerdown', e => {
    const onUI = e.target.closest('button,a,input,select,.dialog,.social-overlay');
    if (!onUI && game.state === STATE.PLAYING) game.flap();
  });

  // Leaving the page or losing the GPU must never let a solo run silently continue, and
  // costs a duel its forfeit.
  const interrupt = () => (game.duel ? game.duelCtl.forfeit() : game.pause());
  window.addEventListener('blur', () => {
    if (!game.duel) game.pause();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) interrupt();
  });
  window.addEventListener('resize', () => {
    if (game.state === STATE.PLAYING && !game.duel) game.pause();
    game.stage.resize();
  });
  $('world').addEventListener('webglcontextlost', e => {
    e.preventDefault();
    interrupt();
    toast('O 3D foi interrompido. Recarregue para voltar.');
  });
}

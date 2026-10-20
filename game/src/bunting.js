// Festa junina bunting along the top edge. Flags and bulbs are spaced by pixels rather than by a
// fixed count, so a phone gets fewer, smaller flags instead of an overlapping tangle.
const FLAGS = ['#ffdf00', '#009c3b', '#ef7453', '#47aecb'];
const BULBS = ['#ffe577', '#ff876a', '#80ffd4', '#a7cfff'];

export function decorateFestival() {
  const el = document.querySelector('.bunting');
  const build = () => {
    const count = Math.max(6, Math.round(innerWidth / (innerWidth <= 680 ? 46 : 56)));
    const flags = Array.from({length: count}, (_, i) => {
      const flagAt = ((i + 0.2) / count) * 100,
        bulbAt = ((i + 0.7) / count) * 100;
      return `<span class="fest-flag" style="--i:${i};--color:${FLAGS[i % 4]};left:${flagAt}%"></span><i class="fest-bulb" style="--i:${i};--color:${BULBS[i % 4]};left:${bulbAt}%"></i>`;
    });
    el.innerHTML = `<div class="fest-wire"></div>${flags.join('')}`;
  };
  build();
  let width = innerWidth;
  window.addEventListener('resize', () => {
    // Rebuild only when the layout class changes or the width moved a lot (rotation, window drag).
    if (Math.abs(innerWidth - width) < 120 && innerWidth <= 680 === width <= 680) return;
    width = innerWidth;
    build();
  });
}

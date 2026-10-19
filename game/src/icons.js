// Pixel icons drawn as ASCII grids (one character per pixel) and rendered as inline SVG.
//
//   icon('coin')                       -> '<svg class="ico" ...>' string for innerHTML
//   <span data-icon="trophy"></span>   -> filled in by hydrateIcons() at startup
//
// '.' is transparent and '#' is currentColor, so most icons take the colour of the text around
// them. The other letters are fixed palette colours (see PALETTE).
const PALETTE = {
  '#': 'currentColor',
  k: '#08171d',
  w: '#fff4d6',
  Y: '#ffdf00',
  y: '#b89a00',
  G: '#009c3b',
  g: '#55d98a',
  B: '#002776',
  b: '#4c6fd0',
  r: '#c93c2c',
  p: '#e67d91',
  P: '#f299a6',
};

export const ICONS = {
  coin: [
    '..kkkkk..',
    '.kYYYYYk.',
    'kYYYwYYyk',
    'kYYwYYYyk',
    'kYYwYYYyk',
    'kYYwYYYyk',
    'kYYYYYyyk',
    '.kyyyyyk.',
    '..kkkkk..',
  ],
  lock: [
    '..#####..',
    '.##...##.',
    '.#.....#.',
    '.#.....#.',
    '#########',
    '#########',
    '####k####',
    '####k####',
    '#########',
    '#########',
  ],
  trophy: [
    'YYYYYYYYY',
    'Y.YYwYY.Y',
    'Y.YYwYY.Y',
    '.YYYwYYy.',
    '..YYYYy..',
    '...Yyy...',
    '....y....',
    '...YYy...',
    '..YYYYy..',
  ],
  swords: [
    '#.......#',
    '##.....##',
    '.##...##.',
    '..##.##..',
    '...###...',
    '..##.##..',
    '.#y#.#y#.',
    '#y.#.#.y#',
    'y.......y',
  ],
  user: [
    '...###...',
    '..#####..',
    '..#####..',
    '..#####..',
    '...###...',
    '.#######.',
    '#########',
    '#########',
    '#########',
  ],
  gear: [
    '....#....',
    '.#.###.#.',
    '.#######.',
    '..##.##..',
    '####.####',
    '..##.##..',
    '.#######.',
    '.#.###.#.',
    '....#....',
  ],
  pig: [
    'pp.....pp',
    'ppppppppp',
    'ppkpppkpp',
    'ppppppppp',
    '.pPPPPPp.',
    '.pPkPkPp.',
    '.pPPPPPp.',
    '..ppppp..',
  ],
  map: [
    'wwwwwwwww',
    'wGGwBBwgw',
    'wGGwBBwgw',
    'wGwwBwwgw',
    'wwwwBBwww',
    'wwGwwwBbw',
    'wGGwwwBBw',
    'wwwwwwwww',
  ],
  'arrow-left': ['....#', '...##', '..###', '.####', '#####', '.####', '..###', '...##', '....#'],
  'arrow-right': ['#....', '##...', '###..', '####.', '#####', '####.', '###..', '##...', '#....'],
  close: ['##...##', '###.###', '.#####.', '..###..', '.#####.', '###.###', '##...##'],
  check: [
    '........#',
    '.......##',
    '#.....##.',
    '##...##..',
    '.##.##...',
    '..###....',
    '...#.....',
  ],
  music: [
    '...#####.',
    '...#...#.',
    '...#...#.',
    '...#...#.',
    '.###.###.',
    '####.###.',
    '.##...#..',
  ],
  sound: [
    '...#.....',
    '..##..#..',
    '####...#.',
    '####.#.#.',
    '####.#.#.',
    '####...#.',
    '..##..#..',
    '...#.....',
  ],
  pause: ['##...##', '##...##', '##...##', '##...##', '##...##', '##...##', '##...##'],
  star: [
    '....#....',
    '....#....',
    '...###...',
    '#########',
    '.#######.',
    '..#####..',
    '..##.##..',
    '.##...##.',
    '.#.....#.',
  ],
};

const cache = new Map();

function toSvg(id) {
  const grid = ICONS[id];
  if (!grid) throw new Error(`Ícone desconhecido: ${id}`);
  const paths = new Map();
  grid.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const ch = row[x];
      let end = x;
      while (end + 1 < row.length && row[end + 1] === ch) end++;
      if (ch !== '.') {
        if (!PALETTE[ch]) throw new Error(`Ícone ${id}: cor "${ch}" não existe`);
        const d = paths.get(PALETTE[ch]) ?? '';
        paths.set(PALETTE[ch], `${d}M${x} ${y}h${end - x + 1}v1h-${end - x + 1}z`);
      }
      x = end + 1;
    }
  });
  const w = grid[0].length;
  const body = [...paths].map(([fill, d]) => `<path fill="${fill}" d="${d}"/>`).join('');
  return `<svg class="ico" style="--iw:${w};--ih:${grid.length}" viewBox="0 0 ${w} ${grid.length}" shape-rendering="crispEdges" aria-hidden="true" focusable="false">${body}</svg>`;
}

export function icon(id) {
  if (!cache.has(id)) cache.set(id, toSvg(id));
  return cache.get(id);
}

// Replaces <span data-icon="name"></span> placeholders with the inline SVG.
export function hydrateIcons(root = document) {
  for (const el of root.querySelectorAll('[data-icon]')) {
    el.innerHTML = icon(el.dataset.icon);
    el.removeAttribute('data-icon');
  }
}

// Shared by the browser and the authoritative replay server.
export const RULES_VERSION = 2;
export const STAGES = {
  cipo: {goal: 80, next: 'rio', hazard: 'kite', zones: ['Bairro', 'Praça da igreja', 'Arraiá']},
  rio: {goal: 100, next: 'brasilia', hazard: 'gull', zones: ['Orla', 'Baía', 'Serra']},
  brasilia: {
    goal: 120,
    next: 'amazonia',
    hazard: 'drone',
    zones: ['Eixão', 'Esplanada', 'Congresso'],
  },
  amazonia: {
    goal: 150,
    next: null,
    hazard: 'boitata',
    zones: ['Margem do rio', 'Copas', 'Trilha do Boitatá'],
  },
};
const power = (name, kind, duration, cooldown, color, description) => ({
  name,
  kind,
  duration,
  cooldown,
  color,
  description,
});
export const POWERS = {
  mandrake: power('Passinho intocável', 'phase', 3, 22, 0x63e9ef, 'Atravesse perigos por 3 s.'),
  clt: power('Pausa remunerada', 'slow', 5, 22, 0x77a7ba, 'Desacelere o cenário por 5 s.'),
  maker: power(
    'Laser do protótipo',
    'laser',
    2,
    22,
    0x65f7c4,
    'O laser desmonta canos à sua frente.',
  ),
  obra: power('Marreta da obra', 'smash', 3, 24, 0xffb742, 'Demolição de canos próximos por 3 s.'),
  craque: power('Chute RECEBA', 'ball', 2, 20, 0xffffff, 'Chute uma bola que quebra até 2 canos.'),
  praia: power('Onda de mate', 'wave', 4, 23, 0x48d1ee, 'Uma onda limpa os perigos próximos.'),
  delivery: power(
    'Moto expressa',
    'bike',
    4,
    28,
    0xff8b38,
    'Moto, velocidade dobrada e proteção total por 4 s.',
  ),
  maromba: power('Tá pago!', 'smash', 4, 27, 0xb393ff, 'Quebre os canos com a força do shape.'),
  coroa: power('Decreto real', 'wide', 6, 25, 0xffdc66, 'Abra espaço: os vãos aumentam por 6 s.'),
  babe: power('Coragem do sítio', 'shield', 5, 24, 0xffd2ae, 'Proteção contra colisões por 5 s.'),
  porky: power(
    'Por hoje é só!',
    'slow',
    6,
    26,
    0x75a8ff,
    'Ganhe tempo para passar pelos obstáculos.',
  ),
  piggy: power('Golpe de diva', 'wave', 3, 22, 0xff8de0, 'Uma onda rosa quebra perigos próximos.'),
  piglet: power('Pequeno gigante', 'tiny', 6, 22, 0xff9db9, 'Fique pequeno para caber nos vãos.'),
  peppa: power(
    'Poça saltitante',
    'shield',
    4,
    22,
    0xee6678,
    'Bolha de lama protege contra colisões.',
  ),
  rabico: power(
    'Goiabada voadora',
    'jam',
    3,
    22,
    0xd55f80,
    'Lance goiabada e destrua até 2 canos.',
  ),
  torresmo: power('Escapada da panela', 'phase', 4, 25, 0xf39e6f, 'Fique intangível por 4 s.'),
  gobbato: power('Chute Avanti', 'ball', 3, 22, 0x51db79, 'Bola verde destrói até 2 canos.'),
  spiderham: power(
    'Teia da vizinhança',
    'web',
    6,
    24,
    0xe7efff,
    'Teias abrem vãos e paralisam inimigos.',
  ),
  waddles: power(
    'Anomalia de Gravity',
    'wide',
    5,
    23,
    0xba9aff,
    'Distorça os vãos para abrir passagem.',
  ),
  hamm: power(
    'Cofrinho magnético',
    'magnet',
    6,
    22,
    0xffd44c,
    'Puxe moedas à distância e ganhe proteção.',
  ),
  hawk: power('Banquete das sobras', 'eat', 4, 24, 0x87e5aa, 'Engula os perigos próximos.'),
  queijo: power(
    'Chuva de queijo',
    'cheese',
    3,
    23,
    0xffd44b,
    'Atire queijo para destruir até 3 canos.',
  ),
};
export const powerFor = run => POWERS[run.skinId] || POWERS.mandrake;
export const activePower = run => (run.powerUntil > run.tick ? powerFor(run).kind : '');
export const protectedPower = run =>
  ['phase', 'bike', 'shield', 'magnet', 'smash', 'wave', 'eat'].includes(activePower(run));
export const hitRadius = run => (activePower(run) === 'tiny' ? 0.32 : 0.65);
export const effectiveGate = (run, gate) =>
  ['wide', 'web'].includes(activePower(run)) ? {...gate, gap: gate.gap + 2.2} : gate;
export function speedFor(run) {
  const base = {easy: 4.5, normal: 5.8, hard: 8.2}[run.level];
  const growth = (run.tick / 120) * 0.0015 + run.passed * 0.006 + run.coins * 0.001;
  const cap = {easy: 1.65, normal: 2, hard: 2.35}[run.level];
  const modifier = activePower(run) === 'bike' ? 2 : activePower(run) === 'slow' ? 0.55 : 1;
  return base * Math.min(cap, 1 + growth) * modifier;
}
export function activatePower(run) {
  if (run.dead || run.tick < run.powerReady) return false;
  const p = powerFor(run);
  run.powerUntil = run.tick + p.duration * 120;
  run.powerReady = run.tick + p.cooldown * 120;
  if (['cheese', 'jam', 'ball', 'laser'].includes(p.kind)) {
    run.projectiles.push({
      id: ++run.shotSerial,
      x: 0.8,
      y: run.y,
      kind: p.kind,
      hits: p.kind === 'cheese' ? 3 : 2,
      life: 240,
    });
  }
  return true;
}

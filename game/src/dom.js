// Thin DOM helpers. `$` fails loudly when index.html and the code drift apart.
export const $ = id => {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Elemento #${id} não existe no index.html`);
  return el;
};

let toastTimer;
export function toast(text) {
  $('toast').textContent = text;
  $('toast').classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $('toast').classList.remove('visible'), 3600);
}

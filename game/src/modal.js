import {$} from './dom.js';

// The pause / game-over / duel-result dialog. The continue button is shown separately.
export function showModal({
  eyebrow,
  title,
  text,
  results = false,
  resume = false,
  retry = false,
  note = '',
}) {
  $('modal-eyebrow').textContent = eyebrow;
  $('modal-title').textContent = title;
  $('modal-text').textContent = text;
  $('results').hidden = !results;
  $('resume').hidden = !resume;
  $('retry').hidden = !retry;
  $('continue-run').hidden = true;
  $('continue-note').textContent = note;
}

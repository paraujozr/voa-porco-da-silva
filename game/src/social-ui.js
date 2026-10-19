import {PIGS} from './config.js';
const $ = id => document.getElementById(id);
export function socialUI(session, {toast, onRoom, onLeave}) {
  let unsubBoard,
    unsubRoom,
    room = null;
  const show = id => {
    $(id).hidden = false;
    $(id).querySelector('button,input')?.focus();
  };
  const close = id => {
    $(id).hidden = true;
  };
  const safe = async (fn, button) => {
    if (button) button.disabled = true;
    try {
      await fn();
    } catch (e) {
      toast(e.message.replace(/^Firebase: /, ''));
    } finally {
      if (button) button.disabled = false;
      render();
      if (room) renderRoom(room);
    }
  };
  let authMode = 'login';
  function render() {
    const p = session.data;
    $('account-button').textContent = session.user ? p.nickname : 'ENTRAR / PERFIL';
    $('profile-name').textContent = p.nickname;
    if (document.activeElement !== $('nickname')) $('nickname').value = p.nickname;
    $('quick-play').textContent = session.user ? 'VOLTAR AO JOGO' : 'JOGAR RÁPIDO';
    $('profile-mode').textContent = session.user
      ? 'Conta do jogo • progresso salvo online'
      : 'Convidado • progresso neste navegador';
    $('profile-best').textContent = `${Math.max(0, ...Object.values(p.best))} canos`;
    $('profile-coins').textContent = p.coins;
    $('profile-earned').textContent = p.totalCoins || 0;
    $('profile-skins').textContent =
      `${PIGS.filter(x => !x.cost || p.unlocked.includes(x.id)).length} / ${PIGS.length}`;
    $('profile-runs').textContent = p.runs || 0;
    $('logout').hidden = !session.user;
    $('account-form').hidden = !!session.user;
    $('cloud-note').textContent =
      session.cloudError ||
      (!session.configured
        ? 'Online em preparação. Jogar Rápido está disponível.'
        : 'Conta com nome e senha salva seu progresso. Duelo também funciona como convidado, sem cadastro.');
    const active = room && ['waiting', 'racing'].includes(room.state);
    $('room-create').disabled = !session.configured || active;
    $('room-join').disabled = !session.configured || active;
    $('room-hint').textContent = session.configured
      ? 'Basta internet e um amigo. Crie uma sala ou digite o código. Não precisa de conta.'
      : 'Servidor online ainda não publicado.';
    $('logout').disabled = !!active;
    $('account-submit').disabled = !!active;
  }
  function mode(value) {
    authMode = value;
    $('auth-login').setAttribute('aria-pressed', String(value === 'login'));
    $('auth-register').setAttribute('aria-pressed', String(value === 'register'));
    $('auth-password').autocomplete = value === 'login' ? 'current-password' : 'new-password';
    $('account-submit').textContent =
      value === 'register'
        ? 'CRIAR MEU PERFIL ↗'
        : value === 'recover'
          ? 'REDEFINIR SENHA'
          : 'ENTRAR NO HANGAR ↗';
    $('recovery-input-wrap').hidden = value !== 'recover';
    $('auth-recovery').required = value === 'recover';
    $('auth-status').textContent =
      value === 'register'
        ? 'Seu usuário identifica a conta. Você pode mudar o apelido depois. O progresso de convidado permanece neste navegador.'
        : '';
  }
  $('auth-login').onclick = () => mode('login');
  $('auth-register').onclick = () => mode('register');
  $('auth-recover').onclick = () => mode('recover');
  $('account-form').onsubmit = async e => {
    e.preventDefault();
    if (room && ['waiting', 'racing'].includes(room.state)) {
      toast('Saia do duelo antes de trocar de conta.');
      return;
    }
    $('account-submit').disabled = true;
    $('auth-status').textContent = 'Conectando…';
    try {
      const result = await session.login(
        $('auth-username').value.trim(),
        $('auth-password').value,
        authMode,
        $('auth-recovery').value.trim(),
      );
      $('auth-password').value = '';
      $('auth-recovery').value = '';
      $('auth-status').textContent = '';
      if (result.recovery) {
        $('recovery-code').value = result.recovery;
        $('recovery-panel').hidden = false;
      }
      render();
    } catch (err) {
      $('auth-status').textContent = err.message;
    } finally {
      $('account-submit').disabled = false;
    }
  };
  $('recovery-saved').onclick = () => {
    $('recovery-panel').hidden = true;
    $('recovery-code').value = '';
  };
  $('account-button').onclick = () => {
    render();
    show('profile-panel');
  };
  $('profile-close').onclick = () => close('profile-panel');
  $('quick-play').onclick = () => close('profile-panel');
  $('nickname-form').onsubmit = e => {
    e.preventDefault();
    safe(() => session.name($('nickname').value), $('nickname-save'));
  };
  $('logout').onclick = () =>
    safe(async () => {
      await session.logout();
      $('recovery-panel').hidden = true;
      $('recovery-code').value = '';
    }, $('logout'));
  function leaderboard() {
    unsubBoard?.();
    $('podium').replaceChildren();
    $('ranking-list').replaceChildren();
    $('ranking-status').textContent = 'Carregando…';
    unsubBoard = session.board(
      $('ranking-level').value,
      entries => {
        $('ranking-status').textContent = entries.length
          ? 'Melhores voos sem continue. Atualização em tempo real.'
          : 'Nenhuma partida registrada ainda. Seja o primeiro!';
        $('podium').replaceChildren();
        $('ranking-list').replaceChildren();
        for (const [i, p] of entries.entries()) {
          const row = document.createElement(i < 3 ? 'div' : 'li');
          row.className = i < 3 ? `podium-place place-${i + 1}` : 'ranking-row';
          const name = document.createElement('strong'),
            score = document.createElement('span');
          name.textContent = `${i < 3 ? ['🥇', '🥈', '🥉'][i] : `${i + 1}.`} ${p.nickname}`;
          score.textContent = `${p.distance} canos`;
          row.append(name, score);
          (i < 3 ? $('podium') : $('ranking-list')).append(row);
        }
      },
      msg => ($('ranking-status').textContent = msg),
    );
  }
  $('ranking-open').onclick = () => {
    show('ranking-panel');
    leaderboard();
  };
  $('ranking-close').onclick = () => {
    close('ranking-panel');
    unsubBoard?.();
  };
  $('ranking-level').onchange = leaderboard;
  function renderRoom(r) {
    room = r;
    $('room-code-display').textContent = r.code;
    $('room-players').replaceChildren();
    for (const [uid, p] of Object.entries(r.players)) {
      const el = document.createElement('p');
      el.textContent = `${p.nickname}${uid === session.uid ? ' (você)' : ''} — ${p.state === 'done' ? `${p.distance} canos · terminou` : r.state === 'waiting' ? (p.ready ? 'pronto' : 'aguardando') : `${p.distance} canos`}`;
      $('room-players').append(el);
    }
    $('room-ready').hidden = r.state !== 'waiting';
    $('room-ready').disabled = !!r.players[session.uid]?.ready;
    $('room-status').textContent =
      r.state === 'waiting'
        ? r.members.length === 1
          ? 'Compartilhe o código com um amigo.'
          : 'Ambos precisam clicar em Pronto.'
        : r.state === 'racing'
          ? 'Largada sincronizada. Boa sorte!'
          : r.state === 'cancelled'
            ? 'Sala cancelada.'
            : r.winner === 'draw'
              ? 'Empate!'
              : `Vencedor: ${r.players[r.winner]?.nickname || '—'}`;
    onRoom(r);
  }
  function bind(r) {
    unsubRoom?.();
    renderRoom(r);
    $('room-lobby').hidden = false;
    unsubRoom = session.watchRoom(r.code, renderRoom, toast);
  }
  $('duel-open').onclick = () => {
    render();
    show('duel-panel');
  };
  $('duel-close').onclick = () => {
    close('duel-panel');
  };
  $('room-create').onclick = () =>
    safe(async () => bind((await session.call('createRoom')).room), $('room-create'));
  $('room-join').onclick = () =>
    safe(
      async () => bind((await session.call('joinRoom', {code: $('room-code').value.trim()})).room),
      $('room-join'),
    );
  $('room-ready').onclick = () =>
    safe(
      async () => renderRoom((await session.call('readyRoom', {code: room.code})).room),
      $('room-ready'),
    );
  $('room-leave').onclick = () =>
    safe(async () => {
      if (room) await session.call('leaveRoom', {code: room.code});
      unsubRoom?.();
      room = null;
      $('room-lobby').hidden = true;
      onLeave();
    }, $('room-leave'));
  render();
  return {
    render,
    hasRoom: () => room && ['waiting', 'racing'].includes(room.state),
    showRoom: () => show('duel-panel'),
    releaseRoom: () => {
      unsubRoom?.();
      unsubRoom = null;
      room = null;
      $('room-lobby').hidden = true;
      close('duel-panel');
      render();
    },
    hide: () => {
      close('profile-panel');
      close('duel-panel');
    },
    updateRoom: renderRoom,
    dispose: () => {
      unsubBoard?.();
      unsubRoom?.();
    },
  };
}

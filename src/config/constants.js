(function (Voa) {
    'use strict';

    const STORAGE_KEY = 'voaPorcoBest';

    const PHYSICS = {
        gravity: -24,
        jumpStrength: 9.2,
        startY: 2.0,
        floorY: -5.2,
        // Topo visível da tela (o porco encosta e é segurado, não morre)
        ceilingY: 6.2,
    };

    const PIG = {
        x: -2.5,
        // Hitbox: círculo menor que o porco desenhado (corpo e cabeça, sem focinho,
        // orelhas, pernas ou acessórios), relativo ao centro do modelo.
        hitRadius: 0.75,
        hitOffsetX: 0.1,
        hitOffsetY: 0.05,
    };

    const OBSTACLES = {
        gapSize: 4.3,
        spawnX: 22,
        despawnX: -20,
        speed: 7.8,
        spawnInterval: 1.85,
        firstSpawnDelay: 1.6,
        pipeHeight: 60, // longo o bastante para cobrir qualquer tela, inclusive muito altas
        pipeRadius: 1.15,
        capRadius: 1.32,
        capHeight: 0.55,
    };

    // Ordem de desenho: cenário (0) -> canos -> bocas dos canos -> porco por cima de tudo.
    const RENDER_ORDER = { pipe: 1, cap: 2, pig: 3 };

    const GAME_STATES = {
        MENU: 'MENU',
        PLAYING: 'PLAYING',
        GAMEOVER: 'GAMEOVER',
    };

    const COMPACT_MENU_WIDTH = 680;

    Voa.constants = {STORAGE_KEY, PHYSICS, PIG, OBSTACLES, GAME_STATES, RENDER_ORDER, COMPACT_MENU_WIDTH};
})(window.Voa = window.Voa || {});

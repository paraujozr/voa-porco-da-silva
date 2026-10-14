(function (Voa) {
    'use strict';

    const STORAGE_KEY = 'voaPorcoBest';

    const PHYSICS = {
        gravity: -24,
        jumpStrength: 9.2,
        startY: 2.0,
        floorY: -5.2,
        ceilingY: 11.5,
    };

    const PIG = {
        x: -2.5,
        collisionRadius: 0.85,
        hitWidth: 1.85,
    };

    const OBSTACLES = {
        gapSize: 4.3,
        spawnX: 22,
        despawnX: -20,
        speed: 7.8,
        spawnInterval: 1.85,
        firstSpawnDelay: 1.6,
        pipeHeight: 14,
    };

    const GAME_STATES = {
        MENU: 'MENU',
        PLAYING: 'PLAYING',
        GAMEOVER: 'GAMEOVER',
    };

    const COMPACT_MENU_WIDTH = 680;

    Voa.constants = {STORAGE_KEY, PHYSICS, PIG, OBSTACLES, GAME_STATES, COMPACT_MENU_WIDTH};
})(window.Voa = window.Voa || {});

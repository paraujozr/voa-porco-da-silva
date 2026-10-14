(function (Voa) {
    'use strict';

    const { createGame, lockZoom } = Voa;

    lockZoom();
    createGame(document.getElementById('canvas-container')).init();
})(window.Voa = window.Voa || {});

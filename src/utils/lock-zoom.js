(function (Voa) {
    'use strict';

    // O Safari do iPhone ignora `user-scalable=no`, então o zoom é bloqueado também por eventos:
    // pinça (gesture*), dois dedos e dblclick. O toque duplo já é
    // barrado pelo `touch-action: none` do CSS (sem cancelar cliques rápidos nos botões).
    function lockZoom() {
        const block = (e) => e.preventDefault();

        for (const type of ['gesturestart', 'gesturechange', 'gestureend']) {
            document.addEventListener(type, block, { passive: false });
        }

        document.addEventListener('touchmove', (e) => {
            if (e.touches.length > 1) e.preventDefault();
        }, { passive: false });

        document.addEventListener('dblclick', block);
    }

    Voa.lockZoom = lockZoom;
})(window.Voa = window.Voa || {});

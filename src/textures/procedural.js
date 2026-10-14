(function (Voa) {
    'use strict';

    function createCanvas(size) {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        return { canvas, ctx: canvas.getContext('2d') };
    }

    function createCopacabanaTexture() {
        const { canvas, ctx } = createCanvas(512);

        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(0, 0, 512, 512);

        ctx.fillStyle = '#1e293b';
        for (let y = 0; y < 512; y += 128) {
            ctx.beginPath();
            for (let x = 0; x <= 512; x += 16) {
                const wave = Math.sin((x / 512) * Math.PI * 4) * 28;
                if (x === 0) ctx.moveTo(x, y + wave);
                else ctx.lineTo(x, y + wave);
            }
            for (let x = 512; x >= 0; x -= 16) {
                const wave = Math.sin((x / 512) * Math.PI * 4) * 28;
                ctx.lineTo(x, y + wave + 56);
            }
            ctx.closePath();
            ctx.fill();
        }

        const tex = new THREE.CanvasTexture(canvas);
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(25, 25);
        return tex;
    }

    function createPipeTexture() {
        const { canvas, ctx } = createCanvas(256);

        // Gradiente metálico verde/amarelo Brasil
        const grad = ctx.createLinearGradient(0, 0, 256, 0);
        grad.addColorStop(0, '#047857');
        grad.addColorStop(0.35, '#10b981');
        grad.addColorStop(0.5, '#6ee7b7');
        grad.addColorStop(0.7, '#059669');
        grad.addColorStop(1, '#064e3b');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 256, 256);

        // Faixas amarelas decorativas
        ctx.fillStyle = '#facc15';
        ctx.fillRect(0, 20, 256, 16);
        ctx.fillRect(0, 220, 256, 16);

        return new THREE.CanvasTexture(canvas);
    }

    Voa.textures = {createCopacabanaTexture, createPipeTexture};
})(window.Voa = window.Voa || {});

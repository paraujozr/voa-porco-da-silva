(function (Voa) {
    'use strict';

    const { createPipeTexture } = Voa.textures;
    const { OBSTACLES, PIG } = Voa.constants;

    const POOL_SIZE = 5;
    const GAP_RANGE = 5.2;
    const GAP_OFFSET = 1.2;

    // Círculo (hitbox do porco) contra retângulo (cano ou boca do cano).
    function circleHitsRect(cx, cy, r, minX, maxX, minY, maxY) {
        const nearestX = Math.max(minX, Math.min(cx, maxX));
        const nearestY = Math.max(minY, Math.min(cy, maxY));
        const dx = cx - nearestX;
        const dy = cy - nearestY;
        return dx * dx + dy * dy < r * r;
    }

    function createObstacleField(scene) {
        const active = [];
        const pool = [];
        let spawnTimer = 0;

        // Geometrias e materiais únicos, compartilhados por todos os canos.
        const pipeGeo = new THREE.CylinderGeometry(OBSTACLES.pipeRadius, OBSTACLES.pipeRadius, OBSTACLES.pipeHeight, 20);
        const capGeo = new THREE.CylinderGeometry(OBSTACLES.capRadius, OBSTACLES.capRadius, OBSTACLES.capHeight, 20);
        const pipeMat = new THREE.MeshLambertMaterial({ map: createPipeTexture() });
        const capMat = new THREE.MeshLambertMaterial({ color: 0xffdf00 });

        // Par de canos reaproveitável: [cano de baixo, boca de baixo, cano de cima, boca de cima]
        function createPair() {
            const group = new THREE.Group();
            const parts = {
                bottomPipe: new THREE.Mesh(pipeGeo, pipeMat),
                bottomCap: new THREE.Mesh(capGeo, capMat),
                topPipe: new THREE.Mesh(pipeGeo, pipeMat),
                topCap: new THREE.Mesh(capGeo, capMat),
            };
            group.add(parts.bottomPipe, parts.bottomCap, parts.topPipe, parts.topCap);
            group.visible = false;
            scene.add(group);
            return { group, parts, gapCenter: 0, bottomEdge: 0, topEdge: 0, passed: false };
        }

        for (let i = 0; i < POOL_SIZE; i++) pool.push(createPair());

        function spawn() {
            const pair = pool.pop() || createPair();
            const { gapSize, pipeHeight, capHeight } = OBSTACLES;

            pair.gapCenter = (Math.random() - 0.5) * GAP_RANGE + GAP_OFFSET;
            pair.bottomEdge = pair.gapCenter - gapSize / 2;
            pair.topEdge = pair.gapCenter + gapSize / 2;
            pair.passed = false;

            pair.parts.bottomPipe.position.y = pair.bottomEdge - pipeHeight / 2;
            pair.parts.bottomCap.position.y = pair.bottomEdge - capHeight / 2;
            pair.parts.topPipe.position.y = pair.topEdge + pipeHeight / 2;
            pair.parts.topCap.position.y = pair.topEdge + capHeight / 2;

            pair.group.position.x = OBSTACLES.spawnX;
            pair.group.visible = true;
            active.push(pair);
        }

        function release(index) {
            const [pair] = active.splice(index, 1);
            pair.group.visible = false;
            pool.push(pair);
        }

        function clear() {
            while (active.length) release(active.length - 1);
        }

        function reset() {
            clear();
            spawnTimer = OBSTACLES.firstSpawnDelay;
        }

        function collides(pair, pigY) {
            const { pipeRadius, capRadius, capHeight, pipeHeight } = OBSTACLES;
            const cx = PIG.x + PIG.hitOffsetX;
            const cy = pigY + PIG.hitOffsetY;
            const r = PIG.hitRadius;
            const x = pair.group.position.x;

            if (Math.abs(x - cx) > capRadius + r) return false;

            return (
                circleHitsRect(cx, cy, r, x - pipeRadius, x + pipeRadius, pair.bottomEdge - pipeHeight, pair.bottomEdge) ||
                circleHitsRect(cx, cy, r, x - capRadius, x + capRadius, pair.bottomEdge - capHeight, pair.bottomEdge) ||
                circleHitsRect(cx, cy, r, x - pipeRadius, x + pipeRadius, pair.topEdge, pair.topEdge + pipeHeight) ||
                circleHitsRect(cx, cy, r, x - capRadius, x + capRadius, pair.topEdge, pair.topEdge + capHeight)
            );
        }

        /**
         * Avança os canos e dispara `onCollide` / `onPass` conforme o porco (em `pigY`)
         * interage com eles. `isPlaying` evita pontuar depois de uma colisão no mesmo frame.
         */
        function update(dt, pigY, { onCollide, onPass, isPlaying }) {
            spawnTimer += dt;
            if (spawnTimer > OBSTACLES.spawnInterval) {
                spawnTimer = 0;
                spawn();
            }

            for (let i = active.length - 1; i >= 0; i--) {
                const pair = active[i];
                pair.group.position.x -= OBSTACLES.speed * dt;

                if (collides(pair, pigY)) onCollide();

                if (isPlaying() && !pair.passed && pair.group.position.x < PIG.x) {
                    pair.passed = true;
                    onPass();
                }

                if (pair.group.position.x < OBSTACLES.despawnX) release(i);
            }
        }

        return { reset, clear, update };
    }

    Voa.createObstacleField = createObstacleField;
})(window.Voa = window.Voa || {});

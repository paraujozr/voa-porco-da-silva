(function (Voa) {
    'use strict';

    const { createPipeTexture } = Voa.textures;
    const { OBSTACLES, PIG } = Voa.constants;

    function createObstacleField(scene) {
        const items = [];
        let spawnTimer = 0;

        const pipeMat = new THREE.MeshStandardMaterial({
            map: createPipeTexture(),
            roughness: 0.35,
            metalness: 0.25,
        });
        const capMat = new THREE.MeshStandardMaterial({ color: 0xffdf00, roughness: 0.3, metalness: 0.2 });

        function buildPipe(centerY, capY) {
            const pipe = new THREE.Mesh(
                new THREE.CylinderGeometry(1.15, 1.15, OBSTACLES.pipeHeight, 24),
                pipeMat
            );
            pipe.position.y = centerY;
            pipe.castShadow = true;
            pipe.receiveShadow = true;

            const cap = new THREE.Mesh(new THREE.CylinderGeometry(1.32, 1.32, 0.55, 24), capMat);
            cap.position.y = capY;
            cap.castShadow = true;
            return [pipe, cap];
        }

        function spawn() {
            const { gapSize, pipeHeight } = OBSTACLES;
            const gapCenter = (Math.random() - 0.5) * 5.2 + 1.2;

            const group = new THREE.Group();
            group.position.x = OBSTACLES.spawnX;

            const bottomEdge = gapCenter - gapSize / 2;
            const topEdge = gapCenter + gapSize / 2;
            group.add(
                ...buildPipe(bottomEdge - pipeHeight / 2, bottomEdge - 0.27),
                ...buildPipe(topEdge + pipeHeight / 2, topEdge + 0.27)
            );

            scene.add(group);
            items.push({ group, gapCenter, gapSize, passed: false });
        }

        function clear() {
            for (const obs of items) scene.remove(obs.group);
            items.length = 0;
        }

        function reset() {
            clear();
            spawnTimer = OBSTACLES.firstSpawnDelay;
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

            for (let i = items.length - 1; i >= 0; i--) {
                const obs = items[i];
                obs.group.position.x -= OBSTACLES.speed * dt;

                const dx = Math.abs(obs.group.position.x - PIG.x);
                if (dx < PIG.hitWidth) {
                    const topLimit = obs.gapCenter + obs.gapSize / 2 - PIG.collisionRadius;
                    const bottomLimit = obs.gapCenter - obs.gapSize / 2 + PIG.collisionRadius;
                    if (pigY > topLimit || pigY < bottomLimit) onCollide();
                }

                if (isPlaying() && !obs.passed && obs.group.position.x < PIG.x) {
                    obs.passed = true;
                    onPass();
                }

                if (obs.group.position.x < OBSTACLES.despawnX) {
                    scene.remove(obs.group);
                    items.splice(i, 1);
                }
            }
        }

        return { reset, clear, update };
    }

    Voa.createObstacleField = createObstacleField;
})(window.Voa = window.Voa || {});

(function (Voa) {
    'use strict';

    const { CHARACTERS, playSound, createWorld, createPig, createObstacleField, ui } = Voa;
    const { COMPACT_MENU_WIDTH, GAME_STATES, PHYSICS, PIG, STORAGE_KEY } = Voa.constants;
    const { readNumber, writeNumber } = Voa.storage;

    const { MENU, PLAYING, GAMEOVER } = GAME_STATES;

    const NARROW_ASPECT = 1.3; // abaixo disso (retrato) a câmera do jogo é reenquadrada
    const BUNTING_PX = 46; // altura das bandeirinhas no topo
    const PIG_VIEW_WIDTH = 4.0; // largura aproximada do porco girando, em unidades 3D
    const PIG_VIEW_HEIGHT = 3.5; // altura (chapéu até casquinhos) mais o balanço


    function createGame(container) {
        const world = createWorld(container);
        const pig = createPig(world.scene);
        const obstacles = createObstacleField(world.scene);
        const clock = new THREE.Clock();

        // Enquadramento calculado a partir do tamanho da tela (ver layoutCameras).
        const gameCamera = { position: new THREE.Vector3(), target: new THREE.Vector3() };
        const menuView = { dist: 10, y: 1.35 };
        let menuLayoutDirty = true;

        const halfFovTan = () => Math.tan(THREE.MathUtils.degToRad(world.camera.fov / 2));

        let state = MENU;
        let characterIndex = 0;
        let score = 0;
        let bestScore = readNumber(STORAGE_KEY);
        let pigY = 0;
        let pigVelocity = 0;

        // Criado uma vez só, para não gerar lixo a cada frame.
    const obstacleCallbacks = {
        onCollide: () => gameOver(),
        onPass: () => addPoint(),
        isPlaying: () => state === PLAYING,
    };

    // Tecla H liga/desliga a visualização da hitbox (para ajustar a jogabilidade).
    const hitboxDebug = new THREE.Mesh(
        new THREE.CircleGeometry(PIG.hitRadius, 32),
        new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.4, depthTest: false })
    );
    hitboxDebug.visible = false;
    hitboxDebug.renderOrder = 10;
    hitboxDebug.position.z = 2;
    world.scene.add(hitboxDebug);

    function updateHitboxDebug() {
        hitboxDebug.position.x = PIG.x + PIG.hitOffsetX;
        hitboxDebug.position.y = pigY + PIG.hitOffsetY;
    }

    const currentCharacter = () => CHARACTERS[characterIndex];

        // ---------- Ações ----------
        function selectCharacter(delta) {
            characterIndex = (characterIndex + delta + CHARACTERS.length) % CHARACTERS.length;
            ui.showCharacter(currentCharacter());
            menuLayoutDirty = true;
            pig.setCharacter(currentCharacter());
            playSound('flap');
        }

        function start() {
            state = PLAYING;
            score = 0;
            pigY = PHYSICS.startY;
            pigVelocity = PHYSICS.jumpStrength * 0.8;
            pig.group.rotation.set(0, 0, 0);
            obstacles.reset();

            ui.setScore(score);
            ui.showPlaying();
            playSound('flap');
        }

        function backToMenu() {
            state = MENU;
            obstacles.clear();
            ui.showMenu();
            menuLayoutDirty = true;
        }

        function flap() {
            if (state !== PLAYING) return;
            pigVelocity = PHYSICS.jumpStrength;
            playSound('flap');
        }

        function gameOver() {
            if (state !== PLAYING) return;
            state = GAMEOVER;
            playSound('hit');

            if (score > bestScore) {
                bestScore = score;
                writeNumber(STORAGE_KEY, bestScore);
                ui.setBest(bestScore);
            }

            ui.showGameOver({ phrase: currentCharacter().crashMsg, score, best: bestScore });
        }

        function addPoint() {
            score++;
            ui.setScore(score);
            playSound('score');
        }

        // ---------- Enquadramento da câmera ----------
        // Em telas estreitas o porco (fixo à esquerda) ficava cortado: afastamos a câmera
        // e deslocamos o alvo para que ele apareça inteiro a ~22% da largura da tela.
        function layoutGameCamera() {
            const aspect = window.innerWidth / window.innerHeight;
            let lookX = 1.5;
            let dist = 16.5;
            if (aspect < NARROW_ASPECT) {
                const visibleWidth = 13;
                dist = Math.max(dist, visibleWidth / (2 * halfFovTan() * aspect));
                lookX = PIG.x + 0.28 * 2 * halfFovTan() * dist * aspect;
            }
            gameCamera.position.set(lookX - 3.5, 1.5, dist);
            gameCamera.target.set(lookX, 1.0, 0);
        }

        // No mobile o painel ocupa a parte de baixo; o porco usa o espaço livre acima dele
        // (entre as bandeirinhas e o painel), no maior tamanho que couber na tela.
        function layoutMenuView() {
            menuLayoutDirty = false;
            const W = window.innerWidth;
            const H = window.innerHeight;
            const topPx = BUNTING_PX + 4;
            const regionPx = Math.max(120, ui.menuTop() - 8 - topPx);
            const tan = halfFovTan();

            let pxPerUnit = Math.min(regionPx / PIG_VIEW_HEIGHT, (0.94 * W) / PIG_VIEW_WIDTH);
            const dist = THREE.MathUtils.clamp(H / (2 * tan * pxPerUnit), 7, 16);
            pxPerUnit = H / (2 * tan * dist);

            const centerPx = topPx + regionPx / 2;
            menuView.dist = dist;
            menuView.y = 1 + (H / 2 - centerPx) / pxPerUnit;
        }

        // ---------- Atualização por estado ----------
        function updateMenu(elapsed) {
            // Câmera de perto no porco girando, para exibir a profissão
            const compact = window.innerWidth <= COMPACT_MENU_WIDTH;
            const { camera } = world;
            if (compact && menuLayoutDirty) layoutMenuView();

            camera.position.set(0, 1, compact ? menuView.dist : 10);
            camera.lookAt(0, 1, 0);

            const halfHeight = halfFovTan() * camera.position.z;
            const previewX = compact ? 0 : halfHeight * camera.aspect * 0.48;
            const previewY = compact ? menuView.y : 1.35;

            pig.group.position.set(previewX, previewY + Math.sin(elapsed * 3) * 0.14, 0);
            pig.group.rotation.set(0, Math.sin(elapsed * 1.2) * 0.65 - 0.35, 0);
        }

        function updatePlaying(dt) {
            // Câmera vai para a visão lateral de jogo
            world.camera.position.lerp(gameCamera.position, 0.08);
            world.camera.lookAt(gameCamera.target);

            pigVelocity += PHYSICS.gravity * dt;
            pigY += pigVelocity * dt;

            pig.group.position.set(PIG.x, pigY, 0);
            pig.group.rotation.y = 0;
            pig.group.rotation.z = THREE.MathUtils.clamp(pigVelocity * 0.06, -0.7, 0.55);

            // Encostar no topo da tela não mata: o porco só é segurado ali.
            if (pigY > PHYSICS.ceilingY) {
                pigY = PHYSICS.ceilingY;
                pigVelocity = Math.min(pigVelocity, 0);
                pig.group.position.y = pigY;
            }
            if (pigY < PHYSICS.floorY) gameOver();

            obstacles.update(dt, pigY, obstacleCallbacks);
            updateHitboxDebug();
        }

        function updateGameOver(dt) {
            // Porco gira caindo ao bater
            if (pig.group.position.y > PHYSICS.floorY) {
                pig.group.position.y -= 9 * dt;
                pig.group.rotation.z -= 5 * dt;
                pig.group.rotation.x += 3 * dt;
            }
        }

        function frame() {
            requestAnimationFrame(frame);
            const dt = Math.min(clock.getDelta(), 0.1);
            const elapsed = clock.getElapsedTime();

            world.scroll(dt);
            pig.flapWings(elapsed, state === PLAYING ? 18 : 8);

            if (state === MENU) updateMenu(elapsed);
            else if (state === PLAYING) updatePlaying(dt);
            else updateGameOver(dt);

            world.render();
        }

        // ---------- Inicialização ----------
        function init() {
            pig.setCharacter(currentCharacter());
            ui.setBest(bestScore);
            layoutGameCamera();

            window.addEventListener('resize', () => {
                menuLayoutDirty = true;
                layoutGameCamera();
            });

            ui.on.prevCharacter(() => selectCharacter(-1));
            ui.on.nextCharacter(() => selectCharacter(1));
            ui.on.start(start);
            ui.on.retry(start);
            ui.on.backToMenu(backToMenu);

            window.addEventListener('keydown', (e) => {
            if (e.code === 'KeyH' && !e.repeat) hitboxDebug.visible = !hitboxDebug.visible;
                if (e.code === 'Space' || e.code === 'ArrowUp') {
                    e.preventDefault();
                    if (!e.repeat) flap();
                }
            });

            window.addEventListener('pointerdown', (e) => {
                if (e.target.tagName !== 'BUTTON') flap();
            });

            frame();
        }

        return { init };
    }

    Voa.createGame = createGame;
})(window.Voa = window.Voa || {});

(function (Voa) {
    'use strict';

    const { createCopacabanaTexture } = Voa.textures;

    const SKY_COLOR = 0x38bdf8;
    const CLOUD_COUNT = 10;
    const PUFFS_PER_CLOUD = 3;

    function createRenderer(container) {
        // Sem sombras nem tone mapping: o visual é cartum chapado e o jogo é simples.
        // Pixel ratio limitado e GPU padrão (não força a placa dedicada) para poupar bateria.
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        container.appendChild(renderer.domElement);
        return renderer;
    }

    function addLights(scene) {
        scene.add(new THREE.HemisphereLight(0xffffff, 0x9fd8a8, 0.85));

        const sun = new THREE.DirectionalLight(0xfffbeb, 0.8);
        sun.position.set(12, 26, 18);
        scene.add(sun);
    }

    // Calçadão de Copacabana (chão)
    function createGround(scene) {
        const material = new THREE.MeshLambertMaterial({ map: createCopacabanaTexture() });
        const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), material);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -6.5;
        scene.add(ground);
        return material;
    }

    // Todas as nuvens num único InstancedMesh: uma só chamada de desenho.
    function createClouds(scene) {
        const puffMesh = new THREE.InstancedMesh(
            new THREE.SphereGeometry(1, 8, 6),
            new THREE.MeshLambertMaterial({ color: 0xffffff }),
            CLOUD_COUNT * PUFFS_PER_CLOUD
        );
        puffMesh.frustumCulled = false; // a esfera-base fica na origem, não nas instâncias
        scene.add(puffMesh);

        const clouds = [];
        for (let i = 0; i < CLOUD_COUNT; i++) {
            const puffs = [];
            for (let j = 0; j < PUFFS_PER_CLOUD; j++) {
                puffs.push({ dx: j * 1.1, dy: Math.random() * 0.4, dz: Math.random() * 0.4, scale: 1.1 + Math.random() * 0.7 });
            }
            clouds.push({
                x: (Math.random() - 0.5) * 60,
                y: 4 + Math.random() * 8,
                z: -12 - Math.random() * 20,
                puffs,
            });
        }

        const dummy = new THREE.Object3D();
        function update(dt) {
            let index = 0;
            for (const cloud of clouds) {
                cloud.x -= dt * 1.2;
                if (cloud.x < -35) cloud.x = 35;
                for (const puff of cloud.puffs) {
                    dummy.position.set(cloud.x + puff.dx, cloud.y + puff.dy, cloud.z + puff.dz);
                    dummy.scale.setScalar(puff.scale);
                    dummy.updateMatrix();
                    puffMesh.setMatrixAt(index++, dummy.matrix);
                }
            }
            puffMesh.instanceMatrix.needsUpdate = true;
        }

        update(0);
        return { update };
    }

    function createWorld(container) {
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(SKY_COLOR);
        scene.fog = new THREE.FogExp2(SKY_COLOR, 0.018);

        const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 150);
        const renderer = createRenderer(container);
        addLights(scene);
        const groundMaterial = createGround(scene);
        const clouds = createClouds(scene);

        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });

        return {
            scene,
            camera,
            // Faz o cenário "correr" para trás
            scroll(dt) {
                groundMaterial.map.offset.x += dt * 0.45;
                clouds.update(dt);
            },
            render() {
                renderer.render(scene, camera);
            },
        };
    }

    Voa.createWorld = createWorld;
})(window.Voa = window.Voa || {});

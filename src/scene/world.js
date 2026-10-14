(function (Voa) {
    'use strict';

    const { createCopacabanaTexture } = Voa.textures;

    const SKY_COLOR = 0x38bdf8;
    const CLOUD_COUNT = 12;

    function createRenderer(container) {
        const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.1;
        container.appendChild(renderer.domElement);
        return renderer;
    }

    function addLights(scene) {
        const hemiLight = new THREE.HemisphereLight(0xffffff, 0x009c3b, 0.75);
        hemiLight.position.set(0, 30, 0);
        scene.add(hemiLight);

        const dirLight = new THREE.DirectionalLight(0xfffbeb, 1.35);
        dirLight.position.set(12, 26, 18);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.set(2048, 2048);
        dirLight.shadow.camera.near = 0.5;
        dirLight.shadow.camera.far = 70;
        const d = 18;
        dirLight.shadow.camera.left = -d;
        dirLight.shadow.camera.right = d;
        dirLight.shadow.camera.top = d;
        dirLight.shadow.camera.bottom = -d;
        scene.add(dirLight);
    }

    // Calçadão de Copacabana (chão)
    function createGround(scene) {
        const material = new THREE.MeshStandardMaterial({
            map: createCopacabanaTexture(),
            roughness: 0.8,
            metalness: 0.1,
        });
        const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), material);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -6.5;
        ground.receiveShadow = true;
        scene.add(ground);
        return material;
    }

    function createClouds(scene) {
        const clouds = [];
        const material = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 });
        for (let i = 0; i < CLOUD_COUNT; i++) {
            const cloud = new THREE.Group();
            for (let j = 0; j < 3; j++) {
                const puff = new THREE.Mesh(new THREE.SphereGeometry(1.1 + Math.random() * 0.7, 12, 12), material);
                puff.position.set(j * 1.1, Math.random() * 0.4, Math.random() * 0.4);
                cloud.add(puff);
            }
            cloud.position.set((Math.random() - 0.5) * 60, 4 + Math.random() * 8, -12 - Math.random() * 20);
            scene.add(cloud);
            clouds.push(cloud);
        }
        return clouds;
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
                for (const cloud of clouds) {
                    cloud.position.x -= dt * 1.2;
                    if (cloud.position.x < -35) cloud.position.x = 35;
                }
            },
            render() {
                renderer.render(scene, camera);
            },
        };
    }

    Voa.createWorld = createWorld;
})(window.Voa = window.Voa || {});

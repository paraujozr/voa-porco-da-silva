(function (Voa) {
    'use strict';

    // O porco olha para +x. A cabeça é uma esfera própria, encaixada à frente do corpo.
    const HEAD = { x: 0.8, y: 0.3, r: 0.8 };
    const BODY = { x: 1.34, yz: 1.05 };
    const OUTLINE_COLOR = 0x002776; // mesmo azul do contorno da interface

    // Contorno de desenho animado: casco invertido, um pouco maior, visto só por trás.
    const outlineMat = new THREE.MeshBasicMaterial({
        color: OUTLINE_COLOR,
        side: THREE.BackSide,
        toneMapped: false,
        fog: false,
    });

    function addOutline(mesh, scale = 1.06) {
        const outline = new THREE.Mesh(mesh.geometry, outlineMat);
        outline.scale.setScalar(scale);
        mesh.add(outline);
        return mesh;
    }

    function ellipsoid(radii, material) {
        const geo = new THREE.SphereGeometry(1, 20, 14);
        geo.scale(radii[0], radii[1], radii[2]);
        return new THREE.Mesh(geo, material);
    }

    // Faixa (camisa, listra refletiva) que acompanha a curva do corpo, sem recortes serrilhados.
    function bodyBand(halfWidth, scale, material) {
        const geo = new THREE.SphereGeometry(1, 28, 8, 0, Math.PI * 2, Math.PI / 2 - halfWidth, halfWidth * 2);
        geo.rotateZ(Math.PI / 2);
        geo.scale(BODY.x * scale, BODY.yz * scale, BODY.yz * scale);
        const band = new THREE.Mesh(geo, material);
        band.material.side = THREE.DoubleSide;
        band.position.set(-0.1, 0, 0);
        return band;
    }

    // Acessórios específicos de cada profissão brasileira.
    // Cada builder devolve a lista de meshes a adicionar ao grupo de acessórios.
    const ACCESSORY_BUILDERS = {
        // Capacete amarelo de pedreiro/engenheiro + faixa refletiva no colete
        hardhat() {
            const hatMat = new THREE.MeshLambertMaterial({ color: 0xfacc15 });
            const dome = new THREE.Mesh(
                new THREE.SphereGeometry(0.86, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2),
                hatMat
            );
            dome.position.set(HEAD.x - 0.05, HEAD.y + 0.4, 0);
            const brim = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 0.1, 24), hatMat);
            brim.position.set(HEAD.x + 0.08, HEAD.y + 0.4, 0);
            const ridge = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.14, 0.2), hatMat);
            ridge.position.set(HEAD.x - 0.05, HEAD.y + 1.24, 0);

            const stripe = bodyBand(0.12, 1.06, new THREE.MeshLambertMaterial({ color: 0xe2e8f0 }));
            return [dome, brim, ridge, stripe];
        },

        // Faixa branca na testa + gola verde Seleção
        headband() {
            const bandMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
            const band = new THREE.Mesh(new THREE.TorusGeometry(0.73, 0.1, 12, 32), bandMat);
            band.rotation.x = Math.PI / 2;
            band.rotation.y = 0.2;
            band.position.set(HEAD.x - 0.02, HEAD.y + 0.36, 0);

            const collarMat = new THREE.MeshLambertMaterial({ color: 0x009c3b });
            const collar = new THREE.Mesh(new THREE.TorusGeometry(0.98, 0.1, 12, 32), collarMat);
            collar.rotation.y = Math.PI / 2;
            collar.position.set(0.4, 0, 0);
            return [band, collar];
        },

        // Chapéu de palha + óculos Juliet espelhado
        strawhat() {
            const strawMat = new THREE.MeshLambertMaterial({ color: 0xfde047 });
            const brim = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.25, 0.08, 28), strawMat);
            brim.position.set(HEAD.x, HEAD.y + 0.5, 0);
            const top = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.66, 0.5, 24), strawMat);
            top.position.set(HEAD.x - 0.02, HEAD.y + 0.78, 0);
            const bandMat = new THREE.MeshLambertMaterial({ color: 0x009c3b });
            const hatBand = new THREE.Mesh(new THREE.CylinderGeometry(0.67, 0.67, 0.14, 24), bandMat);
            hatBand.position.set(HEAD.x - 0.02, HEAD.y + 0.62, 0);

            const julietMat = new THREE.MeshLambertMaterial({ color: 0x06b6d4 });
            const glasses = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 1.3), julietMat);
            glasses.position.set(HEAD.x + 0.62, HEAD.y + 0.3, 0);
            return [brim, top, hatBand, glasses];
        },

        // Capacete fechado + bag vermelha de delivery nas costas
        helmet_bag() {
            const helmetMat = new THREE.MeshLambertMaterial({ color: 0xef4444 });
            const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.93, 24, 14), helmetMat);
            helmet.position.set(HEAD.x - 0.02, HEAD.y + 0.12, 0);

            const visorMat = new THREE.MeshLambertMaterial({ color: 0x0f172a });
            const visor = new THREE.Mesh(
                new THREE.SphereGeometry(0.96, 20, 12, Math.PI - 0.75, 1.5, 1.05, 0.55),
                visorMat
            );
            visor.position.copy(helmet.position);

            const bagMat = new THREE.MeshLambertMaterial({ color: 0xdc2626 });
            const bag = new THREE.Mesh(new THREE.BoxGeometry(0.95, 1.1, 1.1), bagMat);
            bag.position.set(-1.15, 0.45, 0);
            return [helmet, visor, bag];
        },
    };

    function buildBody(group, { skinColor, shirtColor }) {
        const skin = new THREE.Color(skinColor).offsetHSL(0, 0.18, -0.07);
        const skinMat = new THREE.MeshLambertMaterial({ color: skin });
        const snoutMat = new THREE.MeshLambertMaterial({
            color: skin.clone().offsetHSL(0, 0.1, -0.05),
        });
        const shirtMat = new THREE.MeshLambertMaterial({ color: shirtColor });
        const darkMat = new THREE.MeshBasicMaterial({ color: 0x4a1230 });

        // Corpo roliço
        const body = ellipsoid([BODY.x, BODY.yz, BODY.yz], skinMat);
        group.add(addOutline(body, 1.045));

        // Roupa da profissão envolvendo a barriga
        const shirt = bodyBand(0.5, 1.04, shirtMat);
        group.add(shirt);

        // Perninhas curtas com casquinhos
        for (const x of [0.5, -0.6]) {
            for (const z of [0.5, -0.5]) {
                const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.5, 14), skinMat);
                leg.position.set(x, -1.05, z);
                const hoof = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.23, 0.14, 14), darkMat);
                hoof.position.set(x, -1.34, z);
                group.add(addOutline(leg, 1.18), hoof);
            }
        }

        // Cabeça
        const head = new THREE.Mesh(new THREE.SphereGeometry(HEAD.r, 24, 16), skinMat);
        head.position.set(HEAD.x, HEAD.y, 0);
        group.add(addOutline(head, 1.06));

        // Focinho
        const snoutGeo = new THREE.CylinderGeometry(0.4, 0.44, 0.42, 24);
        snoutGeo.rotateZ(Math.PI / 2);
        const snout = new THREE.Mesh(snoutGeo, snoutMat);
        snout.position.set(HEAD.x + 0.82, HEAD.y - 0.16, 0);
        group.add(addOutline(snout, 1.1));

        for (const side of [1, -1]) {
            // Narinas
            const nostril = ellipsoid([0.04, 0.14, 0.07], darkMat);
            nostril.position.set(HEAD.x + 1.04, HEAD.y - 0.14, side * 0.16);
            group.add(nostril);

            // Olhos grandes e expressivos
            const eye = new THREE.Mesh(
                new THREE.SphereGeometry(0.23, 18, 14),
                new THREE.MeshLambertMaterial({ color: 0xffffff })
            );
            eye.position.set(HEAD.x + 0.5, HEAD.y + 0.33, side * 0.46);
            const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.12, 14, 12), new THREE.MeshBasicMaterial({ color: 0x111111 }));
            pupil.position.set(HEAD.x + 0.63, HEAD.y + 0.36, side * 0.5);
            const shine = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffffff }));
            shine.position.set(HEAD.x + 0.7, HEAD.y + 0.43, side * 0.47);
            group.add(addOutline(eye, 1.14), pupil, shine);

            // Bochechas coradas
            const cheek = new THREE.Mesh(
                new THREE.CircleGeometry(0.17, 20),
                new THREE.MeshBasicMaterial({ color: 0xff5c8a, transparent: true, opacity: 0.75 })
            );
            cheek.position.set(HEAD.x + 0.4, HEAD.y - 0.1, side * 0.7);
            cheek.rotation.y = side > 0 ? 0.55 : Math.PI - 0.55;
            group.add(cheek);

            // Orelhas pontudas
            const ear = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.62, 14), skinMat);
            ear.position.set(HEAD.x - 0.15, HEAD.y + 0.78, side * 0.42);
            ear.rotation.set(side * 0.5, 0, -0.35);
            group.add(addOutline(ear, 1.12));
        }

        // Rabinho enrolado
        const tail = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.065, 10, 24, Math.PI * 1.7), skinMat);
        tail.position.set(-1.42, 0.2, 0);
        group.add(addOutline(tail, 1.25));
    }

    // Asas de penas: um grupo por asa, com pivô no ombro para bater para cima e para baixo.
    function buildWings(group) {
        const wingMat = new THREE.MeshLambertMaterial({
            color: 0xffffff,
            emissive: 0xffffff,
            emissiveIntensity: 0.3,
        });
        const feathers = [
            { length: 1.15, x: 0.1 },
            { length: 0.95, x: -0.2 },
            { length: 0.75, x: -0.48 },
        ];

        function buildWing(side) {
            const wing = new THREE.Group();
            wing.position.set(-0.15, 0.55, side * 0.95);
            for (const { length, x } of feathers) {
                const feather = ellipsoid([0.24, 0.07, length / 2], wingMat);
                feather.position.set(x, 0, side * (length / 2 - 0.05));
                wing.add(addOutline(feather, 1.14));
            }
            group.add(wing);
            return wing;
        }

        return { left: buildWing(1), right: buildWing(-1) };
    }

    function createPig(scene) {
        const group = new THREE.Group();
        scene.add(group);

        let wings = null;

        function setCharacter(character) {
            group.traverse((obj) => {
                if (!obj.isMesh) return;
                obj.geometry.dispose();
                if (obj.material !== outlineMat) obj.material.dispose();
            });
            group.clear();
            buildBody(group, character);
            wings = buildWings(group);

            const accessories = new THREE.Group();
            const build = ACCESSORY_BUILDERS[character.hatType];
            if (build) {
                for (const mesh of build()) {
                    accessories.add(mesh.material.type === 'MeshBasicMaterial' ? mesh : addOutline(mesh, 1.05));
                }
            }
            group.add(accessories);
        }

        function flapWings(elapsed, speed) {
            if (!wings) return;
            const angle = Math.sin(elapsed * speed) * 0.65;
            wings.left.rotation.x = angle;
            wings.right.rotation.x = -angle;
        }

        return { group, setCharacter, flapWings };
    }

    Voa.createPig = createPig;
})(window.Voa = window.Voa || {});

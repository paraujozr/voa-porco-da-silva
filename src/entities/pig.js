(function (Voa) {
    'use strict';

    // Acessórios específicos de cada profissão brasileira.
    // Cada builder devolve a lista de meshes a adicionar ao grupo de acessórios.
    const ACCESSORY_BUILDERS = {
        // Capacete amarelo de pedreiro/engenheiro + faixa refletiva no colete
        hardhat() {
            const hatMat = new THREE.MeshPhysicalMaterial({ color: 0xfacc15, clearcoat: 0.8, roughness: 0.2 });
            const dome = new THREE.Mesh(new THREE.SphereGeometry(0.68, 20, 20, 0, Math.PI * 2, 0, Math.PI / 2), hatMat);
            dome.position.set(0.35, 0.72, 0);
            const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.82, 0.82, 0.08, 20), hatMat);
            brim.position.set(0.42, 0.72, 0);

            const stripeMat = new THREE.MeshBasicMaterial({ color: 0xe2e8f0 });
            const stripe = new THREE.Mesh(new THREE.CylinderGeometry(1.04, 1.04, 0.22, 24), stripeMat);
            stripe.rotation.z = Math.PI / 2;
            stripe.position.set(-0.08, 0, 0);
            return [dome, brim, stripe];
        },

        // Faixa branca na testa + gola verde Seleção
        headband() {
            const bandMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
            const band = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.68, 0.22, 24), bandMat);
            band.position.set(0.48, 0.78, 0);
            band.rotation.z = -0.25;

            const collarMat = new THREE.MeshStandardMaterial({ color: 0x009c3b });
            const collar = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.09, 12, 24), collarMat);
            collar.rotation.y = Math.PI / 2;
            collar.position.set(0.48, 0, 0);
            return [band, collar];
        },

        // Chapéu de palha + óculos Juliet espelhado
        strawhat() {
            const strawMat = new THREE.MeshStandardMaterial({ color: 0xfde047, roughness: 0.9 });
            const brim = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.15, 0.08, 24), strawMat);
            brim.position.set(0.35, 0.85, 0);
            const top = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.65, 0.45, 24), strawMat);
            top.position.set(0.35, 1.05, 0);

            const julietMat = new THREE.MeshPhysicalMaterial({ color: 0x06b6d4, metalness: 0.9, roughness: 0.1 });
            const glasses = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.28, 1.25), julietMat);
            glasses.position.set(1.08, 0.46, 0);
            return [brim, top, glasses];
        },

        // Capacete fechado + bag vermelha de delivery nas costas
        helmet_bag() {
            const helmetMat = new THREE.MeshPhysicalMaterial({ color: 0xef4444, clearcoat: 0.9, roughness: 0.15 });
            const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.76, 24, 24), helmetMat);
            helmet.position.set(0.45, 0.55, 0);

            const visorMat = new THREE.MeshPhysicalMaterial({ color: 0x0f172a, metalness: 0.8, roughness: 0.1 });
            const visor = new THREE.Mesh(new THREE.SphereGeometry(0.78, 16, 16, -0.6, 1.2, 0.9, 0.6), visorMat);
            visor.position.set(0.45, 0.55, 0);

            const bagMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.4 });
            const bag = new THREE.Mesh(new THREE.BoxGeometry(0.95, 1.1, 1.1), bagMat);
            bag.position.set(-1.15, 0.45, 0);
            return [helmet, visor, bag];
        },
    };

    function buildBody(group, { skinColor, shirtColor }) {
        const skinMat = new THREE.MeshPhysicalMaterial({
            color: skinColor,
            roughness: 0.38,
            metalness: 0.05,
            clearcoat: 0.25,
        });
        const shirtMat = new THREE.MeshStandardMaterial({ color: shirtColor, roughness: 0.5 });

        // Corpo roliço
        const bodyGeo = new THREE.SphereGeometry(1.05, 28, 28);
        bodyGeo.scale(1.28, 1.0, 1.0);
        const body = new THREE.Mesh(bodyGeo, skinMat);
        body.castShadow = true;
        body.receiveShadow = true;
        group.add(body);

        // Roupa da profissão envolvendo a barriga
        const shirtGeo = new THREE.CylinderGeometry(1.02, 1.02, 1.15, 24);
        shirtGeo.rotateZ(Math.PI / 2);
        const shirt = new THREE.Mesh(shirtGeo, shirtMat);
        shirt.position.set(-0.08, 0, 0);
        shirt.castShadow = true;
        group.add(shirt);

        // Focinho clássico de porco
        const snoutGeo = new THREE.CylinderGeometry(0.45, 0.48, 0.35, 24);
        snoutGeo.rotateZ(Math.PI / 2);
        const snout = new THREE.Mesh(snoutGeo, skinMat);
        snout.position.set(1.28, 0.05, 0);
        snout.castShadow = true;
        group.add(snout);

        // Narinas
        const nostrilMat = new THREE.MeshBasicMaterial({ color: 0x590d22 });
        const n1 = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 10), nostrilMat);
        const n2 = n1.clone();
        n1.position.set(1.45, 0.08, 0.16);
        n2.position.set(1.45, 0.08, -0.16);
        group.add(n1, n2);

        // Olhos
        const eyeWhiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.1 });
        const pupilMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
        const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 16), eyeWhiteMat);
        eyeL.position.set(0.95, 0.45, 0.45);
        const pupilL = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 12), pupilMat);
        pupilL.position.set(1.13, 0.48, 0.48);
        const eyeR = eyeL.clone();
        eyeR.position.z = -0.45;
        const pupilR = pupilL.clone();
        pupilR.position.z = -0.48;
        group.add(eyeL, pupilL, eyeR, pupilR);

        // Orelhinhas caídas
        const earGeo = new THREE.ConeGeometry(0.28, 0.55, 12);
        const earL = new THREE.Mesh(earGeo, skinMat);
        earL.position.set(0.55, 0.92, 0.55);
        earL.rotation.set(0.4, 0, -0.3);
        const earR = earL.clone();
        earR.position.z = -0.55;
        earR.rotation.x = -0.4;
        group.add(earL, earR);

        // Rabinho enrolado
        const tail = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.06, 10, 20, Math.PI * 1.6), skinMat);
        tail.position.set(-1.35, 0.1, 0);
        group.add(tail);
    }

    function buildWings(group) {
        const wingMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
        const wingGeo = new THREE.BoxGeometry(0.65, 0.12, 0.95);

        const left = new THREE.Mesh(wingGeo, wingMat);
        left.position.set(-0.1, 0.3, 1.05);
        left.castShadow = true;

        const right = new THREE.Mesh(wingGeo, wingMat);
        right.position.set(-0.1, 0.3, -1.05);
        right.castShadow = true;

        group.add(left, right);
        return { left, right };
    }

    function createPig(scene) {
        const group = new THREE.Group();
        scene.add(group);

        let wings = null;

        function setCharacter(character) {
            group.clear();
            buildBody(group, character);
            wings = buildWings(group);

            const accessories = new THREE.Group();
            const build = ACCESSORY_BUILDERS[character.hatType];
            if (build) accessories.add(...build());
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

class Game3D {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.arenaRadius = 15;
        this.friction = 0.98;
        this.baseSpeed = 0.2;
        this.actors = [];
        this.playerActor = null;
        this.dashActive = false;
        this.dashTimer = 0;

        this.initEngine();
        this.buildArena();
        this.spawnActors();
        this.linkToControlEngine();
        this.loop();
    }

    initEngine() {
        const container = document.getElementById('three-canvas-container');
        if (!container) return;

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0f1d);

        const width = window.innerWidth;
        const height = window.innerHeight;

        this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
        this.camera.position.set(0, 18, 14);
        this.camera.lookAt(0, 0, -2);

        this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        container.appendChild(this.renderer.domElement);

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(5, 20, 5);
        this.scene.add(dirLight);

        window.addEventListener('resize', () => {
            const w = window.innerWidth;
            const h = window.innerHeight;
            this.camera.aspect = w / h;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(w, h);
        });
    }

    buildArena() {
        const floorGeo = new THREE.CircleGeometry(this.arenaRadius, 64);
        const floorMat = new THREE.MeshStandardMaterial({ 
            color: 0x111625, 
            roughness: 0.4, 
            metalness: 0.8,
            side: THREE.DoubleSide 
        });
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.rotation.x = Math.PI / 2;
        this.scene.add(floor);

        const wallGeo = new THREE.RingGeometry(this.arenaRadius - 0.1, this.arenaRadius + 0.1, 64);
        const wallMat = new THREE.MeshBasicMaterial({ color: 0x00ffcc, side: THREE.DoubleSide });
        const wall = new THREE.Mesh(wallGeo, wallMat);
        wall.rotation.x = Math.PI / 2;
        wall.position.y = 0.05;
        this.scene.add(wall);
    }

    spawnActors() {
        const colors = [0xff3366, 0x3399ff, 0xffcc00, 0x99ff33, 0xcc33ff];
        const names = ["YOU (Ranger)", "AI_Alpha", "AI_Beta", "AI_Gamma", "AI_Omega"];

        for (let i = 0; i < 5; i++) {
            const isPlayer = (i === 0);
            const baseRadius = isPlayer ? 0.8 : 0.7;

            const geo = new THREE.SphereGeometry(baseRadius, 32, 32);
            const mat = new THREE.MeshStandardMaterial({
                color: colors[i],
                roughness: 0.1,
                metalness: 0.9
            });
            const mesh = new THREE.Mesh(geo, mat);

            const angle = (i / 5) * Math.PI * 2;
            const spawnDist = 6 + Math.random() * 3;
            mesh.position.set(Math.cos(angle) * spawnDist, baseRadius, Math.sin(angle) * spawnDist);
            this.scene.add(mesh);

            const actor = {
                id: i,
                name: names[i],
                isPlayer: isPlayer,
                mesh: mesh,
                radius: baseRadius,
                mass: baseRadius * baseRadius,
                vx: 0,
                vz: 0,
                inputX: 0,
                inputZ: 0,
                isDead: false
            };

            this.actors.push(actor);
            if (isPlayer) this.playerActor = actor;
        }
    }

    linkToControlEngine() {
        if (!window.gameUI) {
            setTimeout(() => this.linkToControlEngine(), 100);
            return;
        }

        const ui = window.gameUI;

        ui.onGameStartLaunchCallback = (multiplier) => {
            const scaleFactor = 1 + (multiplier - 1) * 0.15;
            this.playerActor.radius = 0.8 * scaleFactor;
            this.playerActor.mass = this.playerActor.radius * this.playerActor.radius;
            this.playerActor.mesh.scale.set(scaleFactor, scaleFactor, scaleFactor);
            this.playerActor.mesh.position.y = this.playerActor.radius;
        };

        ui.onJoystickMoveCallback = (mx, mz) => {
            if (this.playerActor.isDead) return;
            this.playerActor.inputX = mx;
            this.playerActor.inputZ = mz;
        };

        ui.onDashTriggerCallback = () => {
            if (this.playerActor.isDead || this.dashActive) return;
            this.dashActive = true;
            this.dashTimer = 25;
            window.gameUI.triggerCenterAlert("DASH BURST!!!");
        };

        ui.onWeaponTriggerCallback = (type) => {
            window.gameUI.triggerCenterAlert(`ACTIVATED: ${type.toUpperCase()}!`);
        };
    }

    loop() {
        requestAnimationFrame(() => this.loop());

        this.runAIIntelligence();

        this.actors.forEach(actor => {
            if (actor.isDead) return;

            let currentSpeed = this.baseSpeed;
            if (actor.isPlayer && this.dashActive) {
                currentSpeed *= 3.5;
                this.dashTimer--;
                if (this.dashTimer <= 0) this.dashActive = false;
            }

            actor.vx += actor.inputX * currentSpeed;
            actor.vz += actor.inputZ * currentSpeed;
            actor.vx *= this.friction;
            actor.vz *= this.friction;

            actor.mesh.position.x += actor.vx;
            actor.mesh.position.z += actor.vz;

            const distanceFromCenter = Math.sqrt(actor.mesh.position.x * actor.mesh.position.x + actor.mesh.position.z * actor.mesh.position.z);
            if (distanceFromCenter > this.arenaRadius - actor.radius) {
                if (distanceFromCenter > this.arenaRadius + 1) {
                    actor.isDead = true;
                    this.scene.remove(actor.mesh);
                    if (actor.isPlayer) {
                        window.gameUI.triggerCenterAlert("GAME OVER! YOU FELL!");
                    } else {
                        window.gameUI.triggerCenterAlert(`${actor.name} WAS ELIMINATED!`);
                    }
                } else {
                    const nx = actor.mesh.position.x / distanceFromCenter;
                    const nz = actor.mesh.position.z / distanceFromCenter;
                    const dot = actor.vx * nx + actor.vz * nz;
                    if (dot > 0) {
                        actor.vx -= 1.4 * dot * nx;
                        actor.vz -= 1.4 * dot * nz;
                    }
                }
            }
        });

        for (let i = 0; i < this.actors.length; i++) {
            for (let j = i + 1; j < this.actors.length; j++) {
                const a = this.actors[i];
                const b = this.actors[j];
                if (a.isDead || b.isDead) continue;

                const dx = b.mesh.position.x - a.mesh.position.x;
                const dz = b.mesh.position.z - a.mesh.position.z;
                const distance = Math.sqrt(dx * dx + dz * dz) || 0.1;
                const minDist = a.radius + b.radius;

                if (distance < minDist) {
                    const overlap = minDist - distance;
                    const separateX = (dx / distance) * overlap * 0.5;
                    const separateZ = (dz / distance) * overlap * 0.5;
                    a.mesh.position.x -= separateX;
                    a.mesh.position.z -= separateZ;
                    b.mesh.position.x += separateX;
                    b.mesh.position.z += separateZ;

                    const nx = dx / distance;
                    const nz = dz / distance;

                    const kx = a.vx - b.vx;
                    const kz = a.vz - b.vz;
                    const p = 2 * (nx * kx + nz * kz) / (a.mass + b.mass);

                    a.vx -= p * b.mass * nx;
                    a.vz -= p * b.mass * nz;
                    b.vx += p * a.mass * nx;
                    b.vz += p * a.mass * nz;

                    if ((a.isPlayer || b.isPlayer) && navigator.vibrate) {
                        navigator.vibrate(20);
                    }
                }
            }
        }

        if (this.playerActor && !this.playerActor.isDead) {
            this.camera.position.x = THREE.MathUtils.lerp(this.camera.position.x, this.playerActor.mesh.position.x, 0.05);
            this.camera.position.z = THREE.MathUtils.lerp(this.camera.position.z, this.playerActor.mesh.position.z + 14, 0.05);
        }

        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }

    runAIIntelligence() {
        this.actors.forEach(actor => {
            if (actor.isPlayer || actor.isDead) return;

            let closestTarget = null;
            let minDist = 999;

            this.actors.forEach(target => {
                if (target.id === actor.id || target.isDead) return;
                const dx = target.mesh.position.x - actor.mesh.position.x;
                const dz = target.mesh.position.z - actor.mesh.position.z;
                const dist = Math.sqrt(dx * dx + dz * dz);
                if (dist < minDist) {
                    minDist = dist;
                    closestTarget = target;
                }
            });

            if (closestTarget) {
                const dx = closestTarget.mesh.position.x - actor.mesh.position.x;
                const dz = closestTarget.mesh.position.z - actor.mesh.position.z;
                const dist = Math.sqrt(dx * dx + dz * dz) || 1;
                actor.inputX = dx / dist;
                actor.inputZ = dz / dist;
            } else {
                actor.inputX = 0;
                actor.inputZ = 0;
            }
        });
    }
}

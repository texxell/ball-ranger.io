class App {
    constructor() {
        this.ui = window.gameUI;
        this.scene = window.mainScene;
        this.physics = null;
        this.playerPhysicsRef = null;

        this.initSimulationKernel();
    }

    initSimulationKernel() {
        this.physics = new PhysicsEngine(this.scene.arenaRadius);
        window.physicsEngine = this.physics;

        const colors = [0xff3366, 0x3399ff, 0xffcc00, 0x99ff33, 0xcc33ff];
        const profiles = ["PLAYER", "AI_ALPHA", "AI_BRAVO", "AI_CHARLIE", "AI_DELTA"];

        for (let i = 0; i < 5; i++) {
            const isPlayer = (i === 0);
            const radius = isPlayer ? 0.85 : 0.75;
            
            const mesh = this.scene.createActorMesh(radius, colors[i]);
            
            const angle = (i / 5) * Math.PI * 2;
            const spawnDistance = 6 + Math.random() * 4;
            const px = Math.cos(angle) * spawnDistance;
            const pz = Math.sin(angle) * spawnDistance;

            const reference = this.physics.addActor(i, profiles[i], isPlayer, radius, px, pz, mesh);
            if (isPlayer) this.playerPhysicsRef = reference;
        }

        this.hookControlLoopCallbacks();
        this.startRenderEngineLoop();
    }

    hookControlLoopCallbacks() {
        this.ui.onGameStartLaunchCallback = (multiplier) => {
            const massBuffFactor = 1 + (multiplier - 1) * 0.2;
            this.playerPhysicsRef.radius = 0.85 * massBuffFactor;
            this.playerPhysicsRef.mass = this.playerPhysicsRef.radius * this.playerPhysicsRef.radius;
            this.playerPhysicsRef.mesh.scale.set(massBuffFactor, massBuffFactor, massBuffFactor);
            this.playerPhysicsRef.mesh.position.y = this.playerPhysicsRef.radius;
            this.ui.triggerCenterAlert("COMBAT VEHICLE ENLARGED!");
        };

        this.ui.onJoystickMoveCallback = (mx, mz) => {
            if (this.playerPhysicsRef.isDead) return;
            this.playerPhysicsRef.ax = mx * this.physics.baseSpeed;
            this.playerPhysicsRef.az = mz * this.physics.baseSpeed;
        };

        this.ui.onDashTriggerCallback = () => {
            if (this.playerPhysicsRef.isDead) return;
            const mag = Math.sqrt(this.playerPhysicsRef.vx * this.playerPhysicsRef.vx + this.playerPhysicsRef.vz * this.playerPhysicsRef.vz) || 0.01;
            const dx = this.playerPhysicsRef.vx / mag;
            const dz = this.playerPhysicsRef.vz / mag;

            this.playerPhysicsRef.vx += dx * 0.22;
            this.playerPhysicsRef.vz += dz * 0.22;
            this.ui.triggerCenterAlert("THRUSTERS ENGAGED!");
        };

        this.ui.onWeaponTriggerCallback = (type) => {
            if (this.playerPhysicsRef.isDead) return;
            if (type === "shield" && !this.playerPhysicsRef.shieldActive) {
                this.playerPhysicsRef.shieldActive = true;
                this.playerPhysicsRef.shieldTime = 180; 
                this.scene.attachShieldMesh(this.playerPhysicsRef.mesh, this.playerPhysicsRef.radius);
                this.ui.triggerCenterAlert("KINETIC SHIELD DEPLOYED!");
            }
        };
    }

    startRenderEngineLoop() {
        const frameExecution = () => {
            requestAnimationFrame(frameExecution);

            this.physics.update();

            if (this.playerPhysicsRef && !this.playerPhysicsRef.isDead) {
                const cam = this.scene.camera;
                const targetX = this.playerPhysicsRef.x;
                const targetZ = this.playerPhysicsRef.z + 18;

                cam.position.x += (targetX - cam.position.x) * 0.08;
                cam.position.z += (targetZ - cam.position.z) * 0.08;
                cam.lookAt(this.playerPhysicsRef.x, 0, this.playerPhysicsRef.z - 2);
            }

            this.scene.render();
        };
        requestAnimationFrame(frameExecution);
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.gameUI = new GameUI();
    window.mainScene = new MainScene();
    window.appEngine = new App();
    window.gameShop = new GameShop();
    console.log("System Architecture Core Bootstrapped Successfully.");
});

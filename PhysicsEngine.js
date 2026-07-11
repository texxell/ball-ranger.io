class PhysicsEngine {
    constructor(arenaRadius) {
        this.arenaRadius = arenaRadius;
        this.actors = [];
        this.playerActor = null;
        this.baseSpeed = 0.006;
        this.friction = 0.96;
    }

    addActor(id, name, isPlayer, radius, x, z, mesh) {
        const actor = {
            id: id,
            name: name,
            isPlayer: isPlayer,
            radius: radius,
            mass: radius * radius,
            x: x,
            z: z,
            vx: 0,
            vz: 0,
            ax: 0,
            az: 0,
            mesh: mesh,
            isDead: false,
            shieldActive: false,
            shieldTime: 0
        };

        this.actors.push(actor);
        if (isPlayer) this.playerActor = actor;
        return actor;
    }

    update() {
        this.processAIIntelligence();
        this.applyForcesAndBoundaries();
        this.resolveCollisions();
    }

    processAIIntelligence() {
        for (let i = 0; i < this.actors.length; i++) {
            const actor = this.actors[i];
            if (actor.isPlayer || actor.isDead) continue;

            let target = null;
            let closestDist = Infinity;

            for (let j = 0; j < this.actors.length; j++) {
                const potentialTarget = this.actors[j];
                if (potentialTarget.id === actor.id || potentialTarget.isDead) continue;

                const dx = potentialTarget.x - actor.x;
                const dz = potentialTarget.z - actor.z;
                const dist = Math.sqrt(dx * dx + dz * dz);

                if (dist < closestDist) {
                    closestDist = dist;
                    target = potentialTarget;
                }
            }

            if (target) {
                const dx = target.x - actor.x;
                const dz = target.z - actor.z;
                const dist = Math.sqrt(dx * dx + dz * dz) || 1;
                actor.ax = (dx / dist) * this.baseSpeed;
                actor.az = (dz / dist) * this.baseSpeed;
            } else {
                actor.ax = 0;
                actor.az = 0;
            }
        }
    }

    applyForcesAndBoundaries() {
        for (let i = 0; i < this.actors.length; i++) {
            const actor = this.actors[i];
            if (actor.isDead) continue;

            actor.vx += actor.ax;
            actor.vz += actor.az;

            actor.vx *= this.friction;
            actor.vz *= this.friction;

            actor.x += actor.vx;
            actor.z += actor.vz;

            if (actor.shieldActive) {
                actor.shieldTime--;
                if (actor.shieldTime <= 0) {
                    actor.shieldActive = false;
                    if (window.mainScene && actor.isPlayer) {
                        window.mainScene.removeShieldMesh(actor.mesh);
                    }
                }
            }

            const distFromCenter = Math.sqrt(actor.x * actor.x + actor.z * actor.z);
            const edgeBoundary = this.arenaRadius - actor.radius;

            if (distFromCenter > edgeBoundary) {
                if (distFromCenter > this.arenaRadius + 1.5) {
                    actor.isDead = true;
                    if (actor.mesh && actor.mesh.parent) {
                        actor.mesh.parent.remove(actor.mesh);
                    }
                    this.broadcastElimination(actor);
                } else {
                    const nx = actor.x / distFromCenter;
                    const nz = actor.z / distFromCenter;
                    const dotProduct = actor.vx * nx + actor.vz * nz;

                    if (dotProduct > 0) {
                        const elasticity = 1.3;
                        actor.vx -= elasticity * dotProduct * nx;
                        actor.vz -= elasticity * dotProduct * nz;
                        actor.x = nx * edgeBoundary;
                        actor.z = nz * edgeBoundary;
                    }
                }
            }

            if (actor.mesh && !actor.isDead) {
                actor.mesh.position.x = actor.x;
                actor.mesh.position.z = actor.z;
            }
        }
    }

    resolveCollisions() {
        for (let i = 0; i < this.actors.length; i++) {
            for (let j = i + 1; j < this.actors.length; j++) {
                const a = this.actors[i];
                const b = this.actors[j];

                if (a.isDead || b.isDead) continue;

                const dx = b.x - a.x;
                const dz = b.z - a.z;
                const distance = Math.sqrt(dx * dx + dz * dz) || 0.1;
                const minDist = a.radius + b.radius;

                if (distance < minDist) {
                    const overlap = minDist - distance;
                    const sepX = (dx / distance) * overlap * 0.5;
                    const sepZ = (dz / distance) * overlap * 0.5;

                    a.x -= sepX;
                    a.z -= sepZ;
                    b.x += sepX;
                    b.z += sepZ;

                    const nx = dx / distance;
                    const nz = dz / distance;

                    const kx = a.vx - b.vx;
                    const kz = a.vz - b.vz;
                    const impulseFactor = 2 * (nx * kx + nz * kz) / (a.mass + b.mass);

                    let multiplierA = 1.0;
                    let multiplierB = 1.0;

                    if (a.shieldActive && !b.shieldActive) multiplierB = 2.5;
                    if (b.shieldActive && !a.shieldActive) multiplierA = 2.5;

                    a.vx -= impulseFactor * b.mass * nx * multiplierA;
                    a.vz -= impulseFactor * b.mass * nz * multiplierA;
                    b.vx += impulseFactor * a.mass * nx * multiplierB;
                    b.vz += impulseFactor * a.mass * nz * multiplierB;

                    if ((a.isPlayer || b.isPlayer) && window.navigator && window.navigator.vibrate) {
                        window.navigator.vibrate(25);
                    }
                }
            }
        }
    }

    broadcastElimination(actor) {
        if (!window.gameUI) return;
        if (actor.isPlayer) {
            window.gameUI.triggerCenterAlert("GAME OVER! YOU FELL OUT!");
        } else {
            window.gameUI.triggerCenterAlert(`${actor.name.toUpperCase()} ELIMINATED!`);
            if (this.playerActor && !this.playerActor.isDead) {
                let reward = 150;
                let gold = parseInt(localStorage.getItem('br_wallet_gold')) || 0;
                gold += reward;
                localStorage.setItem('br_wallet_gold', gold);
                window.gameUI.walletGold = gold;
                window.gameUI.hudCoinAmount.innerText = gold + "G";
                window.gameUI.triggerCenterAlert(`BOUNTY COLLECTED: +${reward}G`);
            }
        }
    }
}

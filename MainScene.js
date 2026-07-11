class MainScene {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.arenaRadius = 16;
        this.shieldVisual = null;

        this.initThree();
        this.createLighting();
        this.createEnvironment();
    }

    initThree() {
        const container = document.getElementById('three-canvas-container');
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0f1d);

        const width = window.innerWidth;
        const height = window.innerHeight;

        this.camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 1000);
        this.camera.position.set(0, 22, 18);
        this.camera.lookAt(0, 0, -2);

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        container.appendChild(this.renderer.domElement);

        window.addEventListener('resize', () => {
            const w = window.innerWidth;
            const h = window.innerHeight;
            this.camera.aspect = w / h;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(w, h);
        });
    }

    createLighting() {
        const ambient = new THREE.AmbientLight(0xffffff, 0.35);
        this.scene.add(ambient);

        const mainLight = new THREE.DirectionalLight(0xffffff, 0.85);
        mainLight.position.set(10, 30, 15);
        this.scene.add(mainLight);

        const neonRimLight = new THREE.PointLight(0x00ffcc, 1.2, 50);
        neonRimLight.position.set(0, 2, 0);
        this.scene.add(neonRimLight);
    }

    createEnvironment() {
        const floorGeo = new THREE.CircleGeometry(this.arenaRadius, 64);
        const floorMat = new THREE.MeshStandardMaterial({ 
            color: 0x121829, 
            roughness: 0.5, 
            metalness: 0.7 
        });
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.rotation.x = -Math.PI / 2;
        this.scene.add(floor);

        const edgeGeo = new THREE.RingGeometry(this.arenaRadius - 0.15, this.arenaRadius + 0.15, 64);
        const edgeMat = new THREE.MeshBasicMaterial({ color: 0x00ffcc, side: THREE.DoubleSide });
        const edgeBorder = new THREE.Mesh(edgeGeo, edgeMat);
        edgeBorder.rotation.x = -Math.PI / 2;
        edgeBorder.position.y = 0.02;
        this.scene.add(edgeBorder);

        const grid = new THREE.GridHelper(this.arenaRadius * 2, 32, 0x334466, 0x1f2942);
        grid.position.y = 0.01;
        this.scene.add(grid);
    }

    createActorMesh(radius, hexColor) {
        const geo = new THREE.SphereGeometry(radius, 32, 32);
        const mat = new THREE.MeshStandardMaterial({
            color: hexColor,
            roughness: 0.15,
            metalness: 0.85
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.y = radius;
        this.scene.add(mesh);
        return mesh;
    }

    attachShieldMesh(parentMesh, radius) {
        if (this.shieldVisual) return;
        const shieldGeo = new THREE.SphereGeometry(radius * 1.4, 16, 16);
        const shieldMat = new THREE.MeshBasicMaterial({
            color: 0x00ffcc,
            wireframe: true,
            transparent: true,
            opacity: 0.4
        });
        this.shieldVisual = new THREE.Mesh(shieldGeo, shieldMat);
        parentMesh.add(this.shieldVisual);
    }

    removeShieldMesh(parentMesh) {
        if (this.shieldVisual) {
            parentMesh.remove(this.shieldVisual);
            this.shieldVisual = null;
        }
    }

    render() {
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }
}

class GameUI {
    constructor() {
        this.lobbyLayer = document.getElementById('lobby-layer');
        this.ingameContainer = document.getElementById('ingame-ui-container');
        this.hudCoinAmount = document.getElementById('hud-coin-amount');
        this.centerAlert = document.getElementById('center-alert');
        
        this.btnX1 = document.getElementById('btn-ad-x1');
        this.btnX2 = document.getElementById('btn-ad-x2');
        this.btnX5 = document.getElementById('btn-ad-x5');
        this.btnStart = document.getElementById('btn-start-game');
        this.btnDash = document.getElementById('btn-dash');
        this.btnWeapon = document.getElementById('btn-weapon');

        this.joyZone = document.getElementById('joy-zone');
        this.joyHandle = document.getElementById('joy-handle');

        this.walletGold = parseInt(localStorage.getItem('br_wallet_gold')) || 0;
        this.isShieldUnlocked = localStorage.getItem('br_unlocked_shield') === 'true';
        this.selectedMultiplier = 1;

        this.onGameStartLaunchCallback = null;
        this.onJoystickMoveCallback = null;
        this.onDashTriggerCallback = null;
        this.onWeaponTriggerCallback = null;

        this.hudCoinAmount.innerText = this.walletGold + "G";
        this.initUIListeners();
        this.initJoystick();
    }

    initUIListeners() {
        const updateMultiplierButtons = (activeBtn, value) => {
            this.btnX1.classList.remove('active');
            this.btnX2.classList.remove('active');
            this.btnX5.classList.remove('active');
            activeBtn.classList.add('active');
            this.selectedMultiplier = value;
            this.triggerCenterAlert("VOLUME BUFF: X" + value);
        };

        this.btnX1.addEventListener('click', () => updateMultiplierButtons(this.btnX1, 1));
        this.btnX2.addEventListener('click', () => updateMultiplierButtons(this.btnX2, 2));
        this.btnX5.addEventListener('click', () => updateMultiplierButtons(this.btnX5, 5));

        this.btnStart.addEventListener('click', () => {
            this.lobbyLayer.style.display = 'none';
            this.ingameContainer.style.display = 'block';
            if (this.onGameStartLaunchCallback) {
                this.onGameStartLaunchCallback(this.selectedMultiplier);
            }
        });

        this.btnDash.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (this.onDashTriggerCallback) this.onDashTriggerCallback();
        });
        this.btnDash.addEventListener('mousedown', (e) => {
            if (this.onDashTriggerCallback) this.onDashTriggerCallback();
        });

        this.btnWeapon.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleWeaponClick();
        });
        this.btnWeapon.addEventListener('mousedown', () => {
            this.handleWeaponClick();
        });
    }

    handleWeaponClick() {
        if (!this.isShieldUnlocked) {
            this.triggerCenterAlert("UNLOCK SHIELD IN SHOP FIRST!");
            return;
        }
        if (this.onWeaponTriggerCallback) this.onWeaponTriggerCallback("shield");
    }

    initJoystick() {
        let activeTouchId = null;
        const rect = this.joyZone.getBoundingClientRect();
        const centerX = 140 / 2;
        const centerY = 140 / 2;
        const maxRadius = 140 / 2;

        const handleMove = (clientX, clientY) => {
            const zoneRect = this.joyZone.getBoundingClientRect();
            const dx = clientX - (zoneRect.left + centerX);
            const dz = clientY - (zoneRect.top + centerY);
            const distance = Math.sqrt(dx * dx + dz * dz) || 0.1;

            let finalX = dx;
            let finalZ = dz;

            if (distance > maxRadius) {
                finalX = (dx / distance) * maxRadius;
                finalZ = (dz / distance) * maxRadius;
            }

            this.joyHandle.style.transform = `translate(${finalX}px, ${finalZ}px)`;

            if (this.onJoystickMoveCallback) {
                this.onJoystickMoveCallback(finalX / maxRadius, finalZ / maxRadius);
            }
        };

        this.joyZone.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (activeTouchId !== null) return;
            const touch = e.changedTouches[0];
            activeTouchId = touch.identifier;
            handleMove(touch.clientX, touch.clientY);
        });

        this.joyZone.addEventListener('touchmove', (e) => {
            e.preventDefault();
            for (let i = 0; i < e.touches.length; i++) {
                if (e.touches[i].identifier === activeTouchId) {
                    handleMove(e.touches[i].clientX, e.touches[i].clientY);
                }
            }
        });

        const handleRelease = () => {
            activeTouchId = null;
            this.joyHandle.style.transform = 'translate(0px, 0px)';
            if (this.onJoystickMoveCallback) this.onJoystickMoveCallback(0, 0);
        };

        this.joyZone.addEventListener('touchend', handleRelease);
        this.joyZone.addEventListener('touchcancel', handleRelease);

        this.joyZone.addEventListener('mousedown', (e) => {
            const onMouseMove = (ev) => handleMove(ev.clientX, ev.clientY);
            const onMouseUp = () => {
                window.removeEventListener('mousemove', onMouseMove);
                window.removeEventListener('mouseup', onMouseUp);
                handleRelease();
            };
            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onMouseUp);
            handleMove(e.clientX, e.clientY);
        });
    }

    triggerCenterAlert(text) {
        this.centerAlert.innerText = text;
        this.centerAlert.style.display = 'block';
        clearTimeout(this.alertTimeout);
        this.alertTimeout = setTimeout(() => {
            this.centerAlert.style.display = 'none';
        }, 2000);
    }
}

class GameShop {
    constructor() {
        this.btnBuyShield = document.getElementById('btn-buy-shield');
        this.btnCheatGold = document.getElementById('btn-cheat-gold');
        this.shieldPrice = 500; 

        this.initShopLogic();
    }

    initShopLogic() {
        this.checkShieldStatus();

        this.btnBuyShield.addEventListener('click', () => {
            let currentGold = window.gameUI.walletGold;
            let isAlreadyUnlocked = localStorage.getItem('br_unlocked_shield') === 'true';

            if (isAlreadyUnlocked) {
                window.gameUI.triggerCenterAlert("SHIELD IS ALREADY UNLOCKED!");
                return;
            }

            if (currentGold < this.shieldPrice) {
                window.gameUI.triggerCenterAlert(`NOT ENOUGH GOLD! NEED ${this.shieldPrice}G!`);
                return;
            }

            currentGold -= this.shieldPrice;
            window.gameUI.walletGold = currentGold;
            window.gameUI.isShieldUnlocked = true;
            
            localStorage.setItem('br_wallet_gold', currentGold);
            localStorage.setItem('br_unlocked_shield', 'true');

            window.gameUI.hudCoinAmount.innerText = currentGold + "G";
            this.checkShieldStatus();
            window.gameUI.triggerCenterAlert("SHIELD UNLOCKED PERMANENTLY!");
        });

        this.btnCheatGold.addEventListener('click', () => {
            let currentGold = window.gameUI.walletGold;
            currentGold += 1000;
            
            window.gameUI.walletGold = currentGold;
            localStorage.setItem('br_wallet_gold', currentGold);
            
            window.gameUI.hudCoinAmount.innerText = currentGold + "G";
            window.gameUI.triggerCenterAlert("TESTING GOLD +1000G ADDED!");
        });
    }

    checkShieldStatus() {
        const isShieldUnlocked = localStorage.getItem('br_unlocked_shield') === 'true';
        if (isShieldUnlocked && this.btnBuyShield) {
            this.btnBuyShield.classList.add('disabled');
            this.btnBuyShield.innerText = "OWNED";
            this.btnBuyShield.setAttribute('disabled', 'true');
        }
    }
}
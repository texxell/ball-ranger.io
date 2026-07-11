class GameShop {
    constructor() {
        this.btnBuyShield = document.getElementById('btn-buy-shield');
        this.btnCheatGold = document.getElementById('btn-cheat-gold');
        this.shieldPrice = 500;

        this.initShopListeners();
    }

    initShopListeners() {
        this.refreshButtonDisplay();

        this.btnBuyShield.addEventListener('click', () => {
            let gold = window.gameUI.walletGold;
            let owned = localStorage.getItem('br_unlocked_shield') === 'true';

            if (owned) {
                window.gameUI.triggerCenterAlert("SHIELD SYSTEM ALREADY UNLOCKED!");
                return;
            }

            if (gold < this.shieldPrice) {
                window.gameUI.triggerCenterAlert(`TRANSACTION DENIED! NEED ${this.shieldPrice}G!`);
                return;
            }

            gold -= this.shieldPrice;
            window.gameUI.walletGold = gold;
            window.gameUI.isShieldUnlocked = true;

            localStorage.setItem('br_wallet_gold', gold);
            localStorage.setItem('br_unlocked_shield', 'true');

            window.gameUI.hudCoinAmount.innerText = gold + "G";
            this.refreshButtonDisplay();
            window.gameUI.triggerCenterAlert("SHIELD ACCESS GRANTED PERMANENTLY!");
        });

        this.btnCheatGold.addEventListener('click', () => {
            let gold = window.gameUI.walletGold;
            gold += 1000;

            window.gameUI.walletGold = gold;
            localStorage.setItem('br_wallet_gold', gold);

            window.gameUI.hudCoinAmount.innerText = gold + "G";
            window.gameUI.triggerCenterAlert("DEBUG: CREDITS GENERATED (+1000G)");
        });
    }

    refreshButtonDisplay() {
        const owned = localStorage.getItem('br_unlocked_shield') === 'true';
        if (owned && this.btnBuyShield) {
            this.btnBuyShield.classList.add('disabled');
            this.btnBuyShield.innerText = "OWNED UTILITY";
            this.btnBuyShield.setAttribute('disabled', 'true');
        }
    }
}

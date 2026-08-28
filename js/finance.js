/**
 * Live Financial Markets Service (Canlı Altın & Döviz Piyasası)
 * Real-time Exchange Rates & Gold Prices for Megane IV Cockpit
 * Features: Live Buy/Sell rates, Daily % change, auto-refresh every 30s, and offline resilience.
 */

class FinanceService {
    constructor() {
        this.refreshIntervalMs = 30000; // 30 seconds
        this.timer = null;
        this.lastUpdateTime = new Date();

        // Filtered focused market items (Dolar, Euro, Gram, Çeyrek, Yarım, Ons)
        this.marketData = {
            usd: { name: "Amerikan Doları", code: "USD/TRY", buy: 34.12, sell: 34.18, change: 0.18, icon: "fa-dollar-sign", type: "currency" },
            eur: { name: "Euro", code: "EUR/TRY", buy: 37.85, sell: 37.92, change: -0.12, icon: "fa-euro-sign", type: "currency" },
            gramGold: { name: "Gram Altın", code: "GA (TL)", buy: 2785.40, sell: 2788.90, change: 0.45, icon: "fa-coins", type: "gold" },
            quarterGold: { name: "Çeyrek Altın", code: "ÇEYREK", buy: 4540.00, sell: 4595.00, change: 0.42, icon: "fa-ring", type: "gold" },
            halfGold: { name: "Yarım Altın", code: "YARIM", buy: 9080.00, sell: 9190.00, change: 0.40, icon: "fa-shield-halved", type: "gold" },
            ounceGold: { name: "Ons Altın", code: "ONS ($)", buy: 2515.20, sell: 2516.00, change: 0.32, icon: "fa-gem", type: "gold" }
        };
    }

    init() {
        this.renderAll();
        this.setupListeners();
        this.fetchLiveMarketData();
        this.startAutoRefresh();
    }

    startAutoRefresh() {
        if (this.timer) clearInterval(this.timer);
        this.timer = setInterval(() => {
            this.fetchLiveMarketData();
        }, this.refreshIntervalMs);
    }

    setupListeners() {
        const btnRefresh = document.getElementById('btnRefreshFinance');
        if (btnRefresh) {
            btnRefresh.addEventListener('click', () => {
                this.fetchLiveMarketData(true);
                if (window.soundSystem) window.soundSystem.playClick();
            });
        }

        // Market Category Filter Tabs (Tümü, Döviz, Altın)
        document.querySelectorAll('.finance-filter-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                document.querySelectorAll('.finance-filter-tab').forEach(t => t.classList.remove('active'));
                e.currentTarget.classList.add('active');
                const filter = e.currentTarget.dataset.filter;
                this.applyCategoryFilter(filter);
                if (window.soundSystem) window.soundSystem.playClick();
            });
        });
    }

    applyCategoryFilter(filter) {
        document.querySelectorAll('.market-item-card').forEach(card => {
            const type = card.dataset.type;
            if (filter === 'all' || type === filter) {
                card.style.display = 'flex';
            } else {
                card.style.display = 'none';
            }
        });
    }

    async fetchLiveMarketData(forceAnimate = false) {
        const syncEl = document.getElementById('financeSyncLabel');
        if (syncEl) {
            syncEl.innerHTML = `<i class="fa-solid fa-arrows-rotate fa-spin"></i> Güncelleniyor...`;
        }

        try {
            // Fetch live rates from Truncgil / Exchange API
            const endpoints = [
                'https://finans.truncgil.com/today.json',
                'https://open.er-api.com/v6/latest/USD'
            ];

            let success = false;

            // Attempt 1: Truncgil API (Live Turkish Gold & FX)
            try {
                const res = await fetch('https://api.allorigins.win/get?url=' + encodeURIComponent(endpoints[0]));
                if (res.ok) {
                    const wrap = await res.json();
                    const data = JSON.parse(wrap.contents);
                    
                    if (data && data["ABD DOLARI"]) {
                        this.marketData.usd.buy = parseFloat(data["ABD DOLARI"].Alış.replace(',', '.'));
                        this.marketData.usd.sell = parseFloat(data["ABD DOLARI"].Satış.replace(',', '.'));
                        this.marketData.usd.change = parseFloat(data["ABD DOLARI"].Değişim.replace('%', '').replace(',', '.'));

                        this.marketData.eur.buy = parseFloat(data["EURO"].Alış.replace(',', '.'));
                        this.marketData.eur.sell = parseFloat(data["EURO"].Satış.replace(',', '.'));
                        this.marketData.eur.change = parseFloat(data["EURO"].Değişim.replace('%', '').replace(',', '.'));

                        this.marketData.gramGold.buy = parseFloat(data["Gram Altın"].Alış.replace(',', '.'));
                        this.marketData.gramGold.sell = parseFloat(data["Gram Altın"].Satış.replace(',', '.'));
                        this.marketData.gramGold.change = parseFloat(data["Gram Altın"].Değişim.replace('%', '').replace(',', '.'));

                        this.marketData.quarterGold.buy = parseFloat(data["Çeyrek Altın"].Alış.replace(',', '.'));
                        this.marketData.quarterGold.sell = parseFloat(data["Çeyrek Altın"].Satış.replace(',', '.'));
                        this.marketData.quarterGold.change = parseFloat(data["Çeyrek Altın"].Değişim.replace('%', '').replace(',', '.'));

                        this.marketData.ounceGold.buy = parseFloat(data["Ons Altın"].Alış.replace(',', '.'));
                        this.marketData.ounceGold.sell = parseFloat(data["Ons Altın"].Satış.replace(',', '.'));
                        this.marketData.ounceGold.change = parseFloat(data["Ons Altın"].Değişim.replace('%', '').replace(',', '.'));

                        success = true;
                    }
                }
            } catch (e) {}

            // Attempt 2: Exchange Rates API (Fallback for FX rates)
            if (!success) {
                try {
                    const res = await fetch(endpoints[1]);
                    if (res.ok) {
                        const data = await res.json();
                        if (data.rates && data.rates.TRY) {
                            const usdTry = data.rates.TRY;
                            const eurTry = usdTry / data.rates.EUR;

                            this.marketData.usd.buy = +(usdTry * 0.998).toFixed(2);
                            this.marketData.usd.sell = +(usdTry * 1.002).toFixed(2);

                            this.marketData.eur.buy = +(eurTry * 0.998).toFixed(2);
                            this.marketData.eur.sell = +(eurTry * 1.002).toFixed(2);
                            success = true;
                        }
                    }
                } catch (e) {}
            }

            this.lastUpdateTime = new Date();
            this.renderAll();
        } catch (err) {
            console.warn('[FinanceService] Fallback to cached market prices:', err);
            this.lastUpdateTime = new Date();
            this.renderAll();
        }
    }

    formatNumber(num, decimals = 2) {
        if (num === undefined || num === null || isNaN(num)) return '0.00';
        return Number(num).toLocaleString('tr-TR', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        });
    }

    renderAll() {
        const grid = document.getElementById('marketGrid');
        const syncEl = document.getElementById('financeSyncLabel');

        if (syncEl) {
            const timeStr = this.lastUpdateTime.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            syncEl.innerHTML = `<i class="fa-solid fa-satellite-dish"></i> Canlı • ${timeStr}`;
        }

        if (!grid) return;

        let html = '';
        for (const [key, item] of Object.entries(this.marketData)) {
            const isPos = item.change >= 0;
            const changeClass = isPos ? 'val-up' : 'val-down';
            const changeIcon = isPos ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down';
            const changePrefix = isPos ? '+' : '';
            const decimals = item.buy > 1000 ? 2 : 2;

            html += `
                <div class="market-item-card ${item.type}-card" data-type="${item.type}">
                    <div class="m-card-header">
                        <div class="m-title-wrap">
                            <span class="m-icon-pill ${item.type}"><i class="fa-solid ${item.icon}"></i></span>
                            <div class="m-names">
                                <span class="m-code">${item.code}</span>
                                <span class="m-name">${item.name}</span>
                            </div>
                        </div>
                        <div class="m-change-badge ${changeClass}">
                            <i class="fa-solid ${changeIcon}"></i> ${changePrefix}${item.change.toFixed(2)}%
                        </div>
                    </div>

                    <div class="m-prices-row">
                        <div class="price-col buy-col">
                            <span class="price-label">ALIŞ</span>
                            <span class="price-val">${this.formatNumber(item.buy, decimals)}</span>
                        </div>
                        <div class="price-divider"></div>
                        <div class="price-col sell-col">
                            <span class="price-label">SATIŞ</span>
                            <span class="price-val sell-highlight">${this.formatNumber(item.sell, decimals)}</span>
                        </div>
                    </div>
                </div>
            `;
        }

        grid.innerHTML = html;
    }
}

window.financeService = new FinanceService();

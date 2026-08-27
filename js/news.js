/**
 * Compact Single-Headline News Slider for Megane IV Dashboard
 * Large typography, smooth 5-second auto-transitions, and manual prev/next navigation
 */

class NewsService {
    constructor() {
        this.currentIndex = 0;
        this.autoTimer = null;
        this.autoIntervalMs = 5000; // 5 saniyede bir otomatik geçiş

        this.newsItems = [
            {
                cat: "SON DAKİKA",
                catClass: "badge-son-dakika",
                title: "Renault Megane ve E-Tech Modellerine Yeni Nesil Otonom Sürüş Yazılımı Yayınlandı",
                time: "5 dk önce",
                icon: "fa-bolt"
            },
            {
                cat: "GÜNDEM",
                catClass: "badge-gundem",
                title: "Türkiye Genelinde Otoyol Hız Limitleri ve Akıllı Trafik Yönetim Sistemi Güncellendi",
                time: "15 dk önce",
                icon: "fa-road"
            },
            {
                cat: "OTOMOBİL",
                catClass: "badge-oto",
                title: "Yeni Nesil 1.3 TCe ve Hibrit Motorlar İçin Yakıt Tasarrufu Sağlayan Akıllı Sürüş Modu Devrede",
                time: "25 dk önce",
                icon: "fa-car"
            },
            {
                cat: "TEKNOLOJİ",
                catClass: "badge-tekno",
                title: "Android Multimedya Ekranlarında Kablosuz Navigasyon ve Sesli Asistan Deneyimi Genişletildi",
                time: "40 dk önce",
                icon: "fa-mobile-screen"
            },
            {
                cat: "ULAŞIM",
                catClass: "badge-ulasim",
                title: "Marmara ve Ege Bölgesinde Otoyol Dinlenme Tesislerine Yüksek Hızlı Şarj İstasyonları Eklendi",
                time: "1 saat önce",
                icon: "fa-charging-station"
            },
            {
                cat: "OTOMOBİL",
                catClass: "badge-oto",
                title: "Euro NCAP 2026 Güvenlik Testlerinde Megane 4 Ailesi Tam Not Alarak 5 Yıldızını Korudu",
                time: "2 saat önce",
                icon: "fa-shield-halved"
            }
        ];
    }

    init() {
        this.renderCurrentNews(false);
        this.renderDots();
        this.setupListeners();
        this.startAutoTimer();
    }

    setupListeners() {
        const btnPrev = document.getElementById('btnPrevNews');
        const btnNext = document.getElementById('btnNextNews');

        if (btnPrev) {
            btnPrev.addEventListener('click', () => {
                this.prevNews();
                if (window.soundSystem) window.soundSystem.playClick();
                this.resetAutoTimer();
            });
        }

        if (btnNext) {
            btnNext.addEventListener('click', () => {
                this.nextNews();
                if (window.soundSystem) window.soundSystem.playClick();
                this.resetAutoTimer();
            });
        }
    }

    startAutoTimer() {
        this.stopAutoTimer();
        this.autoTimer = setInterval(() => {
            this.nextNews(true);
        }, this.autoIntervalMs);
    }

    stopAutoTimer() {
        if (this.autoTimer) {
            clearInterval(this.autoTimer);
            this.autoTimer = null;
        }
    }

    resetAutoTimer() {
        this.startAutoTimer();
    }

    nextNews(isAuto = false) {
        this.currentIndex = (this.currentIndex + 1) % this.newsItems.length;
        this.renderCurrentNews(true, 'next');
        if (!isAuto) this.resetAutoTimer();
    }

    prevNews() {
        this.currentIndex = (this.currentIndex - 1 + this.newsItems.length) % this.newsItems.length;
        this.renderCurrentNews(true, 'prev');
        this.resetAutoTimer();
    }

    renderCurrentNews(animate = false, direction = 'next') {
        const item = this.newsItems[this.currentIndex];
        const contentBox = document.getElementById('newsSlideContent');
        const titleEl = document.getElementById('singleNewsTitle');
        const badgeCat = document.getElementById('newsBadgeCat');
        const timeEl = document.getElementById('newsTime');

        if (!titleEl || !badgeCat || !timeEl) return;

        if (animate && contentBox) {
            contentBox.style.opacity = '0';
            contentBox.style.transform = direction === 'next' ? 'translateX(15px)' : 'translateX(-15px)';

            setTimeout(() => {
                badgeCat.textContent = item.cat;
                badgeCat.className = `badge-news-cat ${item.catClass}`;
                timeEl.innerHTML = `<i class="fa-regular fa-clock"></i> ${item.time}`;
                titleEl.textContent = item.title;

                contentBox.style.opacity = '1';
                contentBox.style.transform = 'translateX(0)';
                this.updateDots();
            }, 180);
        } else {
            badgeCat.textContent = item.cat;
            badgeCat.className = `badge-news-cat ${item.catClass}`;
            timeEl.innerHTML = `<i class="fa-regular fa-clock"></i> ${item.time}`;
            titleEl.textContent = item.title;
            this.updateDots();
        }
    }

    renderDots() {
        const dotsContainer = document.getElementById('newsDots');
        if (!dotsContainer) return;

        let html = '';
        for (let i = 0; i < this.newsItems.length; i++) {
            html += `<span class="news-dot ${i === this.currentIndex ? 'active' : ''}" data-index="${i}"></span>`;
        }
        dotsContainer.innerHTML = html;

        // Dot click listeners
        dotsContainer.querySelectorAll('.news-dot').forEach(dot => {
            dot.addEventListener('click', (e) => {
                const idx = parseInt(e.currentTarget.dataset.index, 10);
                this.currentIndex = idx;
                this.renderCurrentNews(true);
                if (window.soundSystem) window.soundSystem.playClick();
                this.resetAutoTimer();
            });
        });
    }

    updateDots() {
        const dots = document.querySelectorAll('.news-dot');
        dots.forEach((dot, idx) => {
            if (idx === this.currentIndex) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    }
}

window.newsService = new NewsService();

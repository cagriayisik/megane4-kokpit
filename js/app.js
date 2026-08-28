/**
 * Megane IV Android Tablet Cockpit Coordinator
 * 5-Page Dedicated Architecture:
 * 1. Ana Ekran (Kokpit Ambiyans & Sürücü Plaka Rozeti)
 * 2. Büyük Klasik Saat (Chronograph Dial & Canlı Tarih)
 * 3. Büyük Hız Göstergesi (GPS Hız, Maksimum & Ortalama Hız, Mesafe, Pusula)
 * 4. Canlı Hava Durumu (Şehir/İlçe, 4 Metrik Barı & 4 Günlük Geniş Tahmin)
 * 5. Canlı Haberler & 𝕏 TT (Haberler.com, OdaTV, Tele1, X.com TR Trendleri)
 */

class MeganeApp {
    constructor() {
        this.gauge = null;
        this.classicClock = null;
        this.currentPage = 0;
        this.totalPages = 5;

        // GPS Telemetry State (OBD Bağımsız)
        this.speed = 0;
        this.maxSpeed = 0;
        this.speedSamples = [];
        this.tripKm = 0.0;
        this.currentHeading = 'KUZEY';
        this.lastGpsCoords = null;
        this.gpsWatchId = null;

        // Touch Swipe
        this.touchStartX = 0;
        this.touchStartY = 0;

        this.currentMode = 'sport';
    }

    init() {
        // 1. Initialize Instruments (Classic Clock & GPS Speedo)
        this.classicClock = new ClassicAnalogClock('classicClockCanvas');
        this.gauge = new MeganeGauge('speedoCanvas');
        this.setDriveMode('sport');

        // 2. Start Clocks & Pagination
        this.startClock();
        this.setupPagination();

        // 3. Start Geolocation (Passive GPS / Speedometer)
        this.startGpsTracking();

        // 4. Initialize Child Services
        if (window.weatherService) window.weatherService.init();
        if (window.financeService) window.financeService.init();

        // 5. Setup Event Listeners & Particles
        this.setupEventHandlers();
        this.createAmbientParticles();

        // Initial setup for page 0
        this.goToPage(0, false);
    }

    /* -------------------------------------------------------------
       5-PAGE NAVIGATION & SWIPE CONTROLLER
       ------------------------------------------------------------- */
    setupPagination() {
        const track = document.getElementById('pagesTrack');
        const container = document.getElementById('pagesDeckContainer') || document.body;
        const btnPrev = document.getElementById('btnPrevPage');
        const btnNext = document.getElementById('btnNextPage');
        const pills = document.querySelectorAll('.page-pill');

        if (btnPrev) {
            btnPrev.addEventListener('click', () => this.prevPage());
        }

        if (btnNext) {
            btnNext.addEventListener('click', () => this.nextPage());
        }

        pills.forEach(pill => {
            pill.addEventListener('click', (e) => {
                const targetPage = parseInt(e.currentTarget.dataset.page, 10);
                this.goToPage(targetPage);
            });
        });

        // High-Performance Finger Swipe & Drag Engine
        let startX = 0;
        let startY = 0;
        let isDragging = false;
        let isHorizontalSwipe = false;

        const handleStart = (clientX, clientY, target) => {
            if (target && (target.closest('button') || target.closest('select') || target.closest('.news-source-tab'))) {
                return;
            }
            startX = clientX;
            startY = clientY;
            isDragging = true;
            isHorizontalSwipe = false;
        };

        const handleMove = (clientX, clientY) => {
            if (!isDragging) return;
            const diffX = clientX - startX;
            const diffY = clientY - startY;

            if (!isHorizontalSwipe) {
                if (Math.abs(diffX) > 12 && Math.abs(diffX) > Math.abs(diffY)) {
                    isHorizontalSwipe = true;
                }
            }

            if (isHorizontalSwipe && track) {
                const containerWidth = container.offsetWidth || window.innerWidth;
                const baseOffset = -this.currentPage * 100;
                const dragOffsetPercent = (diffX / containerWidth) * 100;
                let finalPercent = baseOffset + dragOffsetPercent;

                if (this.currentPage === 0 && diffX > 0) {
                    finalPercent = (diffX / containerWidth) * 25;
                } else if (this.currentPage === this.totalPages - 1 && diffX < 0) {
                    finalPercent = baseOffset + (diffX / containerWidth) * 25;
                }
                track.style.transition = 'none';
                track.style.transform = `translateX(${finalPercent}%)`;
            }
        };

        const handleEnd = (clientX) => {
            if (!isDragging) return;
            isDragging = false;

            if (track) {
                track.style.transition = 'transform 0.38s cubic-bezier(0.2, 1, 0.3, 1)';
            }

            if (isHorizontalSwipe) {
                const diffX = clientX - startX;
                const threshold = 35; // 35px responsive flick threshold

                if (diffX < -threshold) {
                    this.nextPage();
                } else if (diffX > threshold) {
                    this.prevPage();
                } else {
                    this.goToPage(this.currentPage, false);
                }
            } else {
                this.goToPage(this.currentPage, false);
            }
            isHorizontalSwipe = false;
        };

        // Touch events for mobile/tablet screen
        container.addEventListener('touchstart', (e) => {
            const touch = e.touches[0];
            handleStart(touch.clientX, touch.clientY, e.target);
        }, { passive: true });

        container.addEventListener('touchmove', (e) => {
            if (isDragging) {
                const touch = e.touches[0];
                handleMove(touch.clientX, touch.clientY);
            }
        }, { passive: true });

        container.addEventListener('touchend', (e) => {
            const touch = e.changedTouches[0];
            handleEnd(touch.clientX);
        }, { passive: true });

        container.addEventListener('touchcancel', (e) => {
            if (isDragging) {
                const touch = e.changedTouches[0];
                handleEnd(touch.clientX);
            }
        }, { passive: true });

        // Mouse drag support
        container.addEventListener('mousedown', (e) => {
            handleStart(e.clientX, e.clientY, e.target);
        });

        window.addEventListener('mousemove', (e) => {
            if (isDragging) {
                handleMove(e.clientX, e.clientY);
            }
        });

        window.addEventListener('mouseup', (e) => {
            if (isDragging) {
                handleEnd(e.clientX);
            }
        });

        // Keyboard Arrow Navigation
        window.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight') this.nextPage();
            if (e.key === 'ArrowLeft') this.prevPage();
        });
    }

    goToPage(pageIndex, playSound = true) {
        if (pageIndex < 0) pageIndex = 0;
        if (pageIndex >= this.totalPages) pageIndex = this.totalPages - 1;

        this.currentPage = pageIndex;

        const track = document.getElementById('pagesTrack');
        if (track) {
            track.style.transition = 'transform 0.38s cubic-bezier(0.2, 1, 0.3, 1)';
            track.style.transform = `translateX(-${pageIndex * 100}%)`;
        }

        // Update Active Page Class
        document.querySelectorAll('.page-view').forEach((page, idx) => {
            if (idx === pageIndex) {
                page.classList.add('active');
            } else {
                page.classList.remove('active');
            }
        });

        // Update Nav Pills
        document.querySelectorAll('.page-pill').forEach((pill, idx) => {
            if (idx === pageIndex) {
                pill.classList.add('active');
            } else {
                pill.classList.remove('active');
            }
        });

        if (playSound && window.soundSystem) {
            window.soundSystem.playClick();
        }
    }

    nextPage() {
        if (this.currentPage < this.totalPages - 1) {
            this.goToPage(this.currentPage + 1);
        } else {
            this.goToPage(0); // Wrap around to page 0
        }
    }

    prevPage() {
        if (this.currentPage > 0) {
            this.goToPage(this.currentPage - 1);
        } else {
            this.goToPage(this.totalPages - 1); // Wrap around to page 4
        }
    }

    /* -------------------------------------------------------------
       CLOCK ENGINE & TIME UPDATES
       ------------------------------------------------------------- */
    startClock() {
        const update = () => {
            const now = new Date();
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const seconds = String(now.getSeconds()).padStart(2, '0');

            const timeStr = `${hours}:${minutes}`;
            const timeWithSec = `${hours}:${minutes}:${seconds}`;

            const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
            const months = [
                'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
                'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
            ];

            const dayName = days[now.getDay()];
            const monthName = months[now.getMonth()];
            const dateNum = now.getDate();
            const year = now.getFullYear();

            // Page 1 Ambient Clock
            const ambTime = document.getElementById('ambientTime');
            const ambDate = document.getElementById('ambientDate');
            const ambSecFill = document.getElementById('ambientSecFill');

            if (ambTime) ambTime.textContent = timeStr;
            if (ambDate) ambDate.innerHTML = `${dateNum} ${monthName} ${year}, <span class="clock-day-highlight">${dayName}</span>`;
            if (ambSecFill) {
                const secPct = (now.getSeconds() / 60) * 100;
                ambSecFill.style.width = `${secPct}%`;
            }

            // Subtitle Clock Sync on Page 2
            const dashDigTime = document.getElementById('dashDigitalTime');
            const dashDigDate = document.getElementById('dashDigitalDate');
            if (dashDigTime) dashDigTime.textContent = timeWithSec;
            if (dashDigDate) dashDigDate.innerHTML = `${dateNum} ${monthName} ${year}, <span class="clock-day-highlight">${dayName}</span>`;
        };

        update();
        setInterval(update, 1000);
    }

    /* -------------------------------------------------------------
       MULTI-SENSE DRIVE MODES
       ------------------------------------------------------------- */
    setDriveMode(mode) {
        this.currentMode = mode;
        const body = document.body;

        body.classList.remove('theme-sport', 'theme-comfort', 'theme-eco', 'theme-mysense', 'theme-gold');

        const modeMap = {
            sport: { class: 'theme-sport', color: '#ff2a44', sec: '#ff7700', label: 'SPORT' },
            comfort: { class: 'theme-comfort', color: '#38bdf8', sec: '#2563eb', label: 'COMFORT' },
            eco: { class: 'theme-eco', color: '#10b981', sec: '#059669', label: 'ECO' },
            mysense: { class: 'theme-mysense', color: '#a855f7', sec: '#7c3aed', label: 'MYSENSE' }
        };

        const config = modeMap[mode] || modeMap.sport;
        body.classList.add(config.class);

        if (this.gauge) {
            this.gauge.setThemeColors(config.color, config.sec);
        }
        if (this.classicClock) {
            this.classicClock.setThemeColors(config.color, config.sec);
        }

        document.querySelectorAll('.mode-btn').forEach(btn => {
            if (btn.dataset.mode === mode) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    /* -------------------------------------------------------------
       GPS LIVE TRACKING (SPEEDOMETER, MAX & AVG SPEED, HEADING)
       ------------------------------------------------------------- */
    startGpsTracking() {
        if (!navigator.geolocation) {
            console.log('Geolocation not supported.');
            return;
        }

        this.gpsWatchId = navigator.geolocation.watchPosition(
            (pos) => {
                if (window.weatherService && window.weatherService.updateCoordsFromGps) {
                    window.weatherService.updateCoordsFromGps(pos.coords.latitude, pos.coords.longitude);
                }

                // Speed from GPS (in meters/second -> convert to km/h)
                if (pos.coords.speed !== null && pos.coords.speed !== undefined && pos.coords.speed >= 0) {
                    const speedKmh = Math.round(pos.coords.speed * 3.6);
                    this.updateSpeed(speedKmh);
                }

                // Heading / Compass from GPS
                if (pos.coords.heading !== null && pos.coords.heading !== undefined && !isNaN(pos.coords.heading)) {
                    this.updateHeading(pos.coords.heading);
                }

                // Distance calculation
                if (this.lastGpsCoords) {
                    const d = this.calculateDistance(
                        this.lastGpsCoords.latitude, this.lastGpsCoords.longitude,
                        pos.coords.latitude, pos.coords.longitude
                    );
                    if (d > 0.005) {
                        this.tripKm += d;
                        const tripEl = document.getElementById('tripDist');
                        if (tripEl) tripEl.textContent = this.tripKm.toFixed(1);
                    }
                }
                this.lastGpsCoords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
            },
            (err) => {
                // Passive GPS listener
            },
            { enableHighAccuracy: true, maximumAge: 3000, timeout: 6000 }
        );
    }

    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    updateSpeed(targetSpeed) {
        this.speed = Math.max(0, Math.min(240, targetSpeed));
        
        if (this.speed > 0) {
            this.speedSamples.push(this.speed);
            if (this.speedSamples.length > 200) this.speedSamples.shift();
        }

        if (this.speed > this.maxSpeed) {
            this.maxSpeed = this.speed;
        }

        const avgSpeed = this.speedSamples.length > 0 
            ? Math.round(this.speedSamples.reduce((a, b) => a + b, 0) / this.speedSamples.length)
            : 0;

        if (this.gauge) {
            this.gauge.setSpeed(this.speed);
        }

        const displayEl = document.getElementById('speedDisplay');
        if (displayEl) displayEl.textContent = this.speed;

        const maxSpeedEl = document.getElementById('maxSpeedVal');
        if (maxSpeedEl) maxSpeedEl.textContent = this.maxSpeed;

        const avgSpeedEl = document.getElementById('avgSpeedVal');
        if (avgSpeedEl) avgSpeedEl.textContent = avgSpeed;
    }

    updateHeading(deg) {
        const directions = ['KUZEY', 'KUZEYDOĞU', 'DOĞU', 'GÜNEYDOĞU', 'GÜNEY', 'GÜNEYBATI', 'BATI', 'KUZEYBATI'];
        const index = Math.round(((deg %= 360) < 0 ? deg + 360 : deg) / 45) % 8;
        this.currentHeading = directions[index];

        const headingEl = document.getElementById('headingVal');
        if (headingEl) headingEl.textContent = this.currentHeading;
    }

    /* -------------------------------------------------------------
       EVENT HANDLERS
       ------------------------------------------------------------- */
    setupEventHandlers() {
        // Drive mode buttons
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const mode = e.currentTarget.dataset.mode;
                this.setDriveMode(mode);
                if (window.soundSystem) window.soundSystem.playClick();
            });
        });

        // City Selector Dropdown
        const citySelect = document.getElementById('citySelect');
        if (citySelect) {
            citySelect.addEventListener('change', (e) => {
                if (window.weatherService) {
                    window.weatherService.fetchWeatherByCityKey(e.target.value);
                }
                if (window.soundSystem) window.soundSystem.playClick();
            });
        }
    }

    createAmbientParticles() {
        const container = document.getElementById('ambientParticles');
        if (!container) return;

        for (let i = 0; i < 14; i++) {
            const dot = document.createElement('div');
            dot.className = 'ambient-dot';
            dot.style.cssText = `
                position: absolute;
                width: ${Math.random() * 4 + 2}px;
                height: ${Math.random() * 4 + 2}px;
                background: var(--accent-color);
                opacity: ${Math.random() * 0.4 + 0.1};
                border-radius: 50%;
                top: ${Math.random() * 100}%;
                left: ${Math.random() * 100}%;
                box-shadow: 0 0 8px var(--accent-color);
                pointer-events: none;
                animation: floatUp ${Math.random() * 10 + 8}s infinite linear;
            `;
            container.appendChild(dot);
        }
    }
}

// Global App Initialization
window.addEventListener('DOMContentLoaded', () => {
    window.meganeApp = new MeganeApp();
    window.meganeApp.init();
});

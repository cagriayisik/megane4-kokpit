/**
 * Megane IV Android Tablet Multimedya & GPS Controller
 * 100% OBD-Free: Pure GPS Speedometer, Trip Computer, Weather & News
 */

class MeganeApp {
    constructor() {
        this.gauge = null;
        this.classicClock = null;
        this.idleTimeoutMs = 15000; // 15 seconds default
        this.lastUserActivity = Date.now();
        this.isScreensaverActive = true;

        // GPS Telemetry State (OBD Bağımsız)
        this.speed = 0;
        this.maxSpeed = 0;
        this.speedSamples = [];
        this.tripKm = 0.0;
        this.currentHeading = 'KUZEY';
        this.lastGpsCoords = null;
        this.gpsWatchId = null;

        // Simulation State
        this.simSpeedInterval = null;
        this.isAccelerating = false;
        this.isBraking = false;

        // Turn signals
        this.activeSignal = null;
        this.currentMode = 'sport';
    }

    init() {
        // 1. Initialize Instruments (Classic Clock & GPS Speedo)
        this.classicClock = new ClassicAnalogClock('classicClockCanvas');
        this.gauge = new MeganeGauge('speedoCanvas');
        this.setDriveMode('sport');

        // 2. Initialize Sub-services
        if (window.weatherService) window.weatherService.init();
        if (window.newsService) window.newsService.init();
        if (window.mediaService) window.mediaService.init();

        // 3. Setup Clock & Date
        this.startClock();

        // 4. Setup Activity Tracking (Touch, Mouse, Key)
        this.setupActivityTracking();

        // 5. Setup UI Events
        this.setupEventHandlers();

        // 6. Start Inactivity & Countdown Loop
        this.startIdleChecker();

        // 7. Start GPS Live Geolocation
        this.startGpsTracking();

        // 8. Screensaver Ambient Particles
        this.createAmbientParticles();

        console.log('Renault Megane IV GPS Smart Tablet App Ready.');
    }

    /* -------------------------------------------------------------
       CLOCK & DATE
       ------------------------------------------------------------- */
    startClock() {
        const update = () => {
            const now = new Date();
            const h = String(now.getHours()).padStart(2, '0');
            const m = String(now.getMinutes()).padStart(2, '0');
            const s = String(now.getSeconds()).padStart(2, '0');
            const timeStr = `${h}:${m}`;
            const timeWithSec = `${h}:${m}:${s}`;

            const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
            const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
            
            const dayName = days[now.getDay()];
            const monthName = months[now.getMonth()];
            const dateNum = now.getDate();
            const year = now.getFullYear();

            const fullDateStr = `${dateNum} ${monthName} ${year}, ${dayName}`;

            // Ambient Clock
            const ambTime = document.getElementById('ambientTime');
            const ambDate = document.getElementById('ambientDate');
            const ambSecFill = document.getElementById('ambientSecFill');

            if (ambTime) ambTime.textContent = timeStr;
            if (ambDate) ambDate.textContent = fullDateStr;
            if (ambSecFill) {
                const secPct = (now.getSeconds() / 60) * 100;
                ambSecFill.style.width = `${secPct}%`;
            }

            // Dashboard Top Clock & Analog Subtitle Sync
            const dashTime = document.getElementById('dashTime');
            if (dashTime) dashTime.textContent = timeWithSec;

            const dashDigTime = document.getElementById('dashDigitalTime');
            const dashDigDate = document.getElementById('dashDigitalDate');
            if (dashDigTime) dashDigTime.textContent = timeWithSec;
            if (dashDigDate) dashDigDate.innerHTML = `${dateNum} ${monthName.substring(0, 3)} <span class="clock-day-highlight">${dayName}</span>`;
        };

        update();
        setInterval(update, 1000);
    }

    /* -------------------------------------------------------------
       TOUCH & INACTIVITY (SCREENSAVER TRANSITION)
       ------------------------------------------------------------- */
    setupActivityTracking() {
        const events = ['touchstart', 'touchend', 'mousedown', 'mousemove', 'keydown', 'click'];
        
        events.forEach(evt => {
            document.addEventListener(evt, () => {
                this.onUserActivity();
            }, { passive: true });
        });

        // Screensaver Click/Touch to Wake
        const screensaver = document.getElementById('screensaver');
        if (screensaver) {
            screensaver.addEventListener('click', () => {
                this.wakeDashboard();
            });
            screensaver.addEventListener('touchstart', () => {
                this.wakeDashboard();
            }, { passive: true });
        }
    }

    onUserActivity() {
        this.lastUserActivity = Date.now();
    }

    startIdleChecker() {
        const badge = document.getElementById('idleCountdownBadge');

        setInterval(() => {
            if (this.idleTimeoutMs === 0) {
                if (badge) badge.textContent = 'Açık';
                return;
            }

            const elapsed = Date.now() - this.lastUserActivity;
            const remainingSec = Math.max(0, Math.ceil((this.idleTimeoutMs - elapsed) / 1000));

            if (badge) {
                badge.textContent = `${remainingSec}s`;
            }

            if (!this.isScreensaverActive && elapsed >= this.idleTimeoutMs) {
                this.activateScreensaver();
            }
        }, 500);
    }

    wakeDashboard() {
        if (!this.isScreensaverActive) return;
        this.isScreensaverActive = false;
        this.lastUserActivity = Date.now();

        const screensaver = document.getElementById('screensaver');
        const dashboard = document.getElementById('dashboard');

        if (window.soundSystem) window.soundSystem.playWake();

        if (screensaver) screensaver.classList.remove('active');
        if (dashboard) dashboard.classList.add('active');

        setTimeout(() => {
            if (this.gauge) this.gauge.setupDPI();
            if (this.classicClock) this.classicClock.setupDPI();
        }, 200);
    }

    activateScreensaver() {
        if (this.isScreensaverActive) return;
        this.isScreensaverActive = true;

        const screensaver = document.getElementById('screensaver');
        const dashboard = document.getElementById('dashboard');

        if (screensaver) screensaver.classList.add('active');
        if (dashboard) dashboard.classList.remove('active');

        document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.remove('active'));
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
            comfort: { class: 'theme-comfort', color: '#00b4d8', sec: '#48cae4', label: 'COMFORT' },
            eco: { class: 'theme-eco', color: '#10b981', sec: '#34d399', label: 'ECO' },
            mysense: { class: 'theme-mysense', color: '#a855f7', sec: '#ec4899', label: 'MYSENSE' },
            gold: { class: 'theme-gold', color: '#f59e0b', sec: '#fbbf24', label: 'PERSO' }
        };

        const config = modeMap[mode] || modeMap.sport;
        body.classList.add(config.class);

        if (this.gauge) {
            this.gauge.setThemeColors(config.color, config.sec);
        }
        if (this.classicClock) {
            this.classicClock.setThemeColors(config.color, config.sec);
        }

        const ambMode = document.getElementById('ambientModeLabel');
        if (ambMode) {
            ambMode.innerHTML = `<i class="fa-solid fa-palette"></i><span>${config.label}</span>`;
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
       GPS LIVE TRACKING (PURE SATELLITE SPEEDOMETER)
       ------------------------------------------------------------- */
    startGpsTracking() {
        if (!navigator.geolocation) {
            console.log('Geolocation not supported, simulation available.');
            return;
        }

        this.gpsWatchId = navigator.geolocation.watchPosition(
            (pos) => {
                const ambGps = document.getElementById('ambientGpsStatus');
                if (ambGps) ambGps.textContent = 'GPS Bağlı';

                // Pass to WeatherService silently to avoid duplicate permissions
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
                    if (d > 0.005) { // more than 5 meters
                        this.tripKm += d;
                        const tripEl = document.getElementById('tripDist');
                        if (tripEl) tripEl.textContent = this.tripKm.toFixed(1);
                    }
                }
                this.lastGpsCoords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
            },
            (err) => {
                // Silently handle error, never spam user
                const ambGps = document.getElementById('ambientGpsStatus');
                if (ambGps) ambGps.textContent = 'GPS Hazır';
            },
            { enableHighAccuracy: true, maximumAge: 3000, timeout: 6000 }
        );
    }

    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    updateHeading(deg) {
        const directions = ['KUZEY', 'KD', 'DOĞU', 'GD', 'GÜNEY', 'GB', 'BATI', 'KB'];
        const idx = Math.round(deg / 45) % 8;
        this.currentHeading = directions[idx];
        const headingEl = document.getElementById('headingVal');
        if (headingEl) headingEl.textContent = this.currentHeading;
    }

    updateSpeed(newSpeed) {
        this.speed = Math.round(Math.max(0, Math.min(newSpeed, 240)));

        if (this.gauge) {
            this.gauge.setSpeed(this.speed);
        }

        const speedDisplay = document.getElementById('speedDisplay');
        if (speedDisplay) speedDisplay.textContent = this.speed;

        // Max Speed & Avg Speed calculation
        if (this.speed > this.maxSpeed) {
            this.maxSpeed = this.speed;
            const maxEl = document.getElementById('maxSpeedVal');
            if (maxEl) maxEl.textContent = this.maxSpeed;
        }

        if (this.speed > 0) {
            this.speedSamples.push(this.speed);
            if (this.speedSamples.length > 50) this.speedSamples.shift();
            const sum = this.speedSamples.reduce((a, b) => a + b, 0);
            const avg = Math.round(sum / this.speedSamples.length);
            const avgEl = document.getElementById('avgSpeedVal');
            if (avgEl) avgEl.textContent = avg;

            // Accumulated trip distance simulation if GPS delta is idle
            this.tripKm = +(this.tripKm + (this.speed / 3600)).toFixed(1);
            const tripEl = document.getElementById('tripDist');
            if (tripEl) tripEl.textContent = this.tripKm;
        }
    }

    /* -------------------------------------------------------------
       SIMULATION ACCELERATE & BRAKE (TEST DRIVE CONTROLS)
       ------------------------------------------------------------- */
    startAcceleration() {
        this.isAccelerating = true;
        this.isBraking = false;
        clearInterval(this.simSpeedInterval);
        this.simSpeedInterval = setInterval(() => {
            if (this.isAccelerating) {
                this.updateSpeed(this.speed + 3.0);
            }
        }, 100);
    }

    stopAcceleration() {
        this.isAccelerating = false;
        clearInterval(this.simSpeedInterval);
        this.startNaturalDecel();
    }

    startBraking() {
        this.isBraking = true;
        this.isAccelerating = false;
        clearInterval(this.simSpeedInterval);
        this.simSpeedInterval = setInterval(() => {
            if (this.isBraking && this.speed > 0) {
                this.updateSpeed(this.speed - 6);
            } else if (this.speed <= 0) {
                this.stopBraking();
            }
        }, 80);
    }

    stopBraking() {
        this.isBraking = false;
        clearInterval(this.simSpeedInterval);
        if (this.speed > 0) {
            this.startNaturalDecel();
        }
    }

    startNaturalDecel() {
        clearInterval(this.simSpeedInterval);
        this.simSpeedInterval = setInterval(() => {
            if (!this.isAccelerating && !this.isBraking && this.speed > 0) {
                this.updateSpeed(this.speed - 0.8);
            } else if (this.speed <= 0) {
                clearInterval(this.simSpeedInterval);
            }
        }, 100);
    }

    /* -------------------------------------------------------------
       EVENT HANDLERS & MODALS
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

        // Quick Sleep / Screensaver Button in Topbar
        const btnSleepNow = document.getElementById('btnSleepNow');
        if (btnSleepNow) {
            btnSleepNow.addEventListener('click', () => {
                this.activateScreensaver();
                if (window.soundSystem) window.soundSystem.playClick();
            });
        }

        // Settings Modal
        const btnSettings = document.getElementById('btnSettings');
        const settingsModal = document.getElementById('settingsModal');
        const btnCloseSettings = document.getElementById('btnCloseSettings');
        const btnSaveSettings = document.getElementById('btnSaveSettings');

        if (btnSettings && settingsModal) {
            btnSettings.addEventListener('click', () => {
                settingsModal.classList.add('active');
                if (window.soundSystem) window.soundSystem.playClick();
            });
        }

        if (btnCloseSettings && settingsModal) {
            btnCloseSettings.addEventListener('click', () => {
                settingsModal.classList.remove('active');
            });
        }

        // Timeout Large Touch Tiles
        document.querySelectorAll('.timeout-tile').forEach(tile => {
            tile.addEventListener('click', (e) => {
                document.querySelectorAll('.timeout-tile').forEach(t => t.classList.remove('active'));
                tile.classList.add('active');
                this.idleTimeoutMs = parseInt(tile.dataset.val, 10);
                if (window.soundSystem) window.soundSystem.playClick();
            });
        });

        if (btnSaveSettings && settingsModal) {
            btnSaveSettings.addEventListener('click', () => {
                settingsModal.classList.remove('active');
                if (window.soundSystem) window.soundSystem.playClick();
            });
        }

        // Sound Toggle in Settings
        const soundToggle = document.getElementById('soundToggle');
        if (soundToggle) {
            soundToggle.addEventListener('change', (e) => {
                if (window.soundSystem) {
                    window.soundSystem.enabled = e.target.checked;
                }
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

// Start on DOM load
window.addEventListener('DOMContentLoaded', () => {
    window.app = new MeganeApp();
    window.app.init();
});

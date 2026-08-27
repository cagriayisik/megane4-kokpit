/**
 * YouTube Music Integration & Live Media Session Controller with Background Fire Animation
 * Real-time combustion particle engine active during music playback
 */

class YouTubeMusicFireEffect {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.sparks = [];
        this.isActive = false;
        this.intensity = 0; // 0 (off) to 1 (full fire)
        this.animFrameId = null;

        this.setupCanvasSize();
        window.addEventListener('resize', () => this.setupCanvasSize());
        this.startLoop();
    }

    setupCanvasSize() {
        if (!this.canvas) return;
        const rect = this.canvas.parentElement.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        this.width = rect.width || 380;
        this.height = rect.height || 180;

        this.canvas.width = this.width * dpr;
        this.canvas.height = this.height * dpr;
        this.ctx.scale(dpr, dpr);
    }

    setPlaying(isPlaying) {
        this.isActive = isPlaying;
    }

    startLoop() {
        const render = () => {
            this.update();
            this.draw();
            this.animFrameId = requestAnimationFrame(render);
        };
        render();
    }

    update() {
        // Smoothly interpolate fire intensity
        const targetIntensity = this.isActive ? 1.0 : 0.0;
        this.intensity += (targetIntensity - this.intensity) * 0.08;

        if (this.intensity < 0.01 && !this.isActive && this.particles.length === 0 && this.sparks.length === 0) {
            return;
        }

        // 1. Spawn Base Flame Tongues (Yavaş ve Geniş Alev Kütleleri)
        if (this.intensity > 0.05) {
            const spawnCount = Math.ceil(this.intensity * 2.5);
            for (let i = 0; i < spawnCount; i++) {
                this.particles.push({
                    x: Math.random() * (this.width + 60) - 30,
                    y: this.height + Math.random() * 6,
                    vx: (Math.random() - 0.5) * 0.8,
                    vy: -(Math.random() * 0.9 + 0.6) * (0.6 + this.intensity * 0.4), // Yavaş yükselme
                    radius: Math.random() * 40 + 26, // Geniş ve yumuşak kütle
                    maxLife: Math.random() * 90 + 70, // Uzun ömürlü, yavaş yanma
                    life: 0,
                    hue: Math.random() * 30 + 10
                });
            }

            // 2. Spawn Rising Fire Embers / Sparks (Yavaş Kor Kıvılcımları)
            if (Math.random() < 0.35 * this.intensity) {
                this.sparks.push({
                    x: Math.random() * this.width,
                    y: this.height - Math.random() * 10,
                    vx: (Math.random() - 0.5) * 0.9,
                    vy: -(Math.random() * 1.1 + 0.5),
                    size: Math.random() * 2.5 + 1.2,
                    life: 0,
                    maxLife: Math.random() * 110 + 80,
                    color: Math.random() > 0.4 ? '#ffbe0b' : '#fb5607'
                });
            }
        }

        // 3. Update Flame Particles (Yavaş ve Yumuşak Salınım)
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life++;
            p.x += p.vx + Math.sin(p.life * 0.04) * 0.4;
            p.y += p.vy;
            p.radius *= 0.985; // Çok yavaş küçülme

            if (p.life >= p.maxLife || p.radius < 2 || p.y < -40) {
                this.particles.splice(i, 1);
            }
        }

        // 4. Update Sparks
        for (let i = this.sparks.length - 1; i >= 0; i--) {
            const s = this.sparks[i];
            s.life++;
            s.x += s.vx + Math.sin(s.life * 0.05) * 0.6;
            s.y += s.vy;

            if (s.life >= s.maxLife || s.y < -30) {
                this.sparks.splice(i, 1);
            }
        }
    }

    draw() {
        if (!this.ctx) return;
        this.ctx.clearRect(0, 0, this.width, this.height);

        if (this.intensity < 0.01 && this.particles.length === 0 && this.sparks.length === 0) {
            return;
        }

        this.ctx.save();
        this.ctx.globalCompositeOperation = 'lighter';

        // 1. Draw Base Flame Glow across the floor
        if (this.intensity > 0.05) {
            const baseGrad = this.ctx.createLinearGradient(0, this.height, 0, this.height - 70);
            baseGrad.addColorStop(0, `rgba(255, 68, 0, ${0.45 * this.intensity})`);
            baseGrad.addColorStop(0.5, `rgba(255, 140, 0, ${0.2 * this.intensity})`);
            baseGrad.addColorStop(1, 'rgba(255, 68, 0, 0)');
            this.ctx.fillStyle = baseGrad;
            this.ctx.fillRect(0, this.height - 70, this.width, 70);
        }

        // 2. Draw Flame Tongues
        for (let p of this.particles) {
            const progress = p.life / p.maxLife;
            const alpha = (1 - progress) * 0.7 * this.intensity;
            
            const grad = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, Math.max(1, p.radius));
            if (progress < 0.25) {
                // Hot White-Yellow Core
                grad.addColorStop(0, `rgba(255, 255, 230, ${alpha * 0.9})`);
                grad.addColorStop(0.4, `rgba(255, 200, 0, ${alpha * 0.7})`);
                grad.addColorStop(1, `rgba(255, 60, 0, 0)`);
            } else if (progress < 0.6) {
                // Orange / Amber Fire
                grad.addColorStop(0, `rgba(255, 170, 0, ${alpha * 0.8})`);
                grad.addColorStop(0.6, `rgba(255, 50, 0, ${alpha * 0.5})`);
                grad.addColorStop(1, `rgba(200, 10, 0, 0)`);
            } else {
                // Crimson / Red Smoke Flame
                grad.addColorStop(0, `rgba(255, 40, 0, ${alpha * 0.6})`);
                grad.addColorStop(0.7, `rgba(180, 0, 30, ${alpha * 0.3})`);
                grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
            }

            this.ctx.fillStyle = grad;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, Math.max(1, p.radius), 0, Math.PI * 2);
            this.ctx.fill();
        }

        // 3. Draw Sparks / Embers
        for (let s of this.sparks) {
            const sparkAlpha = (1 - s.life / s.maxLife) * this.intensity;
            this.ctx.fillStyle = s.color;
            this.ctx.globalAlpha = sparkAlpha;
            this.ctx.beginPath();
            this.ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
            this.ctx.fill();

            // Tiny spark outer glow
            this.ctx.fillStyle = '#ffffff';
            this.ctx.beginPath();
            this.ctx.arc(s.x, s.y, s.size * 0.4, 0, Math.PI * 2);
            this.ctx.fill();
        }

        this.ctx.restore();
    }
}

class YouTubeMusicService {
    constructor() {
        this.isPlaying = false;
        this.currentTrackIndex = 0;
        this.currentTimeSec = 84;
        this.durationSec = 215;
        this.progressInterval = null;
        this.fireEffect = null;

        // Curated YouTube Music Hits for Megane IV
        this.playlist = [
            { title: "Ateşe Düştüm", artist: "Mert Demir", album: "YouTube Music Hits", duration: 215, art: "fa-fire" },
            { title: "Bi' Tek Ben Anlarım", artist: "KÖFN", album: "Akustik Yolculuk", duration: 232, art: "fa-headphones" },
            { title: "Dünyadan Uzak", artist: "Pinhani", album: "Megane Chill", duration: 248, art: "fa-earth-europe" },
            { title: "Seni Dert Etmeler", artist: "Madrigal", album: "Gece Sürüşü", duration: 198, art: "fa-moon" },
            { title: "Antidepresan", artist: "Mert Demir & Mabel Matiz", album: "Trendler", duration: 210, art: "fa-compact-disc" }
        ];
    }

    init() {
        this.fireEffect = new YouTubeMusicFireEffect('ytFireCanvas');
        this.updateTrackInfo();
        this.setupListeners();
        this.initMediaSessionAPI();
    }

    /**
     * Web MediaSession API - Reads live YouTube Music stream from Android OS
     */
    initMediaSessionAPI() {
        if ('mediaSession' in navigator) {
            try {
                navigator.mediaSession.setActionHandler('play', () => this.play());
                navigator.mediaSession.setActionHandler('pause', () => this.pause());
                navigator.mediaSession.setActionHandler('previoustrack', () => this.prevTrack());
                navigator.mediaSession.setActionHandler('nexttrack', () => this.nextTrack());
            } catch (e) {
                console.log('MediaSession action handler init:', e);
            }
        }
    }

    setupListeners() {
        const btnPlay = document.getElementById('btnPlayPause');
        const btnPrev = document.getElementById('btnPrevTrack');
        const btnNext = document.getElementById('btnNextTrack');
        const btnLaunchYtMusic = document.getElementById('btnLaunchYtMusic');
        const btnYtMusicApp = document.getElementById('btnYtMusicApp');
        const progressBarWrap = document.querySelector('.progress-bar-wrap');

        if (btnPlay) {
            btnPlay.addEventListener('click', () => {
                this.togglePlay();
                if (window.soundSystem) window.soundSystem.playClick();
            });
        }

        if (btnPrev) {
            btnPrev.addEventListener('click', () => {
                this.prevTrack();
                if (window.soundSystem) window.soundSystem.playClick();
            });
        }

        if (btnNext) {
            btnNext.addEventListener('click', () => {
                this.nextTrack();
                if (window.soundSystem) window.soundSystem.playClick();
            });
        }

        const launchYt = () => {
            if (window.soundSystem) window.soundSystem.playClick();
            window.open('https://music.youtube.com', '_blank');
        };

        if (btnLaunchYtMusic) btnLaunchYtMusic.addEventListener('click', launchYt);
        if (btnYtMusicApp) btnYtMusicApp.addEventListener('click', launchYt);

        if (progressBarWrap) {
            progressBarWrap.addEventListener('click', (e) => {
                const rect = progressBarWrap.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const ratio = Math.max(0, Math.min(1, clickX / rect.width));
                this.currentTimeSec = Math.round(ratio * this.durationSec);
                this.updateProgressBar();
            });
        }
    }

    togglePlay() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    play() {
        this.isPlaying = true;
        const icon = document.getElementById('playIcon');
        const vinyl = document.getElementById('albumArt');
        const card = document.getElementById('ytMusicCard');

        if (icon) icon.className = 'fa-solid fa-pause';
        if (vinyl) vinyl.classList.add('playing');
        if (card) card.classList.add('playing-fire');
        
        if (this.fireEffect) {
            this.fireEffect.setPlaying(true);
        }

        this.startProgress();
        this.syncMediaSession();
    }

    pause() {
        this.isPlaying = false;
        const icon = document.getElementById('playIcon');
        const vinyl = document.getElementById('albumArt');
        const card = document.getElementById('ytMusicCard');

        if (icon) icon.className = 'fa-solid fa-play';
        if (vinyl) vinyl.classList.remove('playing');
        if (card) card.classList.remove('playing-fire');

        if (this.fireEffect) {
            this.fireEffect.setPlaying(false);
        }

        this.stopProgress();
        if ('mediaSession' in navigator) {
            navigator.mediaSession.playbackState = 'paused';
        }
    }

    startProgress() {
        this.stopProgress();
        this.progressInterval = setInterval(() => {
            this.currentTimeSec++;
            if (this.currentTimeSec >= this.durationSec) {
                this.nextTrack();
            } else {
                this.updateProgressBar();
            }
        }, 1000);
    }

    stopProgress() {
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
            this.progressInterval = null;
        }
    }

    nextTrack() {
        this.currentTrackIndex = (this.currentTrackIndex + 1) % this.playlist.length;
        this.currentTimeSec = 0;
        this.updateTrackInfo();
    }

    prevTrack() {
        this.currentTrackIndex = (this.currentTrackIndex - 1 + this.playlist.length) % this.playlist.length;
        this.currentTimeSec = 0;
        this.updateTrackInfo();
    }

    updateTrackInfo() {
        const track = this.playlist[this.currentTrackIndex];
        this.durationSec = track.duration;

        const titleEl = document.getElementById('trackTitle');
        const artistEl = document.getElementById('trackArtist');
        const totalTimeEl = document.getElementById('totalTime');

        if (titleEl) titleEl.textContent = track.title;
        if (artistEl) artistEl.textContent = `${track.artist} • YouTube Music`;
        if (totalTimeEl) totalTimeEl.textContent = this.formatTime(track.duration);

        this.updateProgressBar();
        this.syncMediaSession();
    }

    syncMediaSession() {
        if ('mediaSession' in navigator) {
            const track = this.playlist[this.currentTrackIndex];
            try {
                navigator.mediaSession.metadata = new MediaMetadata({
                    title: track.title,
                    artist: track.artist,
                    album: 'YouTube Music'
                });
                navigator.mediaSession.playbackState = this.isPlaying ? 'playing' : 'paused';
            } catch (e) {}
        }
    }

    updateProgressBar() {
        const curTimeEl = document.getElementById('currentTime');
        const bar = document.getElementById('mediaProgressBar');

        if (curTimeEl) curTimeEl.textContent = this.formatTime(this.currentTimeSec);
        if (bar) {
            const pct = (this.currentTimeSec / this.durationSec) * 100;
            bar.style.width = `${pct}%`;
        }
    }

    formatTime(sec) {
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60);
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    }
}

window.mediaService = new YouTubeMusicService();

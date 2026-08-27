/**
 * Web Audio API Sound Synthesizer for Megane IV Dashboard
 * Clean synthetic sounds without any external audio asset dependency.
 */

class SoundSystem {
    constructor() {
        this.ctx = null;
        this.enabled = true;
        this.signalInterval = null;
        this.isSignaling = false;
    }

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.ctx = new AudioContext();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    playClick() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(400, this.ctx.currentTime + 0.04);

            gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start();
            osc.stop(this.ctx.currentTime + 0.04);
        } catch (e) {}
    }

    playWake() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(320, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(640, this.ctx.currentTime + 0.15);

            gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start();
            osc.stop(this.ctx.currentTime + 0.2);
        } catch (e) {}
    }

    playSignalTick(isHigh = true) {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            const freq = isHigh ? 1200 : 900;
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.03);

            gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.03);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start();
            osc.stop(this.ctx.currentTime + 0.03);
        } catch (e) {}
    }

    startSignalBlink(callback) {
        if (this.signalInterval) {
            this.stopSignal();
        }
        let high = true;
        this.isSignaling = true;
        this.signalInterval = setInterval(() => {
            this.playSignalTick(high);
            if (callback) callback(high);
            high = !high;
        }, 360);
    }

    stopSignal() {
        if (this.signalInterval) {
            clearInterval(this.signalInterval);
            this.signalInterval = null;
        }
        this.isSignaling = false;
    }
}

window.soundSystem = new SoundSystem();

/**
 * Classic Luxury Car Analog Clock Renderer (HTML5 Canvas 60fps)
 * Vintage Automotive Chronograph / Dashboard Clock (Mercedes/Bentley/Renault Vintage styling)
 */

class ClassicAnalogClock {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.accentColor = '#ff2a44';
        this.accentSecondary = '#ff7700';

        this.setupDPI();
        this.startLoop();

        window.addEventListener('resize', () => {
            this.setupDPI();
        });
    }

    setupDPI() {
        if (!this.canvas) return;
        const rect = this.canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 2;
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.ctx.scale(dpr, dpr);
        this.width = rect.width;
        this.height = rect.height;
    }

    setThemeColors(color, secondary) {
        this.accentColor = color;
        this.accentSecondary = secondary || color;
    }

    startLoop() {
        const render = () => {
            this.draw();
            requestAnimationFrame(render);
        };
        requestAnimationFrame(render);
    }

    draw() {
        const { ctx, width, height } = this;
        if (!ctx || !width || !height) return;

        ctx.clearRect(0, 0, width, height);

        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(centerX, centerY) - 12;

        const now = new Date();
        const ms = now.getMilliseconds();
        const sec = now.getSeconds() + ms / 1000;
        const min = now.getMinutes() + sec / 60;
        const hour = (now.getHours() % 12) + min / 60;

        // 1. Outer Bezel (Chrome / Luxury Brushed Ring)
        const bezelGrad = ctx.createLinearGradient(0, 0, width, height);
        bezelGrad.addColorStop(0, '#475569');
        bezelGrad.addColorStop(0.3, '#1e293b');
        bezelGrad.addColorStop(0.7, '#64748b');
        bezelGrad.addColorStop(1, '#0f172a');

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius + 4, 0, 2 * Math.PI);
        ctx.fillStyle = bezelGrad;
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // 2. Inner Dial Surface (Sunburst Dark Texture)
        const dialGrad = ctx.createRadialGradient(centerX, centerY, 5, centerX, centerY, radius);
        dialGrad.addColorStop(0, '#111827');
        dialGrad.addColorStop(0.85, '#070b12');
        dialGrad.addColorStop(1, '#030508');

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius - 2, 0, 2 * Math.PI);
        ctx.fillStyle = dialGrad;
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // 3. Subtle Inner Accent Ring
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius - 16, 0, 2 * Math.PI);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // 4. Minute & Second Tick Marks (60 ticks)
        for (let i = 0; i < 60; i++) {
            const angle = (i * Math.PI) / 30;
            const isHour = i % 5 === 0;
            const isQuarter = i % 15 === 0;

            const tickLen = isQuarter ? 10 : (isHour ? 7 : 3.5);
            const outerR = radius - 6;
            const innerR = outerR - tickLen;

            const x1 = centerX + Math.cos(angle) * innerR;
            const y1 = centerY + Math.sin(angle) * innerR;
            const x2 = centerX + Math.cos(angle) * outerR;
            const y2 = centerY + Math.sin(angle) * outerR;

            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.lineWidth = isQuarter ? 2.2 : (isHour ? 1.5 : 0.8);
            ctx.strokeStyle = isQuarter ? this.accentColor : (isHour ? 'rgba(255, 255, 255, 0.7)' : 'rgba(255, 255, 255, 0.2)');
            ctx.stroke();
        }

        // 5. Classic Roman / Arabic Numbers (12, 3, 6, 9 in Luxury Serif)
        const numerals = [
            { text: '12', angle: -Math.PI / 2 },
            { text: '3', angle: 0 },
            { text: '6', angle: Math.PI / 2 },
            { text: '9', angle: Math.PI }
        ];

        ctx.save();
        ctx.font = '700 13px "Rajdhani", serif';
        ctx.fillStyle = '#f8fafc';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        numerals.forEach(n => {
            const numR = radius - 24;
            const nx = centerX + Math.cos(n.angle) * numR;
            const ny = centerY + Math.sin(n.angle) * numR;
            ctx.fillText(n.text, nx, ny);
        });
        ctx.restore();

        // 6. Vintage Brand / Text Emblem
        ctx.save();
        ctx.font = '600 7px "Orbitron", sans-serif';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.textAlign = 'center';
        ctx.letterSpacing = '1.5px';
        ctx.fillText('CHRONOGRAPH', centerX, centerY - 28);
        ctx.font = '700 7px "Rajdhani", sans-serif';
        ctx.fillStyle = this.accentColor;
        ctx.fillText('AUTOMATIC', centerX, centerY - 16);
        ctx.restore();

        // 7. Date Aperture (Symmetrical Luxury Date Window at 6 o'clock above 6)
        const dateX = centerX;
        const dateY = centerY + (radius * 0.40);
        ctx.save();
        ctx.fillStyle = '#04070e';
        ctx.fillRect(dateX - 16, dateY - 12, 32, 24);
        
        // Metallic outer border
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(dateX - 16, dateY - 12, 32, 24);
        
        // Inner accent border
        ctx.strokeStyle = this.accentColor;
        ctx.lineWidth = 0.8;
        ctx.strokeRect(dateX - 15, dateY - 11, 30, 22);

        ctx.font = '800 15px "Cinzel", "Playfair Display", "Rajdhani", serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(now.getDate()), dateX, dateY + 1);
        ctx.restore();

        // 8. Hour Hand (Faceted Classic Sword Style)
        const hourAngle = (hour * Math.PI) / 6 - Math.PI / 2;
        const hourLen = radius * 0.48;

        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(
            centerX + Math.cos(hourAngle) * hourLen,
            centerY + Math.sin(hourAngle) * hourLen
        );
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#e2e8f0';
        ctx.stroke();

        // Inner glowing stripe
        ctx.beginPath();
        ctx.moveTo(
            centerX + Math.cos(hourAngle) * (hourLen * 0.3),
            centerY + Math.sin(hourAngle) * (hourLen * 0.3)
        );
        ctx.lineTo(
            centerX + Math.cos(hourAngle) * (hourLen * 0.85),
            centerY + Math.sin(hourAngle) * (hourLen * 0.85)
        );
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = this.accentColor;
        ctx.stroke();
        ctx.restore();

        // 9. Minute Hand (Long Elegant Sword Style)
        const minAngle = (min * Math.PI) / 30 - Math.PI / 2;
        const minLen = radius * 0.72;

        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(
            centerX + Math.cos(minAngle) * minLen,
            centerY + Math.sin(minAngle) * minLen
        );
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();

        // Inner glowing stripe
        ctx.beginPath();
        ctx.moveTo(
            centerX + Math.cos(minAngle) * (minLen * 0.25),
            centerY + Math.sin(minAngle) * (minLen * 0.25)
        );
        ctx.lineTo(
            centerX + Math.cos(minAngle) * (minLen * 0.9),
            centerY + Math.sin(minAngle) * (minLen * 0.9)
        );
        ctx.lineWidth = 1.2;
        ctx.strokeStyle = this.accentColor;
        ctx.stroke();
        ctx.restore();

        // 10. Second Hand (Smooth 60fps Continuous Sweeping Needle)
        const secAngle = (sec * Math.PI) / 30 - Math.PI / 2;
        const secLen = radius * 0.82;
        const secTailLen = radius * 0.22;

        ctx.save();
        ctx.shadowColor = this.accentColor;
        ctx.shadowBlur = 10;

        ctx.beginPath();
        // Counterweight tail
        ctx.moveTo(
            centerX - Math.cos(secAngle) * secTailLen,
            centerY - Math.sin(secAngle) * secTailLen
        );
        // Pointer tip
        ctx.lineTo(
            centerX + Math.cos(secAngle) * secLen,
            centerY + Math.sin(secAngle) * secLen
        );
        ctx.lineWidth = 1.6;
        ctx.strokeStyle = this.accentColor;
        ctx.stroke();

        // Second hand counterweight circle
        ctx.beginPath();
        ctx.arc(
            centerX - Math.cos(secAngle) * (secTailLen * 0.5),
            centerY - Math.sin(secAngle) * (secTailLen * 0.5),
            3.5, 0, 2 * Math.PI
        );
        ctx.fillStyle = this.accentColor;
        ctx.fill();
        ctx.restore();

        // 11. Center Pin & Cap
        ctx.beginPath();
        ctx.arc(centerX, centerY, 5, 0, 2 * Math.PI);
        ctx.fillStyle = '#0f172a';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(centerX, centerY, 2, 0, 2 * Math.PI);
        ctx.fillStyle = this.accentColor;
        ctx.fill();
    }
}

window.ClassicAnalogClock = ClassicAnalogClock;

/**
 * High-Performance HTML5 Canvas GPS Speedometer Gauge
 * Megane IV Digital Cockpit Styling (OBD-Free, GPS Driven)
 */

class MeganeGauge {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.currentSpeed = 0;
        this.targetSpeed = 0;
        this.maxSpeed = 240;
        
        this.accentColor = '#ff2a44';
        this.accentSecondary = '#ff7700';

        this.setupDPI();
        this.startLoop();

        window.addEventListener('resize', () => {
            this.setupDPI();
        });
    }

    setupDPI() {
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

    setSpeed(speed) {
        this.targetSpeed = Math.min(Math.max(speed, 0), this.maxSpeed);
    }

    startLoop() {
        const render = () => {
            // Smooth speed interpolation
            this.currentSpeed += (this.targetSpeed - this.currentSpeed) * 0.12;
            this.draw();
            requestAnimationFrame(render);
        };
        requestAnimationFrame(render);
    }

    draw() {
        const { ctx, width, height } = this;
        if (!width || !height) return;

        ctx.clearRect(0, 0, width, height);

        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(centerX, centerY) - 20;

        const startAngle = 0.75 * Math.PI; // 135 deg
        const endAngle = 2.25 * Math.PI;   // 405 deg
        const totalAngle = endAngle - startAngle;

        // 1. Background Track Arc
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 14;
        ctx.lineCap = 'round';
        ctx.stroke();

        // 2. Inner Track
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius - 16, startAngle, endAngle);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.lineWidth = 4;
        ctx.stroke();

        // 3. Active Speed Arc with Gradient & Glow
        const currentSpeedRatio = this.currentSpeed / this.maxSpeed;
        const currentSpeedAngle = startAngle + totalAngle * currentSpeedRatio;

        if (this.currentSpeed > 0.5) {
            ctx.save();
            ctx.shadowColor = this.accentColor;
            ctx.shadowBlur = 18;

            const grad = ctx.createLinearGradient(0, 0, width, height);
            grad.addColorStop(0, this.accentSecondary);
            grad.addColorStop(1, this.accentColor);

            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, startAngle, currentSpeedAngle);
            ctx.strokeStyle = grad;
            ctx.lineWidth = 14;
            ctx.lineCap = 'round';
            ctx.stroke();
            ctx.restore();
        }

        // 4. Tick Marks and Numbers (0 to 240)
        const totalTicks = 24; // Every 10 km/h
        for (let i = 0; i <= totalTicks; i++) {
            const tickRatio = i / totalTicks;
            const tickAngle = startAngle + totalAngle * tickRatio;
            const isMajor = i % 3 === 0;

            const tickLen = isMajor ? 12 : 6;
            const tickOuter = radius + 14;
            const tickInner = tickOuter - tickLen;

            const x1 = centerX + Math.cos(tickAngle) * tickInner;
            const y1 = centerY + Math.sin(tickAngle) * tickInner;
            const x2 = centerX + Math.cos(tickAngle) * tickOuter;
            const y2 = centerY + Math.sin(tickAngle) * tickOuter;

            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.lineWidth = isMajor ? 2.2 : 1.1;

            if (tickRatio <= currentSpeedRatio) {
                ctx.strokeStyle = this.accentColor;
            } else {
                ctx.strokeStyle = isMajor ? 'rgba(255, 255, 255, 0.35)' : 'rgba(255, 255, 255, 0.1)';
            }
            ctx.stroke();

            // Labels
            if (isMajor) {
                const labelRadius = radius + 26;
                const lx = centerX + Math.cos(tickAngle) * labelRadius;
                const ly = centerY + Math.sin(tickAngle) * labelRadius;
                const speedVal = i * 10;

                ctx.save();
                ctx.font = '600 10px "Orbitron", monospace';
                ctx.fillStyle = tickRatio <= currentSpeedRatio ? '#ffffff' : 'rgba(255, 255, 255, 0.4)';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(speedVal, lx, ly);
                ctx.restore();
            }
        }

        // 5. Glowing Tip Indicator
        if (this.currentSpeed > 0.5) {
            const tipX = centerX + Math.cos(currentSpeedAngle) * radius;
            const tipY = centerY + Math.sin(currentSpeedAngle) * radius;

            ctx.save();
            ctx.beginPath();
            ctx.arc(tipX, tipY, 7, 0, 2 * Math.PI);
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = '#ffffff';
            ctx.shadowBlur = 10;
            ctx.fill();
            ctx.restore();
        }
    }
}

window.MeganeGauge = MeganeGauge;

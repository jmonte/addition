/**
 * Animation Manager - handles all game animations
 */
class AnimationManager {
    constructor() {
        this.animations = [];
        this.isRunning = false;
        this.lastTime = 0;
    }

    /**
     * Add a new animation
     */
    add(animation) {
        this.animations.push(animation);
        if (!this.isRunning) {
            this.start();
        }
    }

    /**
     * Start the animation loop
     */
    start() {
        this.isRunning = true;
        this.lastTime = performance.now();
        this.loop();
    }

    /**
     * Stop the animation loop
     */
    stop() {
        this.isRunning = false;
    }

    /**
     * Animation loop
     */
    loop() {
        if (!this.isRunning) return;

        const currentTime = performance.now();
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        // Update all animations
        this.animations = this.animations.filter(anim => {
            anim.update(deltaTime);
            return !anim.isComplete();
        });

        // Stop if no more animations
        if (this.animations.length === 0) {
            this.isRunning = false;
        } else {
            requestAnimationFrame(() => this.loop());
        }
    }

    /**
     * Clear all animations
     */
    clear() {
        this.animations = [];
    }

    /**
     * Check if any animations are running
     */
    hasAnimations() {
        return this.animations.length > 0;
    }
}

/**
 * Base Animation class
 */
class Animation {
    constructor(duration, onUpdate, onComplete) {
        this.duration = duration;
        this.elapsed = 0;
        this.onUpdate = onUpdate;
        this.onComplete = onComplete;
    }

    update(deltaTime) {
        this.elapsed += deltaTime;
        const progress = Math.min(this.elapsed / this.duration, 1);

        if (this.onUpdate) {
            this.onUpdate(progress, this.easeOut(progress));
        }

        if (progress >= 1 && this.onComplete) {
            this.onComplete();
        }
    }

    isComplete() {
        return this.elapsed >= this.duration;
    }

    // Easing functions
    easeOut(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    easeInOut(t) {
        return t < 0.5
            ? 4 * t * t * t
            : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }
}

/**
 * Ripple Animation - the expanding circle effect when tapping
 */
class RippleAnimation extends Animation {
    constructor(x, y, cellSize, maxRadius, color, onUpdate) {
        super(400); // 400ms duration
        this.x = x;
        this.y = y;
        this.cellSize = cellSize;
        this.maxRadius = maxRadius || cellSize * 1.5;
        this.color = color || 'rgba(126, 184, 201, 0.6)';
        this.customOnUpdate = onUpdate;
    }

    update(deltaTime) {
        this.elapsed += deltaTime;
        const progress = Math.min(this.elapsed / this.duration, 1);
        const easedProgress = this.easeOut(progress);

        this.currentRadius = easedProgress * this.maxRadius;
        this.opacity = 1 - easedProgress;

        if (this.customOnUpdate) {
            this.customOnUpdate();
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.currentRadius, 0, Math.PI * 2);
        ctx.strokeStyle = this.color.replace(/[\d.]+\)$/, `${this.opacity * 0.6})`);
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.restore();
    }
}

/**
 * Number Pop Animation - when a number changes
 */
class NumberPopAnimation extends Animation {
    constructor(cellX, cellY, addedValue, onUpdate) {
        super(300); // 300ms duration
        this.cellX = cellX;
        this.cellY = cellY;
        this.addedValue = addedValue;
        this.scale = 1;
        this.customOnUpdate = onUpdate;
    }

    update(deltaTime) {
        this.elapsed += deltaTime;
        const progress = Math.min(this.elapsed / this.duration, 1);

        // Pop effect: scale up then back down
        if (progress < 0.3) {
            this.scale = 1 + (progress / 0.3) * 0.3;
        } else {
            this.scale = 1.3 - ((progress - 0.3) / 0.7) * 0.3;
        }

        if (this.customOnUpdate) {
            this.customOnUpdate();
        }
    }
}

/**
 * Target Complete Animation - glow effect when reaching target
 */
class TargetCompleteAnimation extends Animation {
    constructor(cellX, cellY, onUpdate) {
        super(600); // 600ms duration
        this.cellX = cellX;
        this.cellY = cellY;
        this.glowIntensity = 0;
        this.customOnUpdate = onUpdate;
    }

    update(deltaTime) {
        this.elapsed += deltaTime;
        const progress = Math.min(this.elapsed / this.duration, 1);

        // Pulse glow effect
        this.glowIntensity = Math.sin(progress * Math.PI) * 0.8;

        if (this.customOnUpdate) {
            this.customOnUpdate();
        }
    }
}

/**
 * Win Celebration Animation - particles/petals when completing level
 */
class WinCelebrationAnimation extends Animation {
    constructor(canvasWidth, canvasHeight, onUpdate) {
        super(2000); // 2 second celebration
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.particles = [];
        this.customOnUpdate = onUpdate;
        this.initParticles();
    }

    initParticles() {
        const colors = ['#FFB7C5', '#FFC8D5', '#FFD4E0', '#FFEEF2'];
        for (let i = 0; i < 30; i++) {
            this.particles.push({
                x: Math.random() * this.canvasWidth,
                y: -20 - Math.random() * 50,
                size: 8 + Math.random() * 8,
                speedY: 1 + Math.random() * 2,
                speedX: (Math.random() - 0.5) * 2,
                rotation: Math.random() * 360,
                rotationSpeed: (Math.random() - 0.5) * 4,
                color: colors[Math.floor(Math.random() * colors.length)],
                opacity: 0.7 + Math.random() * 0.3
            });
        }
    }

    update(deltaTime) {
        this.elapsed += deltaTime;

        for (const particle of this.particles) {
            particle.y += particle.speedY;
            particle.x += particle.speedX;
            particle.rotation += particle.rotationSpeed;

            // Fade out near bottom
            if (particle.y > this.canvasHeight * 0.7) {
                particle.opacity = Math.max(0, particle.opacity - 0.02);
            }
        }

        if (this.customOnUpdate) {
            this.customOnUpdate();
        }
    }

    draw(ctx) {
        ctx.save();
        for (const particle of this.particles) {
            ctx.save();
            ctx.translate(particle.x, particle.y);
            ctx.rotate(particle.rotation * Math.PI / 180);
            ctx.globalAlpha = particle.opacity;
            ctx.fillStyle = particle.color;

            // Draw petal shape
            ctx.beginPath();
            ctx.ellipse(0, 0, particle.size / 2, particle.size, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }
        ctx.restore();
    }
}

/**
 * Floating Plus Animation - shows +1 or +2 floating up
 */
class FloatingPlusAnimation extends Animation {
    constructor(x, y, value, onUpdate) {
        super(500); // 500ms duration
        this.x = x;
        this.y = y;
        this.value = value;
        this.offsetY = 0;
        this.opacity = 1;
        this.customOnUpdate = onUpdate;
    }

    update(deltaTime) {
        this.elapsed += deltaTime;
        const progress = Math.min(this.elapsed / this.duration, 1);
        const easedProgress = this.easeOut(progress);

        this.offsetY = -30 * easedProgress;
        this.opacity = 1 - easedProgress;

        if (this.customOnUpdate) {
            this.customOnUpdate();
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.opacity;
        ctx.fillStyle = '#5D6B5D';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`+${this.value}`, this.x, this.y + this.offsetY);
        ctx.restore();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        AnimationManager,
        Animation,
        RippleAnimation,
        NumberPopAnimation,
        TargetCompleteAnimation,
        WinCelebrationAnimation,
        FloatingPlusAnimation
    };
}

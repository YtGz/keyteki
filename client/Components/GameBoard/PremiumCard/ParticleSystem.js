/**
 * Particle system for premium card effects
 * Creates sparkles, energy wisps, and magical effects
 */

import { Container, Graphics, Ticker } from 'pixi.js';

/**
 * Particle configuration presets
 */
export const PARTICLE_PRESETS = {
    sparkle: {
        count: 15,
        lifetime: { min: 0.5, max: 1.5 },
        speed: { min: 20, max: 50 },
        size: { min: 1, max: 3 },
        color: 0xffd700,
        alpha: { start: 1, end: 0 },
        gravity: -10,
        spread: Math.PI * 2,
        emitRate: 5
    },
    fire: {
        count: 20,
        lifetime: { min: 0.3, max: 0.8 },
        speed: { min: 30, max: 60 },
        size: { min: 2, max: 5 },
        color: 0xff6600,
        colorEnd: 0xff0000,
        alpha: { start: 0.8, end: 0 },
        gravity: -50,
        spread: Math.PI / 4,
        emitRate: 10
    },
    ice: {
        count: 12,
        lifetime: { min: 1, max: 2 },
        speed: { min: 10, max: 30 },
        size: { min: 2, max: 4 },
        color: 0x00ffff,
        alpha: { start: 0.6, end: 0 },
        gravity: 5,
        spread: Math.PI * 2,
        emitRate: 3
    },
    shadow: {
        count: 10,
        lifetime: { min: 1, max: 2 },
        speed: { min: 5, max: 15 },
        size: { min: 3, max: 6 },
        color: 0x330066,
        alpha: { start: 0.4, end: 0 },
        gravity: -5,
        spread: Math.PI * 2,
        emitRate: 2
    },
    holy: {
        count: 8,
        lifetime: { min: 1.5, max: 3 },
        speed: { min: 15, max: 25 },
        size: { min: 2, max: 4 },
        color: 0xffffcc,
        alpha: { start: 0.7, end: 0 },
        gravity: -20,
        spread: Math.PI / 6,
        emitRate: 2
    },
    nature: {
        count: 12,
        lifetime: { min: 2, max: 4 },
        speed: { min: 10, max: 20 },
        size: { min: 2, max: 3 },
        color: 0x00ff00,
        alpha: { start: 0.5, end: 0 },
        gravity: 10,
        spread: Math.PI,
        emitRate: 2
    }
};

/**
 * Map houses to particle effects
 */
export const HOUSE_PARTICLES = {
    brobnar: 'fire',
    dis: 'shadow',
    logos: 'sparkle',
    mars: 'fire',
    sanctum: 'holy',
    shadows: 'shadow',
    untamed: 'nature',
    saurian: 'fire',
    staralliance: 'sparkle',
    unfathomable: 'ice',
    ekwidon: 'sparkle',
    geistoid: 'ice',
    skyborn: 'sparkle',
    redemption: 'holy'
};

/**
 * Individual particle class
 */
class Particle {
    constructor(config) {
        this.x = config.x || 0;
        this.y = config.y || 0;
        this.vx = config.vx || 0;
        this.vy = config.vy || 0;
        this.size = config.size || 2;
        this.color = config.color || 0xffffff;
        this.colorEnd = config.colorEnd;
        this.alpha = config.alpha || 1;
        this.alphaStart = config.alphaStart || 1;
        this.alphaEnd = config.alphaEnd || 0;
        this.lifetime = config.lifetime || 1;
        this.maxLifetime = this.lifetime;
        this.gravity = config.gravity || 0;
        this.active = true;

        // Graphics object for rendering
        this.graphics = new Graphics();
        this.updateGraphics();
    }

    updateGraphics() {
        this.graphics.clear();
        this.graphics.fill({ color: this.color, alpha: this.alpha });
        this.graphics.circle(0, 0, this.size);
        this.graphics.fill();
        this.graphics.position.set(this.x, this.y);
    }

    update(delta) {
        if (!this.active) return;

        // Update position
        this.x += this.vx * delta;
        this.y += this.vy * delta;
        this.vy += this.gravity * delta;

        // Update lifetime
        this.lifetime -= delta;
        if (this.lifetime <= 0) {
            this.active = false;
            return;
        }

        // Update alpha based on lifetime
        const lifeRatio = this.lifetime / this.maxLifetime;
        this.alpha = this.alphaEnd + (this.alphaStart - this.alphaEnd) * lifeRatio;

        // Update color if gradient
        if (this.colorEnd !== undefined) {
            this.color = lerpColor(this.colorEnd, this.color, lifeRatio);
        }

        // Update size (shrink over time)
        this.size *= 0.99;

        this.updateGraphics();
    }

    reset(config) {
        this.x = config.x || 0;
        this.y = config.y || 0;
        this.vx = config.vx || 0;
        this.vy = config.vy || 0;
        this.size = config.size || 2;
        this.color = config.color || 0xffffff;
        this.alpha = config.alphaStart || 1;
        this.alphaStart = config.alphaStart || 1;
        this.alphaEnd = config.alphaEnd || 0;
        this.lifetime = config.lifetime || 1;
        this.maxLifetime = this.lifetime;
        this.gravity = config.gravity || 0;
        this.active = true;
        this.updateGraphics();
    }
}

/**
 * Particle emitter class
 */
export class ParticleEmitter extends Container {
    constructor(config = PARTICLE_PRESETS.sparkle) {
        super();

        this.config = { ...PARTICLE_PRESETS.sparkle, ...config };
        this.particles = [];
        this.emitTimer = 0;
        this.emitPosition = { x: 0, y: 0 };
        this.bounds = { width: 100, height: 100 };
        this.active = true;

        // Pre-create particle pool
        this.initParticlePool();

        // Start update loop
        this.ticker = new Ticker();
        this.ticker.add(this.update, this);
        this.ticker.start();
    }

    initParticlePool() {
        for (let i = 0; i < this.config.count; i++) {
            const particle = new Particle({
                ...this.getRandomParticleConfig(),
                active: false
            });
            this.particles.push(particle);
            this.addChild(particle.graphics);
        }
    }

    getRandomParticleConfig() {
        const angle = Math.random() * this.config.spread - this.config.spread / 2 - Math.PI / 2;
        const speed = randomRange(this.config.speed.min, this.config.speed.max);

        return {
            x: this.emitPosition.x + randomRange(-10, 10),
            y: this.emitPosition.y + randomRange(-10, 10),
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: randomRange(this.config.size.min, this.config.size.max),
            color: this.config.color,
            colorEnd: this.config.colorEnd,
            alphaStart: this.config.alpha.start,
            alphaEnd: this.config.alpha.end,
            lifetime: randomRange(this.config.lifetime.min, this.config.lifetime.max),
            gravity: this.config.gravity
        };
    }

    emit(count = 1) {
        for (let i = 0; i < count; i++) {
            const particle = this.particles.find((p) => !p.active);
            if (particle) {
                particle.reset(this.getRandomParticleConfig());
            }
        }
    }

    update = (ticker) => {
        if (!this.active) return;

        const delta = ticker.deltaMS / 1000;

        // Emit new particles
        this.emitTimer += delta;
        const emitInterval = 1 / this.config.emitRate;
        while (this.emitTimer >= emitInterval) {
            this.emit(1);
            this.emitTimer -= emitInterval;
        }

        // Update existing particles
        for (const particle of this.particles) {
            particle.update(delta);
        }
    };

    setEmitPosition(x, y) {
        this.emitPosition.x = x;
        this.emitPosition.y = y;
    }

    setBounds(width, height) {
        this.bounds.width = width;
        this.bounds.height = height;
    }

    setConfig(config) {
        this.config = { ...this.config, ...config };
    }

    start() {
        this.active = true;
    }

    stop() {
        this.active = false;
    }

    burst(count = 10) {
        this.emit(count);
    }

    destroy() {
        this.ticker.stop();
        this.ticker.destroy();
        super.destroy({ children: true });
    }
}

/**
 * Create a particle emitter for a specific house
 */
export function createHouseEmitter(house, bounds) {
    const presetName = HOUSE_PARTICLES[house] || 'sparkle';
    const preset = PARTICLE_PRESETS[presetName];

    const emitter = new ParticleEmitter(preset);
    emitter.setBounds(bounds.width, bounds.height);
    emitter.setEmitPosition(bounds.width / 2, bounds.height / 2);

    return emitter;
}

// Utility functions
function randomRange(min, max) {
    return Math.random() * (max - min) + min;
}

function lerpColor(color1, color2, ratio) {
    const r1 = (color1 >> 16) & 0xff;
    const g1 = (color1 >> 8) & 0xff;
    const b1 = color1 & 0xff;

    const r2 = (color2 >> 16) & 0xff;
    const g2 = (color2 >> 8) & 0xff;
    const b2 = color2 & 0xff;

    const r = Math.round(r1 + (r2 - r1) * ratio);
    const g = Math.round(g1 + (g2 - g1) * ratio);
    const b = Math.round(b1 + (b2 - b1) * ratio);

    return (r << 16) | (g << 8) | b;
}

import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
    Application,
    Assets,
    Container,
    Sprite,
    Graphics,
    Text,
    TextStyle,
    Filter,
    GlProgram
} from 'pixi.js';
import classNames from 'classnames';

import './PremiumCard.scss';

// Default vertex shader for filters in PixiJS v8
const defaultFilterVert = `
in vec2 aPosition;
out vec2 vTextureCoord;

uniform vec4 uInputSize;
uniform vec4 uOutputFrame;
uniform vec4 uOutputTexture;

vec4 filterVertexPosition(void)
{
    vec2 position = aPosition * uOutputFrame.zw + uOutputFrame.xy;
    position.x = position.x * (2.0 / uOutputTexture.x) - 1.0;
    position.y = position.y * (2.0 * uOutputTexture.z / uOutputTexture.y) - uOutputTexture.z;
    return vec4(position, 0.0, 1.0);
}

vec2 filterTextureCoord(void)
{
    return aPosition * (uOutputFrame.zw * uInputSize.zw);
}

void main(void)
{
    gl_Position = filterVertexPosition();
    vTextureCoord = filterTextureCoord();
}
`;

// Fragment shader for holographic/shimmer effect (PixiJS v8 syntax)
const holographicFrag = `
in vec2 vTextureCoord;
out vec4 finalColor;

uniform sampler2D uTexture;
uniform float uTime;
uniform float uIntensity;
uniform vec2 uMouse;

void main(void) {
    vec4 color = texture(uTexture, vTextureCoord);
    
    // Rainbow holographic shift based on angle and time
    float angle = atan(vTextureCoord.y - 0.5, vTextureCoord.x - 0.5);
    float dist = length(vTextureCoord - vec2(0.5));
    
    // Shimmer wave
    float shimmer = sin(angle * 3.0 + uTime * 2.0 + dist * 10.0) * 0.5 + 0.5;
    
    // Mouse-based highlight
    float mouseDist = length(vTextureCoord - uMouse);
    float highlight = smoothstep(0.4, 0.0, mouseDist) * 0.3;
    
    // Apply holographic color shift
    vec3 holoColor = vec3(
        sin(shimmer * 6.28 + 0.0) * 0.5 + 0.5,
        sin(shimmer * 6.28 + 2.09) * 0.5 + 0.5,
        sin(shimmer * 6.28 + 4.18) * 0.5 + 0.5
    );
    
    // Blend holographic effect with original
    color.rgb = mix(color.rgb, color.rgb + holoColor * 0.2, uIntensity);
    color.rgb += highlight;
    
    finalColor = color;
}
`;

// Fragment shader for energy glow effect (reserved for future use, PixiJS v8 syntax)
// eslint-disable-next-line no-unused-vars
const glowFrag = `
in vec2 vTextureCoord;
out vec4 finalColor;

uniform sampler2D uTexture;
uniform float uTime;
uniform vec3 uGlowColor;
uniform float uGlowIntensity;

void main(void) {
    vec4 color = texture(uTexture, vTextureCoord);
    
    // Pulsing glow
    float pulse = sin(uTime * 3.0) * 0.5 + 0.5;
    
    // Edge glow based on alpha
    float edge = smoothstep(0.1, 0.5, color.a) * (1.0 - smoothstep(0.5, 0.9, color.a));
    
    // Apply glow
    color.rgb += uGlowColor * edge * pulse * uGlowIntensity;
    
    finalColor = color;
}
`;

/**
 * Card size configurations matching the existing system
 */
const CARD_SIZES = {
    small: { width: 39, height: 55, scale: 0.6 },
    normal: { width: 65, height: 91, scale: 1.0 },
    large: { width: 91, height: 127, scale: 1.4 },
    'x-large': { width: 130, height: 182, scale: 2.0 }
};

/**
 * House color themes for glow effects
 */
const HOUSE_COLORS = {
    brobnar: { primary: 0xff6b35, secondary: 0xffa366 },
    dis: { primary: 0x9933ff, secondary: 0xcc99ff },
    logos: { primary: 0x00bfff, secondary: 0x66d9ff },
    mars: { primary: 0xff3333, secondary: 0xff6666 },
    sanctum: { primary: 0xffd700, secondary: 0xffeb99 },
    shadows: { primary: 0x4a4a4a, secondary: 0x808080 },
    untamed: { primary: 0x33cc33, secondary: 0x66ff66 },
    saurian: { primary: 0xcc9900, secondary: 0xffcc33 },
    staralliance: { primary: 0x6699ff, secondary: 0x99ccff },
    unfathomable: { primary: 0x006699, secondary: 0x3399cc },
    ekwidon: { primary: 0x996633, secondary: 0xcc9966 },
    geistoid: { primary: 0x99cccc, secondary: 0xccffff },
    skyborn: { primary: 0x66ccff, secondary: 0x99e6ff },
    redemption: { primary: 0xff9900, secondary: 0xffcc66 }
};

/**
 * PremiumCard - A WebGL-accelerated card renderer with premium visual effects
 */
const PremiumCard = ({
    card,
    cardBack,
    size = 'normal',
    halfSize = false,
    orientation = 'vertical',
    isPremium = false,
    onMouseOver,
    onMouseOut,
    onClick,
    className,
    disabled = false
}) => {
    const containerRef = useRef(null);
    const appRef = useRef(null);
    const spriteRef = useRef(null);
    const [isHovered, setIsHovered] = useState(false);
    const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
    const animationRef = useRef(null);
    const timeRef = useRef(0);

    const cardSize = CARD_SIZES[size] || CARD_SIZES.normal;
    const houseColors = HOUSE_COLORS[card?.house] || HOUSE_COLORS.shadows;

    // Initialize PixiJS application
    useEffect(() => {
        if (!containerRef.current) return;

        const app = new Application();

        const initApp = async () => {
            await app.init({
                width: cardSize.width,
                height: cardSize.height,
                backgroundAlpha: 0,
                antialias: true,
                resolution: window.devicePixelRatio || 2,
                autoDensity: true
            });

            containerRef.current.appendChild(app.canvas);
            appRef.current = app;

            // Load and display card
            await loadCard(app);

            // Start animation loop if premium
            if (isPremium) {
                startAnimationLoop(app);
            }
        };

        initApp();

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
            if (appRef.current) {
                appRef.current.destroy(true, { children: true, texture: true });
                appRef.current = null;
            }
        };
    }, [card?.id, size, isPremium]);

    // Load card texture and create sprite
    const loadCard = async (app) => {
        if (!card || !app) return;

        const imageUrl = card.facedown
            ? cardBack
            : `/img/cards/${halfSize ? 'halfSize/' : ''}${card.image?.replace(/\*/g, '_')}.${
                  halfSize ? 'jpg' : 'png'
              }`;

        try {
            const texture = await Assets.load(imageUrl);

            // Clear previous content
            app.stage.removeChildren();

            // Create main card container with 3D transform support
            const cardContainer = new Container();
            cardContainer.pivot.set(cardSize.width / 2, cardSize.height / 2);
            cardContainer.position.set(cardSize.width / 2, cardSize.height / 2);

            // Shadow layer
            const shadow = new Graphics();
            shadow.fill({ color: 0x000000, alpha: 0.4 });
            shadow.roundRect(-2, 2, cardSize.width, cardSize.height, 4);
            shadow.fill();
            cardContainer.addChild(shadow);

            // Card sprite
            const sprite = new Sprite(texture);
            sprite.width = cardSize.width;
            sprite.height = cardSize.height;
            spriteRef.current = sprite;

            // Apply premium effects
            if (isPremium && !card.facedown) {
                // Add holographic filter
                const holoFilter = createHolographicFilter();
                sprite.filters = [holoFilter];
            }

            cardContainer.addChild(sprite);

            // Add frame overlay (rendered on top)
            const frame = createCardFrame(card, cardSize, houseColors);
            if (frame) {
                cardContainer.addChild(frame);
            }

            // Add stats overlay
            if (card.type === 'creature' && !card.facedown) {
                const stats = createStatsOverlay(card, cardSize);
                cardContainer.addChild(stats);
            }

            // Add token overlays
            if (card.tokens && Object.keys(card.tokens).length > 0) {
                const tokens = createTokenOverlay(card, cardSize);
                cardContainer.addChild(tokens);
            }

            app.stage.addChild(cardContainer);

            // Store reference for animation
            app.stage.cardContainer = cardContainer;
        } catch (error) {
            console.error('Failed to load card image:', error);
            // Show fallback
            createFallbackCard(app);
        }
    };

    // Create holographic shader filter
    const createHolographicFilter = () => {
        const glProgram = new GlProgram({
            vertex: defaultFilterVert,
            fragment: holographicFrag
        });

        const filter = new Filter({
            glProgram,
            resources: {
                holoUniforms: {
                    uTime: { value: 0, type: 'f32' },
                    uIntensity: { value: 0.5, type: 'f32' },
                    uMouse: { value: new Float32Array([0.5, 0.5]), type: 'vec2<f32>' }
                }
            }
        });
        return filter;
    };

    // Create card frame graphics
    const createCardFrame = (card, size, colors) => {
        const frame = new Graphics();

        // Outer glow
        if (isPremium) {
            frame.stroke({ width: 3, color: colors.primary, alpha: 0.6 });
            frame.roundRect(0, 0, size.width, size.height, 4);
            frame.stroke();
        }

        // Inner border
        frame.stroke({ width: 1, color: 0xffffff, alpha: 0.3 });
        frame.roundRect(1, 1, size.width - 2, size.height - 2, 3);
        frame.stroke();

        return frame;
    };

    // Create stats overlay (power/armor for creatures)
    const createStatsOverlay = (card, size) => {
        const container = new Container();
        const scale = size.scale;

        // Power
        if (card.power !== undefined) {
            const powerStyle = new TextStyle({
                fontFamily: 'Bombardier, Arial Black, sans-serif',
                fontSize: 14 * scale,
                fill: 0xffffff,
                stroke: { color: 0x000000, width: 2 * scale },
                fontWeight: 'bold'
            });
            const powerText = new Text({
                text: card.modifiedPower?.toString() || card.power?.toString() || '0',
                style: powerStyle
            });
            powerText.anchor.set(0.5);
            powerText.position.set(12 * scale, size.height - 12 * scale);
            container.addChild(powerText);
        }

        // Armor
        if (card.armor > 0) {
            const armorStyle = new TextStyle({
                fontFamily: 'Bombardier, Arial Black, sans-serif',
                fontSize: 14 * scale,
                fill: 0xffd700,
                stroke: { color: 0x000000, width: 2 * scale },
                fontWeight: 'bold'
            });
            const armorText = new Text({
                text: card.armor?.toString() || '0',
                style: armorStyle
            });
            armorText.anchor.set(0.5);
            armorText.position.set(size.width - 12 * scale, size.height - 12 * scale);
            container.addChild(armorText);
        }

        return container;
    };

    // Create token overlay
    const createTokenOverlay = (card, size) => {
        const container = new Container();
        const tokens = card.tokens || {};
        const scale = size.scale;
        let index = 0;

        const tokenColors = {
            damage: 0xff0000,
            amber: 0xffd700,
            power: 0x00ff00,
            armor: 0x808080,
            stun: 0xffff00,
            ward: 0x00ffff,
            enrage: 0xff6600
        };

        for (const [tokenType, count] of Object.entries(tokens)) {
            if (count > 0 && tokenColors[tokenType]) {
                const tokenContainer = new Container();

                // Token background
                const bg = new Graphics();
                bg.fill({ color: tokenColors[tokenType], alpha: 0.9 });
                bg.circle(0, 0, 10 * scale);
                bg.fill();
                bg.stroke({ width: 1, color: 0x000000 });
                bg.circle(0, 0, 10 * scale);
                bg.stroke();
                tokenContainer.addChild(bg);

                // Token count
                const style = new TextStyle({
                    fontFamily: 'Arial Black, sans-serif',
                    fontSize: 10 * scale,
                    fill: 0xffffff,
                    stroke: { color: 0x000000, width: 1 }
                });
                const text = new Text({ text: count.toString(), style });
                text.anchor.set(0.5);
                tokenContainer.addChild(text);

                // Position tokens in a grid
                const col = index % 3;
                const row = Math.floor(index / 3);
                tokenContainer.position.set(
                    15 * scale + col * 22 * scale,
                    size.height / 2 + row * 22 * scale
                );

                container.addChild(tokenContainer);
                index++;
            }
        }

        return container;
    };

    // Create fallback card display
    const createFallbackCard = (app) => {
        const graphics = new Graphics();
        graphics.fill({ color: 0x333333 });
        graphics.roundRect(0, 0, cardSize.width, cardSize.height, 4);
        graphics.fill();

        const text = new Text({
            text: '?',
            style: new TextStyle({
                fontSize: 24,
                fill: 0xffffff
            })
        });
        text.anchor.set(0.5);
        text.position.set(cardSize.width / 2, cardSize.height / 2);

        app.stage.addChild(graphics);
        app.stage.addChild(text);
    };

    // Animation loop for premium effects
    const startAnimationLoop = (app) => {
        const animate = () => {
            timeRef.current += 0.016; // ~60fps

            // Update shader uniforms
            if (spriteRef.current?.filters) {
                for (const filter of spriteRef.current.filters) {
                    if (filter.resources?.holoUniforms?.uniforms) {
                        filter.resources.holoUniforms.uniforms.uTime = timeRef.current;
                        filter.resources.holoUniforms.uniforms.uMouse[0] = mousePos.x;
                        filter.resources.holoUniforms.uniforms.uMouse[1] = mousePos.y;
                    }
                }
            }

            // 3D tilt effect on hover
            if (app.stage.cardContainer && isHovered) {
                const tiltX = (mousePos.y - 0.5) * -15;
                const tiltY = (mousePos.x - 0.5) * 15;
                app.stage.cardContainer.rotation = tiltY * 0.01;
                app.stage.cardContainer.skew.set(tiltY * 0.005, tiltX * 0.005);
            } else if (app.stage.cardContainer) {
                // Subtle idle animation
                const idle = Math.sin(timeRef.current * 2) * 0.5;
                app.stage.cardContainer.rotation = idle * 0.01;
            }

            animationRef.current = requestAnimationFrame(animate);
        };

        animate();
    };

    // Handle mouse movement for 3D effect
    const handleMouseMove = useCallback((e) => {
        if (!containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        setMousePos({ x, y });
    }, []);

    const handleMouseEnter = useCallback(() => {
        setIsHovered(true);
        onMouseOver?.({
            image: card,
            size: 'normal'
        });
    }, [card, onMouseOver]);

    const handleMouseLeave = useCallback(() => {
        setIsHovered(false);
        setMousePos({ x: 0.5, y: 0.5 });
        onMouseOut?.();
    }, [onMouseOut]);

    const handleClick = useCallback(
        (e) => {
            e.preventDefault();
            onClick?.(card);
        },
        [card, onClick]
    );

    const containerClass = classNames('premium-card', className, {
        'premium-card--hovered': isHovered,
        'premium-card--premium': isPremium,
        'premium-card--disabled': disabled,
        'premium-card--exhausted': orientation === 'exhausted' || card?.exhausted,
        [`premium-card--${size}`]: size !== 'normal'
    });

    return (
        <div
            ref={containerRef}
            className={containerClass}
            style={{
                width: cardSize.width,
                height: cardSize.height
            }}
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={handleClick}
        />
    );
};

export default PremiumCard;

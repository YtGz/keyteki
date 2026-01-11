import React, { useState } from 'react';
import PremiumCard from './PremiumCard';
import './PremiumCardDemo.scss';

/**
 * Demo page for testing PremiumCard rendering
 * Access via: /premium-card-demo (add route in routes.js)
 */
const PremiumCardDemo = () => {
    const [selectedSize, setSelectedSize] = useState('normal');
    const [isPremium, setIsPremium] = useState(true);

    // Sample cards for testing
    const sampleCards = [
        {
            id: 'test-1',
            name: 'Ember Imp',
            house: 'dis',
            type: 'creature',
            power: 2,
            armor: 0,
            image: 'ember-imp',
            tokens: { damage: 1, amber: 2 }
        },
        {
            id: 'test-2',
            name: 'Dust Pixie',
            house: 'untamed',
            type: 'creature',
            power: 1,
            armor: 0,
            image: 'dust-pixie',
            tokens: {}
        },
        {
            id: 'test-3',
            name: 'Bait and Switch',
            house: 'shadows',
            type: 'action',
            image: 'bait-and-switch',
            tokens: {}
        },
        {
            id: 'test-4',
            name: 'Mighty Tiger',
            house: 'brobnar',
            type: 'creature',
            power: 6,
            armor: 1,
            image: 'mighty-tiger',
            tokens: { enrage: 1 }
        },
        {
            id: 'test-5',
            name: 'Sanctum Guardian',
            house: 'sanctum',
            type: 'creature',
            power: 4,
            armor: 2,
            image: 'sanctum-guardian',
            tokens: { ward: 1 }
        },
        {
            id: 'test-6',
            name: 'Logos Researcher',
            house: 'logos',
            type: 'creature',
            power: 2,
            armor: 0,
            image: 'research-smoko',
            tokens: {}
        }
    ];

    return (
        <div className='premium-card-demo'>
            <h1>Premium Card Renderer Demo</h1>

            <div className='premium-card-demo__controls'>
                <div className='control-group'>
                    <label>Card Size:</label>
                    <select value={selectedSize} onChange={(e) => setSelectedSize(e.target.value)}>
                        <option value='small'>Small (39x55)</option>
                        <option value='normal'>Normal (65x91)</option>
                        <option value='large'>Large (91x127)</option>
                        <option value='x-large'>X-Large (130x182)</option>
                    </select>
                </div>

                <div className='control-group'>
                    <label>
                        <input
                            type='checkbox'
                            checked={isPremium}
                            onChange={(e) => setIsPremium(e.target.checked)}
                        />
                        Premium Effects
                    </label>
                </div>
            </div>

            <div className='premium-card-demo__section'>
                <h2>Card Gallery</h2>
                <p>Hover over cards to see 3D tilt and glow effects</p>

                <div className='premium-card-demo__grid'>
                    {sampleCards.map((card) => (
                        <div key={card.id} className='premium-card-demo__card-wrapper'>
                            <PremiumCard
                                card={card}
                                size={selectedSize}
                                isPremium={isPremium}
                                onMouseOver={(data) => console.log('Hover:', data)}
                                onClick={(card) => console.log('Click:', card)}
                            />
                            <span className='card-name'>{card.name}</span>
                            <span className='card-house'>{card.house}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className='premium-card-demo__section'>
                <h2>Size Comparison</h2>
                <div className='premium-card-demo__sizes'>
                    {['small', 'normal', 'large', 'x-large'].map((size) => (
                        <div key={size} className='size-example'>
                            <PremiumCard card={sampleCards[0]} size={size} isPremium={isPremium} />
                            <span>{size}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className='premium-card-demo__section'>
                <h2>States</h2>
                <div className='premium-card-demo__states'>
                    <div className='state-example'>
                        <PremiumCard card={sampleCards[0]} size='normal' isPremium={isPremium} />
                        <span>Normal</span>
                    </div>
                    <div className='state-example'>
                        <PremiumCard
                            card={sampleCards[0]}
                            size='normal'
                            isPremium={isPremium}
                            orientation='exhausted'
                        />
                        <span>Exhausted</span>
                    </div>
                    <div className='state-example'>
                        <PremiumCard
                            card={sampleCards[0]}
                            size='normal'
                            isPremium={isPremium}
                            disabled
                        />
                        <span>Disabled</span>
                    </div>
                    <div className='state-example'>
                        <PremiumCard
                            card={{ ...sampleCards[0], facedown: true }}
                            cardBack='/img/idbacks/cardback.jpg'
                            size='normal'
                            isPremium={false}
                        />
                        <span>Face Down</span>
                    </div>
                </div>
            </div>

            <div className='premium-card-demo__section'>
                <h2>All Houses</h2>
                <div className='premium-card-demo__houses'>
                    {[
                        'brobnar',
                        'dis',
                        'logos',
                        'mars',
                        'sanctum',
                        'shadows',
                        'untamed',
                        'saurian',
                        'staralliance',
                        'unfathomable',
                        'ekwidon',
                        'geistoid',
                        'skyborn',
                        'redemption'
                    ].map((house) => (
                        <div key={house} className='house-example'>
                            <PremiumCard
                                card={{
                                    id: `house-${house}`,
                                    name: house,
                                    house: house,
                                    type: 'creature',
                                    power: 3,
                                    image: 'ember-imp' // Placeholder
                                }}
                                size='small'
                                isPremium={isPremium}
                            />
                            <span>{house}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className='premium-card-demo__info'>
                <h2>Features</h2>
                <ul>
                    <li>✨ WebGL-accelerated rendering via PixiJS</li>
                    <li>🎨 Per-house color themes and glow effects</li>
                    <li>🔮 3D tilt effect on hover (follows cursor)</li>
                    <li>💫 Holographic shimmer shader for premium cards</li>
                    <li>🌟 Animated rainbow border for premium cards</li>
                    <li>⚡ High-DPI / Retina display support</li>
                    <li>🎯 Crisp rendering at any size</li>
                    <li>💎 Token overlays with dynamic positioning</li>
                </ul>
            </div>
        </div>
    );
};

export default PremiumCardDemo;

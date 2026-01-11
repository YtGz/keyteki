# Premium Card Rendering System

## Vision
Create the most visually stunning card game experience on the web - surpassing Hearthstone with:
- Crystal-clear rendering at any size
- 3D depth and parallax effects
- Animated card art (shimmer, particles, living artwork)
- Premium "golden" card variants
- Smooth hover/interaction animations
- GPU-accelerated rendering via WebGL/PixiJS

## Architecture

### Layer System (back to front)
1. **Shadow Layer** - Dynamic drop shadow that responds to card tilt
2. **Card Base** - The frame/border (rendered as vector/high-res)
3. **Art Layer** - Card artwork with optional animation
4. **Art Mask** - Clips artwork to frame shape
5. **Overlay Layer** - House icon, enhancements, maverick badge
6. **Text Layer** - Name, type, traits (rendered as crisp text, not image)
7. **Stats Layer** - Power, armor (large, readable numbers)
8. **Effect Layer** - Particles, glow, shimmer effects
9. **Token Layer** - Damage, amber, status tokens
10. **Interaction Layer** - Hover glow, selection highlight

### Rendering Strategy

#### Card Artwork
- Store high-res artwork (1024x1024 or larger)
- Use GPU mipmapping for crisp display at any size
- Support animated artwork (spritesheet or video texture)

#### Card Frame
- SVG-based frames for infinite scalability
- Per-house frame designs with metallic textures
- Normal maps for 3D lighting effects

#### Text Rendering
- Use HTML/CSS overlay for card name (always crisp)
- Or: SDF (Signed Distance Field) fonts in WebGL for sharp text at any scale

#### 3D Effects
- Parallax layers: background art, midground elements, foreground frame
- Mouse-tracking tilt (perspective transform)
- Dynamic lighting based on cursor position
- Subtle idle animation (floating, breathing)

### Premium/Golden Cards
- Animated particle emitters (sparkles, flames, energy)
- Animated artwork (subtle movement loops)
- Enhanced border glow/shimmer
- Custom shaders for metallic/holographic effects

## Technical Implementation

### Option A: PixiJS (Recommended)
- Lightweight 2D WebGL renderer
- Built-in particle system
- Filter/shader support
- Good React integration via @pixi/react

### Option B: Three.js
- Full 3D capabilities
- More complex but more powerful
- Better for true 3D card flips, etc.

### Option C: Hybrid
- PixiJS for card rendering
- CSS for UI overlays (text, menus)
- Best of both worlds

## File Structure
```
PremiumCard/
  PremiumCard.jsx          # Main component
  PremiumCard.scss         # Styles
  CardRenderer.js          # PixiJS rendering logic
  shaders/
    holographic.frag       # Golden card shader
    shimmer.frag           # Shimmer effect
  particles/
    sparkle.json           # Particle configs
  frames/
    brobnar.svg            # House frames
    dis.svg
    ...
```

## Performance Considerations
- Use sprite batching
- Pool/reuse particle emitters
- Lazy-load premium effects
- Fallback to simple rendering on low-end devices
- Use WebGL context sharing across cards

## Migration Path
1. Create PremiumCard component alongside existing Card
2. Add feature flag to switch between renderers
3. Gradually enhance with effects
4. Make premium effects opt-in via settings

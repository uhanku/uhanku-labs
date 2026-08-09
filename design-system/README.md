# Uhanku arcade design foundation

This folder documents the visual rules extracted from the existing `uhanku.com` site and adapted for a Next.js application.

## Design rules

1. **Dark grid canvas**
   - Base: `--arcade-bg`.
   - 32px grid on desktop, 24px on small screens.
   - Purple radial light adds depth without replacing the dark canvas.
   - Scanlines and vignette stay low opacity so content remains readable.

2. **Colour roles**
   - Acid (`--arcade-acid`): primary actions, active navigation and success emphasis.
   - Cyan (`--arcade-cyan`): information, technical labels, links and focus states.
   - Hot (`--arcade-hot`): editorial emphasis and high-energy calls to action.
   - Purple (`--arcade-purple`): ambient depth, panel light and structural accents.
   - Red and orange: danger and warning states only.

3. **Typography**
   - Geist is the readable UI and content face.
   - Press Start 2P is reserved for labels, status text, metadata and compact controls.
   - Large headings use heavy sans weight with tight negative tracking.
   - Do not use the pixel font for long body copy.

4. **Geometry**
   - Panels favour square corners and thin 1px boundaries.
   - Pixel shadows use hard offsets rather than soft card shadows.
   - Small controls can use minimal rounding when interaction clarity benefits from it.

5. **Motion**
   - Motion is short and signal-like: reveal, pulse, one-pixel lift and glow.
   - Avoid constant large movement.
   - Always preserve `prefers-reduced-motion` support.

6. **Responsive structure**
   - Wide layouts collapse around 1120px.
   - Dense component arrangements become single-column around 760px.
   - Labels may reduce to `--text-2xs` on compact screens.

## Recommended app structure

```text
src/
  app/                 # Next.js routes and route layouts
  components/
    arcade/            # Reusable visual primitives
  design-system/       # Design documentation
  styles/
    tokens.css         # Global design tokens
    foundation.css     # Reset, typography, page canvas
    effects.css        # Shared motion and decorative effects
```

Keep business or feature components outside `components/arcade`. The arcade folder should contain only reusable visual primitives.

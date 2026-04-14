# Design Brief

## Direction

Trading Terminal Refined — A professional crypto screener dashboard with brutalist precision and market-ready color signals for Indonesian traders using Indodax.

## Tone

Focused, no-nonsense, brutalist edge with high-contrast data visibility — every design decision serves data legibility and trading signal clarity.

## Differentiation

Color-coded price movements (green/red cell backgrounds) with teal-cyan accent for interactive elements, creating instant market signal recognition without decoration.

## Color Palette

| Token         | OKLCH         | Role                                   |
| ------------- | ------------- | -------------------------------------- |
| background    | 0.12 0 0      | Ultra-dark surface, main workspace     |
| foreground    | 0.93 0 0      | High-contrast white text               |
| card          | 0.16 0 0      | Elevated panel background              |
| primary       | 0.58 0.22 220 | Teal-cyan accent, interactive elements |
| destructive   | 0.55 0.22 25  | Warning red for price losses           |
| chart-1       | 0.65 0.22 145 | Success green for price gains          |
| border        | 0.24 0 0      | Sharp grid lines, table separators     |

## Typography

- Display: JetBrains Mono — code-like authority for headings, price tickers, data labels
- Body: Satoshi — approachable sans for UI labels, navigation, descriptions
- Scale: hero `text-2xl font-bold tracking-tight`, h2 `text-xl font-semibold`, label `text-sm font-semibold tracking-widest`, body `text-base`

## Elevation & Depth

No soft gradients or ambient shadows — elevated surfaces use sharp `shadow-elevated` with 0.3 opacity dark overlay, borders define zones, card backgrounds (0.16) sit 1 step above background (0.12).

## Structural Zones

| Zone    | Background       | Border               | Notes                            |
| ------- | ---------------- | -------------------- | -------------------------------- |
| Header  | card (0.16)      | border-b (0.24)      | App title, sync timestamp, left  |
| Sidebar | sidebar (0.16)   | sidebar-border (0.24) | Navigation, vertical stacked     |
| Content | background (0.12) | chart grid (0.24)    | Main table area, responsive      |
| Detail  | card (0.16)      | border (0.24)        | Charts, order book, trades panel |

## Spacing & Rhythm

Compact density with 0.25rem radius corners — sections gap 1.5rem, content groups 1rem, micro-spacing 0.5rem. No padding bloat, every pixel earns its place.

## Component Patterns

- Buttons: sharp corners, teal-cyan bg, high-contrast text, no shadow
- Cards: 0.25rem radius, 0.16 background, thin border-top accent (0.58 0.22 220)
- Tables: row alternation via `bg-opacity-5`, green/red cell backgrounds for price deltas, fixed headers
- Price badges: `.text-price-up` / `.text-price-down` utility classes, semibold font-weight

## Motion

- Entrance: table rows fade in 0.15s staggered
- Hover: button/row background shift 0.2s, no scale transform (precision over playfulness)
- Decorative: none

## Constraints

- Zero decoration — no gradients, no blur, no animations for atmospherics
- Sharp corners enforce precision; no rounded-full anywhere except badges
- Chart colors use --chart-1 through --chart-5 exclusively; no arbitrary colors
- All text uses OKLCH color tokens, no raw hex/rgb values

## Signature Detail

Monochrome brutalist foundation with surgical precision color coding (green=up, red=down, teal=action) — the interface disappears, only market signals remain.

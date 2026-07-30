# Repository Guidelines

## Project Overview

Jess Boubie Craft — a static product catalogue and brand storytelling site for handcrafted brass jewelry rooted in Dusun tradition. Two pages: a product catalogue (`index.html`) and a narrative reading experience (`story.html`). Zero frameworks, zero build step — raw HTML, CSS, and vanilla JavaScript deployed to Cloudflare Workers with Assets.

## Architecture & Data Flow

```
index.html ──┬── style.css      (shared custom properties, catalogue layout)
             └── script.js       (slider carousel, lightbox, feedback prompt)

story.html ──┬── style.css      (shared custom properties)
             ├── story.css      (3D book animation, reader preferences, page mode)
             ├── inline <head>  (applies localStorage-persisted state before paint)
             └── story.js       (book open/close, reader toggles, page-by-page mode)
```

- **No SPA routing** — each page loads independently with its own entry point.
- **No shared JS module** — `script.js` and `story.js` are independent, page-specific bundles.
- **State persistence**: `localStorage` (5 keys: `jbc-theme`, `jbc-story-chrome`, `jbc-story-zen`, `jbc-story-text`, `jbc-story-page`). On `story.html`, theme & reader preferences are applied by a blocking inline `<head>` script before CSS paints to prevent FOUC.
- **Analytics**: Umami Cloud (`cloud.umami.is`) loaded via deferred `<script>` tag.
- **CSS cascading**: `style.css` defines `:root` custom properties (colors, text sizing, slider config). `story.css` is additive — it imports after `style.css` and only defines story-page-specific styles.

## Key Directories

| Directory | Purpose |
|-----------|---------|
| `/` | All source files at root (no `src/` or `dist/`) |
| `images/` | 66 image files (product shots, gallery, raw photography) |
| `favicon/` | Full PWA favicon suite (`.ico`, `.png` 16/32/192/512, apple-touch-icon, `site.webmanifest`) |

## Development Commands

**No package manager, no build step, no `package.json`.**

| Task | Command |
|------|---------|
| Local dev | `npx wrangler dev` (serves static assets from project root) |
| Deploy | `npx wrangler deploy` |
| Quick serve | Any static file server: `python -m http.server`, `npx serve .` |

```jsonc
// wrangler.jsonc — key fields
{
  "name": "jess-boubie-craft",
  "compatibility_date": "2026-07-12",
  "assets": { "directory": "." },
  "compatibility_flags": ["nodejs_compat"]
}
```

## Code Conventions & Common Patterns

### HTML

- **Semantic HTML first**: `<nav>`, `<article>`, `<section>`, `<figure>`, `<figcaption>`, `<main>`, `<header>`, `<footer>` used throughout.
- **Accessibility**: `skip-link` for keyboard users, `aria-label` on all interactive controls, `role="dialog"` + `aria-modal="true"` on overlays (lightbox, feedback prompt), `aria-pressed` on toggle buttons.
- **Structured data**: JSON-LD `LocalBusiness` schema in `<head>`.
- **Image convention**: Every `<img>` uses `loading="lazy"`, explicit `width`/`height`, and class `lightbox-trigger` (except the story book cover image).

### CSS

- **Style organization**: Numbered sections with `/* ==== */` delimiters and descriptive comments explaining *why*, not just what.
- **Custom properties**: All colors, sizing, and layout knobs in `:root`:

```css
:root {
  --color-bg:         #faf7f2;
  --color-text:       #3b3329;
  --color-primary:    #3d2e22;
  --color-accent:     #c9a87c;
  --cards-per-view:   3;
  --card-gap:         1.25rem;
  --text-base:        1.0625rem;
  --text-sm:          0.9375rem;
  --text-lg:          1.25rem;
  --text-xl:          2rem;
}
```

- **Responsive breakpoints**: `700px` (mobile — single column, collapsed header), `1000px` (tablet — 2 cards per view), `480px` (feedback prompt full-width), `360px` (tiny story screens).
- **Reduced motion**: `@media (prefers-reduced-motion: reduce)` disables slider transitions, smooth scroll, and book 3D animation.
- **Touch fallback**: `@media (hover: none) and (pointer: coarse)` disables parallax `background-attachment: fixed` and forces gallery captions always visible.
- **No dark mode on index.html** — only on `story.html` via `html.dark-mode` class with `:root` variable overrides.

### JavaScript

- **All code wrapped in `DOMContentLoaded`** — no inline handlers, no global IIFE pollution.
- **Event delegation pattern**: Click handlers on body use `e.target.closest()` to match selectors.
- **CSS Custom Property reading**: Slider reads `--cards-per-view` at runtime via `getComputedStyle()` to adapt to responsive breakpoints without JS breakpoint duplication.
- **`inert` attribute pattern**: Lightbox sets `inert` on every `<body>` child except itself while open — accessible focus trapping.
- **`localStorage` pattern**: 

```js
// Check before setting, remove class when absent
const dismissed = localStorage.getItem(STORAGE_KEY);
if (dismissed) return;
```

- **Slider implementation**: `initSlider(wrapperEl)` — page-based movement jumping by `cardsPerView`, dot indicators track page boundaries, debounced `resize` rebuilds.
- **Feedback prompt**: 2-minute `setInterval` countdown, paused via `visibilitychange`, dismissed state persisted to `localStorage`.

### Story Page JS (story.js)

- **5 reader preferences** each with: `apply*State()` (called on load + toggle), `toggle*()` (user action), localStorage read/write.
- **Book animation**: CSS-only 3D transition (`rotateY(-180deg)` + opacity). JS only toggles `.is-open` + `.book-open` classes and manages focus/aria.
- **Page-by-page mode**: JS measures `clientWidth` as column width, calculates pages from `scrollWidth/width`, uses `translateX` for horizontal flipping. Touch swipe (50px threshold, 0.3× overscroll resistance), click zones (left/right third), arrow keys, nav buttons. Resize triggers 200ms debounced re-measure; zen/text-size triggers 80ms re-measure.
- **Mobile header collapse**: `rAF`-throttled scroll handler, collapses at 60px, only on `≤700px`.
- **Settings panel**: Gear button opens popover; Escape + outside click dismiss; `[hidden]` attribute toggled.

### Naming Conventions

- **CSS classes**: BEM-ish — `.product-card`, `.gallery-item--tall`, `.book-cover__title`.
- **JS functions**: camelCase, verb-first (`initSlider`, `closeLightbox`, `togglePageMode`).
- **Constants**: `SCREAMING_SNAKE_CASE` (`FEEDBACK_FORM_URL`, `HEADER_COLLAPSE_AT`).
- **CSS files**: `style.css` (shared), `story.css` (page-specific).
- **JS files**: `script.js` (index), `story.js` (story page).
- **Image files**: `{category}_{descriptor}.jpg` for products, `JBC_{person/context}.jpg` for raw photography.

## Important Files

| File | Role |
|------|------|
| `index.html` | Main catalogue entry point (~393 lines) |
| `script.js` | Catalogue interactivity: slider, lightbox, feedback prompt (~265 lines) |
| `style.css` | Shared styles + catalogue-specific layout (~901 lines) |
| `story.html` | Narrative reading experience (~894 lines) |
| `story.js` | Book animation, reader preferences, page mode (~565 lines) |
| `story.css` | Story page styles: 3D book, reader prefs, dark mode (~1218 lines) |
| `wrangler.jsonc` | Cloudflare Workers deployment config |
| `images/` | All product + gallery + raw photography assets (66 files) |
| `favicon/site.webmanifest` | PWA manifest for Add to Home Screen |

## Runtime/Tooling Preferences

- **Runtime**: Cloudflare Workers (`nodejs_compat` flag enabled). Static assets served from project root.
- **Package manager**: None — no `package.json`, no `node_modules`.
- **Fonts**: Google Fonts — Cormorant Garamond (400, 600, 700, italic 400) with `display=swap`.
- **CSS reset**: Minimal universal `*` reset (`box-sizing: border-box`, `margin: 0`, `padding: 0`).
- **External deps**: Only Google Fonts (fonts.googleapis.com) and Umami analytics (cloud.umami.is). No CDN libraries, no npm packages.

## Testing & QA

- **No test framework** — this is a static marketing site.
- **Verification**: Manual visual check across breakpoints. Run locally with `npx wrangler dev` or a static server.
- **Known issues**:
  - Two placeholder ring images (`ring_placeholder2.jpg`, `ring_placeholder3.jpg`) are referenced in HTML but missing from disk — they appear as broken images but are commented out.
  - ~45 of 66 images in `images/` are unreferenced raw photography assets.
  - `JBC_logo.webp` exists but is unused (site uses `JBC_logo.jpg`).
  - `JBC_logo2.png` is a 439KB unused alternate logo.

## Product Catalogue Structure

The catalogue (`index.html#catalogue`) has 3 categories, each a self-contained slider:

```
section#catalogue > div.container
  p.sizing-note
  div.category > h2 + div.slider-wrapper > div.slider
    button.slider-btn.slider-prev
    div.slider-viewport > div.product-grid
      article.product-card  (×N)
    button.slider-btn.slider-next
    div.dots
```

- **Bracelets**: 4 product cards (Dumaring, Liningkong, Wave, Aries Cuff)
- **Rings**: 1 product card (Kinabalu Crest) + 2 commented-out placeholders
- **By Theme**: 3 product cards (Borneon Motif Cuff, Murutku, Tobulugu)
- **Gallery**: 2 mosaic subsections — Design Variations (5 figures), Featured Wearers (3 figures)
- **About**: Story block + contact card with WhatsApp and Instagram links

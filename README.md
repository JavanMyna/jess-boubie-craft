# Jess Boubie Craft

Handcrafted brass jewelry rooted in Dusun and Murut tradition. A static site
showcasing Jess Boubie Craft's work, alongside a separate reading experience
for the artisan's story.

**Status:** 🚧 Work in progress — early access.

## About

Jess Boubie Craft makes hand-hammered brass jewelry drawing on Dusun Liwan,
Dusun Tobilung, and Murut motifs. Every piece is made slowly, by hand — no
mass production, no rush orders.

## Live site

Deployed as a static site on Cloudflare Workers (see `wrangler.jsonc`).
- URL: https://jess-boubie-craft.mynko.workers.dev/

## Features

### Catalogue site (`index.html`)
<img width="1366" height="635" alt="image" src="https://github.com/user-attachments/assets/14251fd3-7ba0-42b6-af20-cf7dbc0640fa" />
- Product catalogue with lightbox image preview
- Photo gallery
- "Our History & Contact" section
- Feedback prompt widget, linked to a Google Form
- Umami analytics

### Read Her Story (`story.html`)
<img width="1366" height="635" alt="image" src="https://github.com/user-attachments/assets/4a92ce41-1449-492c-915b-5656d07d2d2c" />
A separate reading experience for the artisan's autobiography, styled as an
interactive book:
- 3D book open/close animation
- Dark / light mode
- Zen reading mode (serif type, wider margins, softer rhythm)
- Adjustable text size (S / M / L)
- Chrome (header/footer) hide toggle, and a "Comfy" preset combining zen +
  hidden chrome
- Page-by-page swipe reading mode — see **Known issues**
- All reading preferences persist across visits via `localStorage`

## Known issues / TODO

- **Page-by-page swipe mode is currently broken.** Being reworked. Scroll
  mode is unaffected and works normally.
- The feedback link on `story.html` still points to a placeholder
  (`FEEDBACK_FORM_URL` in `story.js`) and needs the real Google Form URL —
  `script.js` (main site) already has the real one, `story.js` doesn't yet.
- No automated tests; changes are checked manually across screen sizes.

## Tech stack

- Vanilla HTML / CSS / JS — no framework, no build step
- Deployed as static assets via Cloudflare Workers (`wrangler.jsonc`)
- Fonts: Google Fonts (Cormorant Garamond)
- Analytics: Umami

## Project structure

```
.
├── index.html        # Main catalogue site
├── script.js          # Catalogue interactions (lightbox, feedback prompt, etc.)
├── style.css           # Main site styles
├── story.html            # "Read Her Story" reading experience
├── story.js                # Story page interactions
├── story.css                 # Story page styles
├── images/                     # Product & site photography
├── favicon/                       # Favicon set
├── wrangler.jsonc                    # Cloudflare Workers deployment config
└── LICENSE
```

## Running locally

No build step required.

- Open `index.html` directly in a browser, or
- Serve the folder with any static server, e.g.:
  ```bash
  npx serve .
  ```
- To preview with the same setup as production (Cloudflare Workers):
  ```bash
  npx wrangler dev
  ```

## Development notes

Built and maintained by [JavanMyna](https://github.com/JavanMyna), with AI
tools used throughout planning and implementation.

## License

MIT — see [LICENSE](./LICENSE).

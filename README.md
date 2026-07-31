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

Deployed as a static site
- URL: https://jessboubiecraft.com

## Features

### Catalogue site (`index.html`)
<img width="1366" height="635" alt="image" src="https://github.com/user-attachments/assets/14251fd3-7ba0-42b6-af20-cf7dbc0640fa" />
- Product catalogue with lightbox image preview
- "View all designs" panel per category — opens a grid of every product image
  in that category without affecting the carousel
- Photo gallery with mosaic layout
- "Our History & Contact" section
- Feedback prompt widget (engagement-triggered via IntersectionObserver)
- Umami analytics

### Read Her Story (`story.html`) — temporarily disabled
<img width="1366" height="635" alt="image" src="https://github.com/user-attachments/assets/4a92ce41-1449-492c-915b-5656d07d2d2c" />
A separate reading experience for the artisan's autobiography, styled as an
interactive book. Currently disabled (nav link commented out in `index.html`)
while the page-by-page swipe mode is being reworked:
- 3D book open/close animation
- Dark / light mode
- Zen reading mode (serif type, wider margins, softer rhythm)
- Adjustable text size (S / M / L)
- Chrome (header/footer) hide toggle, and a "Comfy" preset
- All reading preferences persist across visits via `localStorage`

## Known issues / TODO

- **Story page temporarily disabled.** The nav link in `index.html` is
  commented out. Page-by-page swipe mode on `story.html` is being reworked;
  scroll mode is unaffected.
- The feedback link on `story.html` still points to a placeholder
  (`FEEDBACK_FORM_URL` in `story.js`) and needs the real Google Form URL.
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
├── script.js          # Catalogue interactions (lightbox, panels, feedback)
├── style.css           # Main site styles
├── story.html            # "Read Her Story" reading experience (disabled)
├── story.js                # Story page interactions
├── story.css                 # Story page styles
├── images/                     # Product & site photography
├── favicon/                       # Favicon set
├── tools/                           # Utility scripts
│   └── audit_exif.py                 # EXIF/GPS scanner for image privacy
├── docs/                               # Planning & briefs
├── wrangler.jsonc                        # Cloudflare Workers deployment config
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

MIT applies to source code only. All images, logos, photography, and written
content in this repository are proprietary — copyright Jess Boubie Craft.
See [LICENSE](./LICENSE).

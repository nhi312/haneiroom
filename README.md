# HaneiRoom landing page

A scroll-driven story in three chapters, drawn in cut paper: the mess, the process, and what changed between our first mobile app and the web app. Static HTML, CSS and vanilla JS, no build step and no animation library.

## Run it

```bash
python3 -m http.server 4173
```

Then open http://localhost:4173. (`.claude/launch.json` has the same command as "landing".)

## Files

- `index.html`: every scene, in story order. All copy lives here.
- `assets/css/landing.css`: layouts, the cut-paper drawing states, the recreated app screens and the responsive rules. Builds on `design-system/tokens.css`.
- `assets/js/landing.js`: scroll progress for each chapter, the dashed trail, and the frame that turns from the phone into the desktop.
- `assets/js/config.js`: **the page's main link.** `cta` sets every "Explore HaneiRoom" button. It points at the process chapter until you add the real app or waitlist URL.
- `assets/img/`: furniture product photos and the v1 product screen.
- `tools/build-art.py`: draws every illustration (box, glove, tape measure, the frame ornaments and the rest) and writes the SVGs into `index.html` between `<!-- art:NAME -->` markers. Edit shapes there, then run `python3 tools/build-art.py`.

## The illustration style

Flat cut paper in the design-system palette, with a pencil layer in `doodle-ink` (navy-300). Every piece is built from plain shapes whose edges are nudged and smoothed, so it reads as hand cut. Pieces start as pencil outlines and the paper goes on as they come into the story. The page uses the real product photos, the Hanei stickers (swatches, heart, WooHoo), the doodle swoosh and room floor, and the app's own card, chip and button styles.

## How the motion works

- **01 The mess:** on load, each object is outlined in pencil, then painted. On large screens (1024×620 and up) the scene is pinned: scrolling spreads the mess out and sketches a floor plan, with measurements and a note, around the chair.
- **02 The process:** a dashed trail draws itself as you scroll and runs through four stops. Each stop stays a pencil sketch until the trail reaches it, then fills in: tags, color, the app's cards, and in stop 2 the furniture moves into place.
- **03 What changed:** the letters of "around" settle into place. On large screens the v1 phone sits in a gilt frame, then steps out to the side while the frame widens around the web app. Smaller screens stack the phone and the desktop instead. A plain table lists what changed.
- Pinned scenes are tall sections with a `position: sticky` stage, so scrolling stays native.
- With `prefers-reduced-motion`, or without JavaScript, every scene shows its finished state.

## Still open

- **Main link:** `config.js` still points the "Explore HaneiRoom" buttons at this page. Add the app or waitlist URL.
- **Font license:** `design-system/fonts/` holds the free Befonts release of Trovical Calm, licensed for personal use only. Buy a commercial web license before publishing. The free files draw the period as a watermark (left out of the font in `tokens.css`) and fuse "oo" through ligatures and contextual alternates, which `landing.css` turns off on every title.
- **Real app screens:** the desktop app and the product cards are HTML recreations built from the Desktop UI patterns in the design system, with sample project names. Swap in exports from the Figma file when available.

# HaneiRoom landing page

A scroll-driven story page: the workshop, the first idea, the archived AR version, the real problem, the product, and the finished workflow. Static HTML, CSS and vanilla JS, no build step and no animation library.

## Run it

```bash
python3 -m http.server 4173
```

Then open http://localhost:4173. (`.claude/launch.json` has the same command as "landing".)

## Files

- `index.html`: every scene, in story order. All copy lives here.
- `assets/css/landing.css`: the workshop textures, layouts, app-screen recreation and responsive rules. Builds on `design-system/tokens.css`.
- `assets/js/landing.js`: scroll progress, stroke-by-stroke sketch drawing, note sorting, tab sync, the demo board and its CSV export.
- `assets/js/config.js`: **the page's outside links.** `cta` (Explore HaneiRoom, the waitlist), `contact` (the hero's Connect With Us) and `appStore` (Chapter 2's App Store button). Each one points at a section of this page until you add the real URL.
- `assets/img/`: furniture product photos (from the Hanei folder's Amazon thumbnails, including the cut-out pink armchair in the hero), the v1 AR product screen, the wood texture, and `garage/`: the flat cut-paper shelf and side walls drawn for the hero. The page fades them to about 50% so the title leads.
- `tools/build-sketches.py`: generates the hand-drawn SVG sketches and writes them into `index.html` between `<!-- sketch:NAME -->` markers. Edit shapes there, then run `python3 tools/build-sketches.py`.

## How the motion works

- Pinned scenes are tall sections with a `position: sticky` stage, so scrolling stays native and nothing traps the visitor.
- Large screens (1024px wide and 640px tall or more) pin every story scene. Smaller screens and frames get one-screen sticky frames for chapters 1–3 instead: a progress bar with the current step over the drawing, and the archive box sequence. The hero also holds on small screens so its walls open into chapter 1.
- Chapter 3 is a chat with Hanei that plays itself while it is on screen, with typing dots before each of Hanei's replies. It holds the finished conversation for a few seconds, then loops. Your answers are drawn as Hanei's own inputs (chips, swatches, split rows, upload tiles). Without motion, the whole conversation shows at once. The hero and product chapters stack normally there.
- Chapter 5 cycles through five furniture pieces every 2.6 seconds while it is on screen, with a Pause button. It stays on the first piece under reduced motion.
- With `prefers-reduced-motion`, or without JavaScript, every scene shows its finished state.

## Still open

- **Font license:** `design-system/fonts/` holds the free Befonts release of Trovical Calm, licensed for personal use only. Buy a commercial web license before publishing. The free files draw the period as a watermark, so `tokens.css` leaves U+002E out of the font; remove that `unicode-range` once you have the licensed files.
- **Real v2 app screens:** the app screens on the page are HTML recreations of the documented flow. Swap in exports from the Figma file when available.
- **Prices:** product cards show no prices because there is no price data yet.
- **Hanei mascot:** no 3D mascot file exists in the project yet.

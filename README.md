# HaneiRoom landing page

A scroll-driven story drawn in cut paper: a room's vibe is never just one piece, so HaneiRoom lets you see every piece in your space (on your phone, with AR), and HaneiAI turns an interior designer's inputs into furniture matches to explore, compare and choose (on the web). Then the two products side by side, a closing line, a demo sign-up and the quilt footer. Static HTML, CSS and vanilla JS, no build step and no animation library.

## Run it

```bash
python3 -m http.server 4173
```

Then open http://localhost:4173. (`.claude/launch.json` has the same command as "landing".)

## Files

- `index.html`: every scene, in story order. All copy lives here.
- `assets/css/landing.css`: layouts, the hero and its tape, the app recreations, the demo box, the footer and the responsive rules. Builds on `design-system/tokens.css`.
- `assets/js/landing.js`: the tape's centimetre marks, scroll progress for the AR scan, the hand-off to HaneiAI and the closing row, the HaneiAI anchor, and the demo form.
- `assets/js/reels.js`: the three HaneiAI screens. Each screen's markup is its finished frame; this loops a cursor demo on it while landing.js marks it live.
- `assets/js/config.js`: **the page's outside hooks.** `demoForm.action` is where the "Book a demo" form posts the email. `cta` sets the link of any element marked `data-cta`; none use it right now, since the nav button goes straight to the demo form.
- `assets/img/`: `furniture/` holds the cut-outs the phone demo places (from the 15-piece Hanei furniture set; the bed is left out), `room-corner.webp` is the room it scans, with a bare wall (cropped to 3:2 around the corner). `framed-art-print-wall.webp` is the painting cut from the same shot with it hanging, so it lands back in exactly its spot; `framed-art-print.webp` is it straightened for the tray and shop card, `products/` the hero stickers and the furniture photos in the closing row and the HaneiAI screens, and `quilt.svg` the footer band. The `furniture/` cut-outs were made by lifting the baked-in checkerboard and grey shadow, flood-filling from the edges. The `-lit` copies of the chair, lounge chair and side table are the ones placed in the room: warmed to the room's light (gains matched to the mock), slightly softer, and lit from the cove light's side; the tray and shop card keep the product colors.
- `terms.html`, `privacy.html` and `assets/css/legal.css`: the Terms of Service and Privacy Policy, linked from the footer bar and under the demo form. Contact for both is info.haneiroom@gmail.com.
- `tools/build-art.py`: draws every illustration (the furniture, the frame, the AR room, the demo backdrop, the quilt band) and writes them into `index.html` between `<!-- art:NAME -->` markers. Edit shapes there, then run `python3 tools/build-art.py`.

## How the motion works

- **01 Hero:** "A room's vibe is never just one piece." on a linen band (`img/linen.webp`, a seamless tile of the weave with its folds flattened, at half opacity over cream), with four pieces stuck round it as white die-cut stickers (`products/*-sticker.webp`: the curved sofa, the pleated lamp, the bird-leg table, the monstera), large and running off the edges on bigger screens, smaller on phones, all kept clear of the text and the nav (the plant hangs under the step cards), and two buttons. A yellow measuring tape swoops over the band's edge with a loop and unrolls on load; phones get their own, tighter curl. landing.js marks each tape's centimetres. The step cards sit over the tape so it never crosses their words. A spinning stamp sits where it crosses. Below, Hanei's three steps (scan, mix every piece, choose what fits), each with the flower doing it.
- **02 HaneiRoom, then HaneiAI:** the section opens on "See how every piece fits your space." with a few round stickers, then the mobile demo fills the screen: HaneiRoom scans the corner of a lived-in bedroom, finds and measures the floor, picks three pieces from a tray (the bouclé accent chair, the olive ceramic side table and a framed art print), places the chair and table in the corner, hangs the print on the bare wall above them, swaps the chair for the olive lounge chair and back, then opens one shop card with the total. The camera view shrinks into a phone with a real bezel beside a pitch card and its App Store button. "Love what you see? There's more for interior design." takes the pitch's place, and the phone grows into HaneiAI's desktop window, which fills with three screens (log the inputs, let AI match, explore, compare, choose) under "Designed for the way interior designers work." Each screen loops its own cursor demo while it sits in place. On large screens they sit in a row with captions; smaller screens stack them in the window.
- **Two products, one room:** a speech bubble for each product slides in from its side: HaneiRoom with its App Store button, HaneiAI with a "Try HaneiAI" button to tryhanei.app.
- **Closing:** one chair, then the rest of the room slides in beside it, over the closing line.
- **Book a demo:** rows of real HaneiAI features slide as you scroll.
- Buttons, pills, product cards and frames use one iPhone-style liquid glass recipe (the `--lg-*` variables in `landing.css`).
- Pinned scenes are tall sections with a `position: sticky` stage, so scrolling stays native.
- With `prefers-reduced-motion`, or without JavaScript, every scene shows its finished state.

## Still open

- **Demo form:** `config.js` has no `demoForm.action` yet, so the form checks the email and says it isn't connected. Add a form endpoint to send real sign-ups.
- **Font license:** `design-system/fonts/` holds Instrument Serif, the title face, under the SIL Open Font License 1.1 (`fonts/LICENSE-instrument-serif-OFL.txt`). It is free to use on the web.
- **App screens:** the three HaneiAI screens and the product cards are HTML recreations of the MVP 2.0 Figma screens, with sample clients, vendors and prices.

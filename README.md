# HaneiRoom landing page

A scroll-driven story in three chapters, drawn in cut paper: the mess getting cleaned up, the process as torn color bands, and two products side by side: HaneiRoom on your phone (AR) and Hanei on the web. Then a demo sign-up and the quilt footer. Static HTML, CSS and vanilla JS, no build step and no animation library.

## Run it

```bash
python3 -m http.server 4173
```

Then open http://localhost:4173. (`.claude/launch.json` has the same command as "landing".)

## Files

- `index.html`: every scene, in story order. All copy lives here.
- `assets/css/landing.css`: layouts, torn paper, the cut-paper drawing states, the app recreations, the demo box, the footer and the responsive rules. Builds on `design-system/tokens.css`.
- `assets/js/landing.js`: scroll progress for every scene, the dashed trail, the torn edges, the v1 scan and app demos, and the demo form.
- `assets/js/config.js`: **the page's outside hooks.** `demoForm.action` is where the "Book a demo" form posts the email. `cta` sets the link of any element marked `data-cta`; none use it right now, since the nav button goes straight to the demo form.
- `assets/img/`: furniture product photos, the v1 product screen, and `quilt.svg` for the footer band.
- `tools/build-art.py`: draws every illustration (the tools, the plan, the furniture, the frame, the AR room, the demo backdrop, the quilt band) and writes them into `index.html` between `<!-- art:NAME -->` markers. Edit shapes there, then run `python3 tools/build-art.py`.

## How the motion works

- **01 The mess:** on load, each tool is outlined in pencil, then painted. Scrolling (pinned on every screen size) piles on the confusion: other chairs, notes, question marks, extra dimensions. Then the tools and the confusion fly out together and the title changes to "Hanei helps you clean it up." The same pile comes back sorted: six framed cards on a paper collage (the plan with its 4.2 m and 3.8 m measurements, the brief, the palette, and the seating, lighting and storage picks). The measurements stay on top the whole time.
- **02 The process:** each step is its own color band with a curvy torn top edge and paper grain, with the step's tools filling the side the text leaves empty. The step number is printed on a strip stuck across the tear. A dashed trail draws itself as you scroll and runs through the numbers; each band stays a pencil sketch until the trail reaches it.
- **03 What changed:** HaneiRoom (the AR phone app) and Hanei (the web app) are two separate products for two jobs, not versions. The letters of "around" settle in close together, then keep a gentle wiggle. On large screens the title and a caption naming the product on screen stay pinned above a glass frame: the phone plays the HaneiRoom AR demo, then the frame widens around Hanei on the web, built on the design system's SidebarNav and ProjectCard (Inter throughout), where a cursor makes a new project. A Venn diagram below shows what each product does and where they meet. Smaller screens stack the phone and the desktop and play each demo as it crosses the screen.
- **Book a demo:** rows of real Hanei features slide as you scroll; two sticky notes wiggle every few seconds.
- Buttons, pills, product cards and frames use one iPhone-style liquid glass recipe (the `--lg-*` variables in `landing.css`).
- Pinned scenes are tall sections with a `position: sticky` stage, so scrolling stays native.
- With `prefers-reduced-motion`, or without JavaScript, every scene shows its finished state.

## Still open

- **Demo form:** `config.js` has no `demoForm.action` yet, so the form checks the email and says it isn't connected. Add a form endpoint to send real sign-ups.
- **Font license:** `design-system/fonts/` holds the free Befonts release of Trovical Calm, licensed for personal use only. Buy a commercial web license before publishing. The free files draw the period as a watermark (left out of the font in `tokens.css`) and fuse "oo" through ligatures and contextual alternates, which `landing.css` turns off on every title.
- **App screens:** the desktop app and product cards are HTML recreations built from the design system, with sample project names. The AR demo is being rebuilt in a separate session on a photo-real empty room.

# HaneiRoom design system

Open `index.html` for a visual overview. `tokens.css` holds every color, type style, spacing, radius, shadow and the glass button classes (`.btn`, `.btn--warm`, `.glass`); the folders hold the logo, doodles, product photos, icons, stickers and textures; `components/` has live HTML previews, including the HeroScene recipe.

HaneiRoom is an AI assistant for interior designers: capture a client brief, let Hanei check it, get real furniture to save or export. The brand is warm, optimistic and a little playful. A serious tool is softened by round shapes, soft gradients and casual copy. Use this system for the marketing landing page and keep it consistent with the mobile app.

## Logo

- The logo is the **HaneiAi** wordmark: "Hanei" in `logo-navy`, "Ai" in `logo-orange`, set in Trovical Calm, with a navy hard hat resting on the A. Use the files in the Logo group; never retype or redraw it.
- Use `haneiai-logo-transparent.png` on white and light grounds: `bg-page`, `surface-tint`, peach-100, gradient-warm, gradient-cool. Use `haneiai-logo-on-white.png` where a solid white tile is wanted.
- Never place it on navy, orange, photos or busy patterns: the navy letters and the hat's white stripes need a light ground. There is no reversed (white) version yet.
- Keep the hat and wordmark together. Don't recolor, stretch, outline, rotate or add effects.
- Size: 140 to 160px wide in the desktop nav and footer, 120px minimum. Clear space on every side equals the hat's height.

## Content fundamentals

- **Voice:** first person and friendly. Hanei speaks as a helper: "Hey, Nhi, it's Hanei here", "Let Hanei analyse it for you", "WooHoo! All done".
- **Address the designer as "you"** and their customer as "your client". Never "the user".
- **Headlines are short and in Title Case**, two lines at most: "Design Your Dream Space", "Your Vibe In Your Room".
- **One highlighted word per headline**, usually *Hanei*, set in `text-highlight` (orange-500) at 40px and up.
- **Body copy is sentence case**, plain and specific: "Choose exactly five adjectives and a palette of one to five colors."
- **Emoji:** none in running copy. Use the Stickers group for warmth instead.
- **Spelling to keep right:** "It's Hanei", "Color Palette", "Villa".

## Color

- Set headlines in `text-heading` (navy-700). On a two-line hero headline, set line 2 in `text-accent` (rust-600).
- Set body copy in `text-primary` (ink-900) and helper text in `text-muted` (grey-600), on `bg-page`, `surface-card` or `surface-tint`.
- The main CTA is `action-primary`: a gradient from orange-300 to orange-500 with its label in `on-action-primary` (brown-900). Never put white text on orange.
- Use `action-secondary` (navy-700 with white text) for Next, Ask AI and secondary actions.
- Page grounds come from the Textures group: gradient-warm for the hero and the final call to action, gradient-cool for feature sections, gradient-navy-glow for the footer or one dark band.
- Success is green-500 with ink-900 text plus the check-circle icon. Errors use red-100 with red-700 text plus the alert icon. Never rely on color alone.
- Focus: a 2px solid `focus-ring` (navy-700) at a 2px offset on every interactive element.

## Typography

- Set every title in Instrument Serif: `display` for the hero, `h1` for the final call to action, `h2` for section titles.
- Set titles in `text-heading` (navy-700); a two-line title takes `text-accent` (rust-600) on line 2.
- Set card and step titles in `h3` (Inter bold). Instrument Serif is for large titles only, never body text, buttons, navigation or anything under 24px.
- Set all other text in Inter (`body-lg`, `body`, `label`, `small`, `caption`).
- Instrument Serif loads from `fonts/` under the SIL Open Font License 1.1 (see `fonts/LICENSE-instrument-serif-OFL.txt`). It has one weight (plus an italic). Never bold a title: the browser would fake the bold and the thin, tall letters turn short and heavy.
- Every style lists its mobile size in its usage note. Switch at 768px.

## Layout, radius and depth

- 12 columns inside a 1200px container on desktop (24px gutter), 8 columns on tablet (32px margin), 4 columns on mobile (16px margin).
- Spacing comes only from the `space-*` steps. Sections sit `space-24` apart on desktop and `space-16` on mobile.
- Every button, badge and search field is `radius-pill`. Cards use `radius-lg`; product cards and phone mockups `radius-xl`.
- Depth is soft: `shadow-md` on cards and buttons, `shadow-lg` on floating product cards. Glass panels are `surface-card` at 70 to 90% with a 20px background blur and a 1px white inner stroke.
- Product cards tilt between −8° and 8° and overlap, as on Splash Screen 1.

## The Hanei style: line + photo + glass

Every Hanei visual mixes three layers. Keep all three in a scene; drop one and it stops looking like Hanei.

1. **Hand-drawn line doodles** from the Doodles group, in `doodle-ink` (navy-300) at 6px with round caps. They sketch the room around the product: a floor with an orange-300 rug, squiggles, stars, speed lines, a plant, a table, a window. Always behind the photo and cards, never over a face of the product.
2. **One real product photo**, cut out on a transparent background (Products group), standing on the room-floor doodle with a soft drop shadow. Real photos only: no illustrated or 3D furniture in a hero.
3. **Glass and stickers on top**: glass cards (project, brief, pre-check) tilted −4° to 4°, glass buttons, and at most two stickers tucked on card corners.

- Ground: `cream-50` with the paper texture. Glass needs this texture or a gradient behind it to read as glass.
- Underline one title word with the swoosh doodle. Handwritten notes go in the `note` style (Caveat), one per section.
- The HeroScene component shows the full recipe.

## Glass

- Glass surfaces are `glass-white` (or `glass-orange` for the warm primary button) with a 1px `glass-edge` border, `shadow-glass`, and `backdrop-filter: blur(var(--blur-glass)) saturate(1.4)`.
- Every button is a glass pill (see the Button component). The one main action per view uses warm glass with a brown-900 label; everything else uses clear glass with a navy-700 label; the selected state is solid navy-700 with white.
- Labels and card text keep at least 4.5:1: navy-700 and ink-900 on clear glass, brown-900 on warm glass, red-700 on the pre-check card.

## Desktop app patterns

These come from the app's Desktop UI (1512px frames). Reuse them in landing-page product shots and anything that should feel like the app.

- **Ground:** a soft gradient from navy-300 at the left edge to lavender-200 on the right.
- **Shell:** a 240px left sidebar and one large frosted-glass content panel (`surface-card` at about 70%, `radius-lg`, 16px inset from the window edge).
- **Sidebar:** a profile chip (avatar, username, role, chevron), then Home, My Projects and My Inbox as icon-plus-label rows. The active row gets a warm orange glow fading to transparent. A "We Want Your Thoughts!" survey card sits below, and Setting at the bottom.
- **Page header:** small date and time chips, then a two-line title ("Good Afternoon, Nhi / How can I help you today?") and a row of pill buttons (New Project, Ask AI).
- **Two-tone section titles:** one word in brown-900, the rest in `orange-500` ("My **Recent Projects**").
- **Buttons:** every button is a glass pill (see Glass). Selected or active turns it `navy-700` with white text. Round arrow and menu buttons turn `rust-700` when open.
- **Chips:** furniture-type chips rest light grey and turn `navy-700` with white text when picked. A counter chip shows progress ("0/10 Picked").
- **Project card:** white, `radius-lg`, `shadow-md`. Title in bold, client in `text-muted`, created date, Draft or Done status at the right, four palette swatches, and a round arrow button.
- **Empty state:** a dotted-grid panel with one prompt line and a New Project button.
- **Forms:** navy bold labels with a muted hint ("Exactly 5", "Optional"), grey-300 input fills, a red-700 Remove link, white category rows with a percentage pill and arrow, and a dashed upload dropzone.

## Iconography

- Use the Icons group: 24px outline icons on a 24px grid, 1.75px stroke, round caps and joins, drawn in navy-700.
- Show them at 24px (20px minimum, 32px maximum). Pair an icon with a text label except for back, close and search.
- The SVGs are single ink in navy-700 and are shown through `<img>`, so they can't inherit color. For another color, inline the SVG and change its `stroke`.
- Don't mix in filled or duotone icons, and don't use emoji as icons.

## Stickers

- The Stickers group is the brand's emoji: flat fills in brand colors, a brown-900 outline and a white die-cut edge.
- Use at most two per section, at 64 to 160px, tilted up to 12°, tucked against a card or headline corner.
- They mark moments of delight (a finished project, a new feature, an empty state). Keep them out of forms, tables and navigation.

## Textures

- Gradients are full-bleed backgrounds; scale them with `background-size: cover`.
- Lay grain over a gradient at 40 to 60% opacity with `mix-blend-mode: multiply` to keep it from looking flat. Paper is the quieter alternative for text-heavy sections.
- Tile palm-pattern-tile at 240px behind feature or testimonial cards, never behind long paragraphs.
- Place palm-shadow at a section corner at 400 to 800px, cropped by the edge, as if light fell through a palm.
- Use one pattern per section at most.

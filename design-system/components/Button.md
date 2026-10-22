# Button
Frosted-glass pill button, the HaneiRoom button everywhere on the landing page and in the app: warm glass for the main action, clear glass for the rest.

- Consumer provides: the label, an optional leading or trailing icon, and `href` or `onClick`.
- Every button: `radius-pill`, 48px tall (56px for `--lg`), label style `label`, a 1px `glass-edge` border, `shadow-glass`, and `backdrop-filter: blur(var(--blur-glass)) saturate(1.4)`.
- **Warm glass** (`btn--warm`): `glass-orange` fill with a brown-900 label. One per view: Explore HaneiRoom, Get started. Hover fills solid `orange-500`.
- **Clear glass** (default): `glass-white` fill with a navy-700 label. Hover goes to white at 80%.
- **Selected**: solid `navy-700` with a white label (Ask AI picked, active tab).
- **Icon button** (`btn--icon`): 48×48 clear glass with a 20px icon from the Icons group.
- Glass needs something behind it to blur: put buttons over textures, gradients or doodles, never on flat white. Over a busy photo, raise the fill to 80%.
- Focus: 2px `focus-ring` at a 2px offset. Don't put white text on orange glass (fails contrast).

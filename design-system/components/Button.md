# Button
Pill button with two states, as in the HaneiRoom desktop app: frosted glass at rest, navy-700 on hover or when active.

- Consumer provides: the label, an optional leading icon, and `onClick`.
- Variants: glass (default), navy (primary and active), orange (New Project hover), round icon button (glass, or rust-700 when open).
- Label on orange-500 is brown-900; the app's white-on-orange is 2.3:1 and fails contrast.
- Every button is `radius-pill`, 36px tall on desktop, label style `label`. Focus: 2px `focus-ring` at a 2px offset.

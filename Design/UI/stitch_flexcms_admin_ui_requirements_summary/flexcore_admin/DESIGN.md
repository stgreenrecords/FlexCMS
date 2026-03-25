# Design System Strategy: The Architectural Curator

## 1. Overview & Creative North Star
The core philosophy of this design system is **"The Architectural Curator."** In a high-density enterprise environment like a CMS, the traditional "box-and-border" approach leads to visual fatigue and cognitive overload. Instead, we treat the interface as a series of curated, stacked planes. 

By leveraging **Tonal Layering** and **Intentional Asymmetry**, we break the monotony of the standard admin dashboard. This system moves away from "data entry" and toward "content orchestration." We prioritize high-information density without sacrificing the "breathable" feel of high-end editorial design. The result is a workspace that feels authoritative, silent, and premium.

---

## 2. Colors & Surface Architecture
The palette is rooted in deep neutrals and professional blues, designed to recede and allow the user’s content to take center stage.

### The "No-Line" Rule
**Explicit Instruction:** Prohibit the use of 1px solid borders for sectioning or layout containment. 
Boundaries must be defined through background color shifts. For example, a `surface-container-low` section sitting on a `surface` background creates a natural, sophisticated edge. Lines are "visual noise"; tonal shifts are "architecture."

### Surface Hierarchy & Nesting
Treat the UI as a physical stack of fine materials.
- **Base Layer:** `surface` (#131313) for the primary application background.
- **Nesting Logic:** Use `surface-container-low` (#1c1b1b) for sidebars or navigation, and `surface-container` (#201f1f) for the primary content canvas. 
- **Elevated Data:** Use `surface-container-high` (#2a2a2a) or `highest` (#353534) for cards or modal elements to create "nested" depth without shadows.

### The Glass & Gradient Rule
To prevent the UI from feeling "flat" or "generic":
- **Floating Elements:** Modals and dropdowns must use `surface-variant` at 80% opacity with a `backdrop-blur` of 12px.
- **Signature Textures:** Use a subtle linear gradient from `primary` (#b0c6ff) to `primary_container` (#0058cc) at a 135-degree angle for primary CTAs. This adds "visual soul" and a tactile, premium finish.

---

## 3. Typography
We utilize a system font stack (Inter) to ensure maximum performance while applying editorial hierarchy to create an authoritative tone.

*   **Display & Headline:** Used sparingly for dashboard overviews. `headline-lg` (2rem) should be used for page titles to anchor the user’s eye.
*   **Title:** `title-md` (1.125rem) is the workhorse for card headers and section titles, providing a clear "stop" for the eye.
*   **Body:** `body-md` (0.875rem) is our standard for data and content. It balances density with legibility.
*   **Labels:** `label-sm` (0.6875rem) is reserved for metadata and micro-copy. Use `on_surface_variant` (#c3c6d6) to de-emphasize this text relative to primary data.

---

## 4. Elevation & Depth
In this system, depth is a function of light and material, not just "drop shadows."

*   **The Layering Principle:** Always stack from dark to light. The "lowest" elements are the darkest (`surface_container_lowest`), and as elements "rise" toward the user, they move toward `surface_bright`.
*   **Ambient Shadows:** For floating elements (like popovers), use a shadow with a blur radius of 32px, an offset of Y: 8px, and a color derived from `on_surface` at 6% opacity. This mimics natural light diffusion.
*   **The "Ghost Border" Fallback:** When high-density data tables require visual separation, use a "Ghost Border": `outline_variant` (#424654) at 15% opacity. Never use a 100% opaque border.
*   **Glassmorphism:** Use semi-transparent surface colors for global navigation headers to allow the content to scroll beneath them, maintaining a sense of place and depth.

---

## 5. Components

### Buttons & Chips
*   **Primary Button:** Gradient-filled (Primary to Primary-Container) with `radius-md` (6px). Use `on_primary` (#002d6f) for text.
*   **Secondary/Tertiary:** No background. Use `on_background` text with a `surface_container_high` hover state.
*   **Action Chips:** Use `secondary_container` (#324575) with `radius-full` (9999px). They should feel like "pills" floating in the space.

### Input Fields & Controls
*   **Text Inputs:** Forbid heavy borders. Use `surface_container_highest` as the background with a 1px "Ghost Border" at the bottom only. When focused, animate a 2px `primary` underline.
*   **Checkboxes/Radios:** Use `primary` for the selected state. Ensure the "Unselected" state uses `outline` at 30% opacity to avoid visual clutter in high-density forms.

### Cards & Lists
*   **The "No-Divider" Rule:** In tables and lists, never use horizontal divider lines. Instead, use a `2.5` (0.5rem) spacing unit between items or a subtle background toggle (zebra striping using `surface_container_low` and `surface_container`).
*   **Density Controls:** For enterprise management, allow the user to toggle between "Comfortable" (Spacing `4`) and "Compact" (Spacing `2`) scales.

### Advanced Enterprise Components
*   **The "Contextual Rail":** A narrow, vertically-oriented toolbar using `surface_container_lowest` for secondary page actions (e.g., version history, metadata toggles).
*   **Status Indicators:** Use a 6px "Dot" of `success`, `warning`, or `error` rather than full-width banners to maintain the "Architectural" aesthetic.

---

## 6. Do's and Don'ts

### Do
*   **Do** use asymmetrical margins (e.g., more padding on the left than the right) for title sections to create an editorial feel.
*   **Do** use `surface-tint` sparingly to highlight active navigation states.
*   **Do** prioritize `body-sm` for data-heavy tables to ensure maximum "at-a-glance" information.

### Don't
*   **Don't** use pure black (#000000) for backgrounds; it kills the "Glassmorphism" effect. Use `surface` (#131313).
*   **Don't** use standard 1px borders to separate the sidebar from the main content; use the shift from `surface_container_low` to `surface_container`.
*   **Don't** use heavy shadows. If you think it needs a shadow, try a lighter surface color first.
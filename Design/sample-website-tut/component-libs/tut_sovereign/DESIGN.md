```markdown
# Design System Specification: The Precision Atelier

## 1. Overview & Creative North Star
**Creative North Star: The Precision Atelier**

This design system is a digital manifestation of high-performance engineering and bespoke luxury. It moves away from the "app-like" fatigue of rounded corners and playful colors, instead adopting the aesthetic of a high-end editorial look or a luxury automotive configuration suite. 

The system breaks the "template" look through **Intentional Asymmetry** and **Cinematic Framing**. By utilizing generous white space (negative space) and high-contrast typography, we create an environment where the product—the vehicle—is the undisputed protagonist. We do not use "blue boxes" to build trust; we use architectural structure, tonal depth, and uncompromising precision.

---

## 2. Colors & Tonal Architecture
The palette is rooted in a deep, nocturnal foundation (`background: #070d1f`) contrasted with technical silvers and muted metallic blues.

### The "No-Line" Rule
To maintain a premium, seamless feel, **1px solid borders are prohibited for sectioning.** Boundaries must be defined solely through background color shifts or subtle tonal transitions. For example, a section using `surface-container-low` should sit directly against the `surface` background to create a logical break without visual clutter.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers. Use the surface-container tiers to create depth:
*   **Base:** `surface` (#070d1f) for the primary canvas.
*   **Subtle Recess:** `surface-container-low` (#09122b) for secondary content areas.
*   **Prominent Layer:** `surface-container-high` (#0b1d48) for interactive modules or elevated cards.

### The "Glass & Gradient" Rule
For floating elements (modals, navigation overlays), use **Glassmorphism**. Apply a semi-transparent `surface-variant` (#0a2257 at 60% opacity) with a `backdrop-blur` of 20px. 

To provide "visual soul," use a subtle linear gradient for primary CTAs, transitioning from `primary` (#c6c6c7) to `primary_dim` (#b8b9b9) at a 45-degree angle. This mimics the light reflection on machined aluminum.

---

## 3. Typography
The typography strategy creates a dialogue between heritage (`newsreader`) and modern engineering (`manrope`).

*   **Display & Headlines (Newsreader):** Use for high-impact statements. The sophisticated serif conveys authority and a "limited edition" feel. 
    *   *Example:* `display-lg` (3.5rem) should be used for hero titles with generous tracking.
*   **Body & Titles (Manrope):** Use for all functional and technical data. This clean, geometric sans-serif ensures maximum readability for specs and fine print.
    *   *Example:* `body-md` (0.875rem) for technical descriptions.
*   **Labels (Manrope Bold):** Always uppercase with 0.05em letter spacing to denote "UI Controls" and "Data Points."

---

## 4. Elevation & Depth
In this design system, depth is felt, not seen. We reject heavy, muddy drop shadows in favor of **Tonal Layering**.

*   **The Layering Principle:** Place a `surface-container-lowest` card on a `surface-container-low` section. The slight contrast creates a "natural lift" that feels architectural.
*   **Ambient Shadows:** If an element must float (e.g., a hover state), use a shadow with a 40px blur, 0px offset, and 4% opacity of `on-surface`. It should feel like an ambient occlusion effect in a 3D render.
*   **The "Ghost Border" Fallback:** When accessibility requires a container definition, use a **Ghost Border**. This is a 1px stroke using `outline-variant` (#32457c) at **15% opacity**. Never use 100% opaque borders.
*   **Zero Radius:** All elements (buttons, cards, inputs) must have a **0px border-radius**. Sharp edges denote precision, luxury, and "The Precision Atelier" aesthetic.

---

## 5. Components

### Buttons
*   **Primary:** Background `primary` (#c6c6c7), text `on-primary` (#3f4041). Sharp edges. 
*   **Secondary:** Ghost style. `Ghost Border` (outline-variant at 20%) with `on-surface` text.
*   **Interaction:** On hover, the Primary button should shift to `primary_fixed` (#e2e2e2) with a subtle horizontal "glimmer" gradient animation.

### Cards & Lists
*   **Rule:** Forbid the use of divider lines. 
*   **Execution:** Separate list items using the spacing scale (e.g., `spacing-4` or `1.4rem`). Use a subtle `surface-container` background shift on hover to indicate interactivity.
*   **Imagery:** Within cards, use `surface-container-highest` as a placeholder color before cinematic photography loads.

### Input Fields
*   **Style:** Minimalist. Only a bottom-aligned "Ghost Border" (1px). 
*   **Active State:** The bottom border transforms into a 2px `primary` (#c6c6c7) line. 
*   **Typography:** Labels use `label-sm` in `on-surface-variant` (#96a9e6).

### Exclusive Component: The "Spec-Sheet" Item
For automotive specs (e.g., 0-60mph), use `headline-lg` (Newsreader) for the value and `label-sm` (Manrope, Uppercase) for the unit, separated by a `spacing-1` (0.35rem) gap. This creates an editorial, data-rich feel.

---

## 6. Do's and Don'ts

### Do
*   **DO** use asymmetric layouts. Place text in the left 1/3 and imagery bleeding off the right edge of the screen.
*   **DO** use `spacing-16` (5.5rem) or `spacing-20` (7rem) between major sections to let the design breathe.
*   **DO** use high-contrast imagery: Deep blacks, bright highlights on chrome, and macro technical close-ups.

### Don't
*   **DON'T** use any rounded corners. Even a 2px radius breaks the precision of this design system.
*   **DON'T** use standard "Error Red" backgrounds. Use `error_container` (#7f2927) for a sophisticated, muted warning.
*   **DON'T** use icons for everything. Prefer high-end typography and clear labels to maintain the editorial "The Precision Atelier" feel.
*   **DON'T** use 100% white (#FFFFFF). Use `tertiary` (#f0f3ff) or `on-surface` (#dfe4ff) for a more sophisticated, "metallic" light.

---
*Director's Note: Every pixel should feel like it was machined from a single block of steel. If a layout feels "busy," increase the spacing by two increments on the scale. Luxury is found in what you omit.*```
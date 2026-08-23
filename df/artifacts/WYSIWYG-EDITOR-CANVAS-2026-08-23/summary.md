# WYSIWYG editor canvas — 2026-08-23

Requested directly, from a screenshot of the editor showing grey boxes labelled
"Product Grid 1", "Feature List 1", "Featured Content":

> *"in the edit mode, I see only structure of the components … while I am editing I
> want to see as close UI as it will be. it should be WYSIWYG."*

Two decisions were taken by the human before building: **reuse the site's renderers
in the canvas** (rather than iframing the published page), and **go beyond parity by
building rich rendering for the components that had none**.

## Why the editor looked nothing like the site

There were two renderer sets.

The admin editor had `ComponentPreview` — a hand-written switch that matched
substrings of the resource type (`type.includes('hero')`), handled a handful of
shapes, and fell through to a grey box carrying the component's name. The site had
`component-map.tsx` with ~28 real renderers plus group renderers.

So a product grid had a real renderer **on the site** and rendered as a grey box **in
the editor**. Authors were editing a wireframe and only saw the real layout after
publishing. Nothing kept the two sets in step, and they had drifted.

## What changed

### 1. One renderer set, in a package

`@flexcms/site-renderers` — the renderers moved out of the site app, with the site and
the admin editor both importing them. The editor is now WYSIWYG *by construction*:
there is no second renderer set that can drift.

The generated contracts are injected rather than imported, so the package makes no
assumption about where the design artifacts sit; each app supplies its own.

### 2. The canvas renders through it

`ComponentPreview` resolves against that registry. Two supports were needed around it,
both because real renderers behave differently from a fixed-size placeholder:

- **An error boundary.** Site renderers are written against published content, where a
  field is authored or absent. In the editor they run against content mid-edit — a
  half-typed URL, a cleared number — so a renderer that never throws in production can
  throw here. One component's render error must not take the canvas and the unsaved
  work with it.
- **A collapsed-component affordance.** The old placeholder was always ~100px, so
  everything could be clicked. A real renderer can legitimately draw nothing: page
  metadata by design, dealer locator with no dealers. Their selection chip only
  appears *after* selection, so they became unselectable. Zero-height renders now show
  a labelled stub — placed outside the measured element, so it cannot feed its own
  height back into the measurement and oscillate.

### 3. Design tokens, scoped

Both apps define `--color-*` custom properties **with the same names and different
values** — admin's light UI theme versus the site's near-black palette. Renderers
dropped into an admin page would silently pick up admin's colours.

Since every site utility resolves through a custom property, the fix is narrow: admin's
Tailwind config gained the same utility names, and `tokens.css` re-binds the property
*values* inside `.flexcms-canvas` only. Admin chrome keeps its own theme; the canvas
gets the site's.

`tokens.css` is a copy of the site's `:root` block, and copies drift — which is the
disease this whole package cures. `tokens.test.ts` compares the two files directly and
fails if they diverge.

### 4. Rich rendering for the other ~380 components

Only ~28 of 406 components had a bespoke renderer. The rest fell to a group renderer
that listed authored fields as `<dt>`/`<dd>` pairs — a data inspector, not a page. It
is why **all 42 form components rendered no interactive control at all** (`R26-4`'s
headline symptom): a signup form showed the words "Email" and "Submit" as definition
terms.

Writing 380 bespoke renderers would mean guessing at a design that does not exist, and
they would rot. Instead `richGroupRenderers.tsx` infers a *layout* from the shape of
the authored content:

| Signal in the data | Layout |
|---|---|
| `fields` / `submitAction` | A real form — labelled inputs, selects, textareas, required markers, submit button |
| `questions` / `faqs` | Disclosures (`<details>`) |
| `columns` + `rows`, or ≥3 uniform records with no imagery | A table |
| `steps` / `stages` | An ordered, numbered step list |
| `stats` / `metrics` | A figure row |
| `links` / `menuItems` | Real anchors |
| Records carrying imagery | A card grid |
| Anything else | Section shell with eyebrow, heading, body, media, CTA |

Inference reads the **data**, not the contract: the generated contracts do not describe
array item shapes, and in the editor the data changes under the renderer as the author
types.

The old field list is kept and wired as a genuine last resort — when no layout matches
*and* there is nothing else to show, it renders, so authored content is never silently
dropped from a page.

Rich-text fields render as markup rather than showing authors the literal
`<p>…</p>`. The backend already sanitises rich text on the way in (OWASP
`HtmlPolicyBuilder` in `flexcms-core`), the same trust boundary the site's existing
rich-text renderer relies on.

## Verification

**Package: 44 tests, 0 failures** (9 files), of which 13 cover the layout inference and
assert semantics — `getByLabelText`, `getByRole('table')`, `<details>` count — rather
than class names, so restyling cannot break the suite but losing an interactive control
will.

Live, on the contact page (two forms, an escalation matrix, an FAQ):

| Component | Before | After |
|---|---|---|
| `contact-form` | field list | 765px, real labelled inputs and submit |
| `support-form` | field list | 641px, VIN / case number / textarea, required marker |
| `escalation-matrix` | field list | a real 4-column table |
| `faq` | field list | real disclosures |
| `page-metadata` | grey box | 62px selectable stub |

The public site now reports **7 inputs, 1 table, 2 disclosures, 0 raw HTML tags** on
that page — it had no inputs at all before.

## Three mistakes worth recording

1. **An import cycle that only failed at runtime.** The rich layouts imported their
   field helpers from `tutGroupedRenderers`, which imports the layout factory. Because
   the group map calls that factory *during module evaluation*, the package threw
   `createRichGroupRenderer is not a function` depending on which module an importer
   reached first — while type-checking and the other test files passed. Helpers moved
   to `fieldShapes.ts` so both sides import downward. I had noted this risk before
   writing the code and walked into it anyway.
2. **Media detection matched exact key names.** `MEDIA_KEYS` listed `image`, `photo`,
   `thumbnail`; the contracts name images after their role — `heroImage`,
   `thumbnailImage`, `posterPhoto` — so almost every real image field was missed. An
   existing test caught it. Detection is now name-shape based, reusing `isImageField`.
3. **Moving the renderers silently unstyled the public site.** They used to live in the
   site's `src/`, so Tailwind scanned them for free; in a package it did not, and every
   utility class was purged. The site still compiled, still rendered the right
   elements, and looked completely broken — plain inputs, no spacing, no colour. No
   type-check, unit test or build catches that. Found by screenshotting the site rather
   than trusting the editor. `tailwindContent.test.ts` now asserts both apps scan the
   package.

## Scope note

The public site's appearance changed too, deliberately and with the human's agreement:
these are the same renderers. Every component previously showing a field list now
renders a laid-out section. That closes `R26-4`'s headline symptom — 42 of 42 form
components rendering no interactive control — though the underlying scope question,
whether all 406 components should get bespoke designs, remains a design decision rather
than an engineering one.

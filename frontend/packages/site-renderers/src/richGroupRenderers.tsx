/**
 * Rich rendering for components that have no bespoke renderer.
 *
 * Only about two dozen of the 406 TUT components have a renderer written for them by
 * hand. Everything else fell through to a group renderer that listed the authored
 * fields as `<dt>`/`<dd>` pairs. That is a data inspector, not a page: a signup form
 * showed the words "Email" and "Submit" as definition terms rather than an input and a
 * button, which is why all 42 form components rendered no interactive control at all.
 *
 * Writing 380 bespoke renderers is not the answer either — they would be guesses about
 * a design that does not exist yet, and they would rot. What this does instead is
 * infer a *layout* from the shape of the authored content and render that properly:
 * an array of question/answer records becomes an accordion, `fields` plus
 * `submitAction` becomes a real form, `columns` plus `rows` becomes a table, an array
 * of records with images and titles becomes a card grid.
 *
 * The inference reads the data rather than the contract, deliberately: the generated
 * contracts do not describe array item shapes, and in the editor the data changes
 * under the renderer as the author types.
 *
 * Because this is the same package the public site renders from, improving these
 * layouts improves the site and the editor canvas together — which is the point.
 */
'use client';

import React from 'react';
import type { FlexCmsRenderer } from '@flexcms/react';
import { linkAttributes, toTutLink } from './tutLink';
import { extractImageUrl, firstText, isImageField, isRecord, normalizeLabel } from './fieldShapes';

// ---------------------------------------------------------------------------
// Field vocabulary
// ---------------------------------------------------------------------------

const HEADING_KEYS = ['title', 'headline', 'heading', 'name'];
const EYEBROW_KEYS = ['eyebrow', 'label', 'category', 'kicker', 'badge', 'tagline'];
const BODY_KEYS = ['description', 'summary', 'body', 'text', 'message', 'intro', 'bio'];
const CTA_KEYS = ['cta', 'primaryCta', 'action', 'link', 'button'];
const MEDIA_KEYS = ['image', 'photo', 'media', 'backgroundImage', 'thumbnail', 'illustration', 'icon', 'logo'];

/**
 * Any field whose *name* reads like an image — `heroImage`, `thumbnailImage`,
 * `posterPhoto`. Matching a fixed list of key names missed most real fields: the
 * contracts name images after their role, not with a bare `image`.
 */
function mediaUrlIn(data: Record<string, unknown>): string | null {
  for (const [key, value] of Object.entries(data)) {
    if (!isImageField(key)) continue;
    const url = extractImageUrl(value);
    if (url) return url;
  }
  return null;
}

/** Keys consumed by the section shell, so a layout does not repeat them. */
const SHELL_KEYS = new Set([...HEADING_KEYS, ...EYEBROW_KEYS, ...BODY_KEYS, ...CTA_KEYS, ...MEDIA_KEYS]);

/** Keys that carry presentation rather than content, never worth showing as data. */
const CHROME_KEYS = new Set([
  'layout', 'styleVariant', 'variant', 'theme', 'alignment', 'align', 'columns',
  'anchorId', 'cssClass', 'analyticsId', 'testId', 'order', 'index', 'id',
]);

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function nonEmptyText(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return null;
}

/** The first array field whose name matches, or any array of records. */
function findArrayField(
  data: Record<string, unknown>,
  names: string[],
): { key: string; items: unknown[] } | null {
  for (const name of names) {
    const items = asArray(data[name]);
    if (items.length > 0) return { key: name, items };
  }
  return null;
}

function recordsOf(items: unknown[]): Record<string, unknown>[] {
  return items.filter(isRecord);
}

/** Keys shared by most records in a collection — the basis for table detection. */
function commonKeys(records: Record<string, unknown>[]): string[] {
  if (records.length === 0) return [];
  const counts = new Map<string, number>();
  for (const record of records) {
    for (const key of Object.keys(record)) counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()]
    .filter(([, count]) => count >= Math.ceil(records.length * 0.6))
    .map(([key]) => key);
}

// ---------------------------------------------------------------------------
// Shared presentation
// ---------------------------------------------------------------------------

/**
 * Rich-text fields arrive as HTML strings, and printing them as text shows authors
 * `<p>Our privacy policy…</p>` on the page. The backend sanitises rich text on the way
 * in (OWASP HtmlPolicyBuilder in flexcms-core), which is the same trust boundary the
 * site's own rich-text renderer relies on.
 */
const HTML_LIKE = /<\/?[a-z][a-z0-9]*(\s[^<>]*)?>/i;

function BodyCopy({ text, className }: { text: string; className: string }) {
  if (HTML_LIKE.test(text)) {
    return <div className={className} dangerouslySetInnerHTML={{ __html: text }} />;
  }
  return <p className={className}>{text}</p>;
}

function Cta({ value }: { value: unknown }) {
  const link = toTutLink(value);
  if (!link?.label) return null;
  return (
    <a
      href={link.url || undefined}
      {...linkAttributes(link)}
      className="mt-6 inline-flex bg-primary px-7 py-3 font-label text-xs uppercase tracking-[0.18em] text-on-primary hover:bg-primary-fixed"
    >
      {link.label}
    </a>
  );
}

function SectionShell({
  eyebrow,
  heading,
  body,
  media,
  cta,
  children,
}: {
  eyebrow: string | null;
  heading: string | null;
  body: string | null;
  media: string | null;
  cta: unknown;
  children?: React.ReactNode;
}) {
  return (
    <section className="bg-surface px-6 py-14 text-on-surface sm:px-10">
      <div className="mx-auto max-w-6xl">
        {eyebrow ? (
          <p className="font-label text-xs uppercase tracking-[0.24em] text-on-surface-variant">
            {eyebrow}
          </p>
        ) : null}
        {heading ? (
          <h2 className="mt-3 font-headline text-3xl leading-tight sm:text-4xl">{heading}</h2>
        ) : null}
        {body ? (
          <BodyCopy
            text={body}
            className="mt-4 max-w-3xl font-body text-base leading-relaxed text-on-surface-variant"
          />
        ) : null}
        {media ? (
          <img
            src={media}
            alt={heading ?? ''}
            loading="lazy"
            className="mt-8 w-full rounded-lg border border-outline-variant object-cover"
            style={{ maxHeight: '26rem' }}
          />
        ) : null}
        {children ? <div className="mt-8">{children}</div> : null}
        <Cta value={cta} />
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Layouts
// ---------------------------------------------------------------------------

/** Real inputs. The 42 components in the forms group previously rendered none. */
function FormLayout({ fields, submitLabel }: { fields: unknown[]; submitLabel: string }) {
  return (
    <form
      className="grid max-w-2xl gap-5"
      onSubmit={(event) => event.preventDefault()}
      aria-label="Preview form"
    >
      {fields.map((field, index) => {
        const record = isRecord(field) ? field : {};
        const label = nonEmptyText(record.label) ?? nonEmptyText(record.name) ?? nonEmptyText(field) ?? `Field ${index + 1}`;
        const type = (nonEmptyText(record.type) ?? 'text').toLowerCase();
        const placeholder = nonEmptyText(record.placeholder) ?? '';
        const required = record.required === true;
        const options = asArray(record.options ?? record.choices);
        const controlId = `preview-field-${index}`;

        const controlClass =
          'w-full rounded border border-outline bg-surface-container px-3 py-2 font-body text-sm text-on-surface placeholder:text-on-surface-variant';

        return (
          <div key={`${label}-${index}`} className="grid gap-2">
            <label htmlFor={controlId} className="font-label text-xs uppercase tracking-[0.14em] text-on-surface-variant">
              {normalizeLabel(label)}
              {required ? <span className="text-error"> *</span> : null}
            </label>

            {options.length > 0 ? (
              <select id={controlId} className={controlClass} defaultValue="">
                <option value="" disabled>
                  {placeholder || 'Select…'}
                </option>
                {options.map((option, optionIndex) => {
                  const optionLabel =
                    nonEmptyText(isRecord(option) ? (option.label ?? option.value) : option) ??
                    `Option ${optionIndex + 1}`;
                  return <option key={optionLabel}>{optionLabel}</option>;
                })}
              </select>
            ) : type.includes('textarea') || type.includes('message') ? (
              <textarea id={controlId} rows={4} placeholder={placeholder} className={controlClass} />
            ) : type.includes('checkbox') || type.includes('consent') ? (
              <span className="flex items-center gap-2 font-body text-sm text-on-surface-variant">
                <input id={controlId} type="checkbox" />
                {placeholder || normalizeLabel(label)}
              </span>
            ) : (
              <input
                id={controlId}
                type={['email', 'tel', 'number', 'date', 'password', 'url'].find((t) => type.includes(t)) ?? 'text'}
                placeholder={placeholder}
                className={controlClass}
              />
            )}
          </div>
        );
      })}

      <button
        type="submit"
        className="mt-2 justify-self-start bg-primary px-7 py-3 font-label text-xs uppercase tracking-[0.18em] text-on-primary hover:bg-primary-fixed"
      >
        {submitLabel}
      </button>
    </form>
  );
}

function AccordionLayout({ entries }: { entries: Record<string, unknown>[] }) {
  return (
    <div className="divide-y divide-outline-variant border-y border-outline-variant">
      {entries.map((entry, index) => {
        const question =
          firstText(entry, ['question', 'title', 'label', 'heading', 'name']) ?? `Item ${index + 1}`;
        const answer = firstText(entry, ['answer', 'description', 'body', 'text', 'content', 'summary']);
        return (
          <details key={`${question}-${index}`} className="group py-4" open={index === 0}>
            <summary className="cursor-pointer font-body text-base font-semibold text-on-surface marker:text-on-surface-variant">
              {question}
            </summary>
            {answer ? (
              <p className="mt-3 font-body text-sm leading-relaxed text-on-surface-variant">{answer}</p>
            ) : null}
          </details>
        );
      })}
    </div>
  );
}

function TableLayout({
  records,
  keys,
}: {
  records: Record<string, unknown>[];
  keys: string[];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse font-body text-sm">
        <thead>
          <tr className="border-b border-outline text-left">
            {keys.map((key) => (
              <th key={key} className="px-3 py-2 font-label text-xs uppercase tracking-[0.14em] text-on-surface-variant">
                {normalizeLabel(key)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {records.map((record, index) => (
            <tr key={index} className="border-b border-outline-variant">
              {keys.map((key) => (
                <td key={key} className="px-3 py-2 text-on-surface">
                  {nonEmptyText(record[key]) ?? (isRecord(record[key]) ? firstText(record[key] as Record<string, unknown>, ['label', 'title', 'name', 'value']) ?? '—' : '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StepsLayout({ steps }: { steps: unknown[] }) {
  return (
    <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {steps.map((step, index) => {
        const record = isRecord(step) ? step : {};
        const title = firstText(record, ['title', 'label', 'name', 'heading']) ?? nonEmptyText(step) ?? `Step ${index + 1}`;
        const body = firstText(record, ['description', 'summary', 'body', 'text']);
        return (
          <li key={`${title}-${index}`} className="border-l-2 border-primary pl-4">
            <span className="font-label text-xs uppercase tracking-[0.2em] text-on-surface-variant">
              Step {index + 1}
            </span>
            <p className="mt-1 font-body text-base font-semibold text-on-surface">{title}</p>
            {body ? <p className="mt-1 font-body text-sm text-on-surface-variant">{body}</p> : null}
          </li>
        );
      })}
    </ol>
  );
}

function StatsLayout({ stats }: { stats: Record<string, unknown>[] }) {
  return (
    <dl className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <div key={index}>
          <dt className="font-headline text-3xl text-on-surface">
            {firstText(stat, ['value', 'number', 'figure', 'amount', 'stat']) ?? '—'}
          </dt>
          <dd className="mt-1 font-label text-xs uppercase tracking-[0.16em] text-on-surface-variant">
            {firstText(stat, ['label', 'title', 'name', 'description']) ?? ''}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function LinkListLayout({ links }: { links: unknown[] }) {
  return (
    <ul className="flex flex-wrap gap-x-8 gap-y-3">
      {links.map((item, index) => {
        const link = toTutLink(item);
        const label =
          link?.label ?? (isRecord(item) ? firstText(item, ['label', 'title', 'name', 'text']) : nonEmptyText(item));
        if (!label) return null;
        return (
          <li key={`${label}-${index}`}>
            <a
              href={link?.url || undefined}
              {...(link ? linkAttributes(link) : {})}
              className="font-body text-sm text-on-surface-variant underline-offset-4 hover:text-on-surface hover:underline"
            >
              {label}
            </a>
          </li>
        );
      })}
    </ul>
  );
}

function CardGridLayout({ items }: { items: unknown[] }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item, index) => {
        const record = isRecord(item) ? item : {};
        const title =
          firstText(record, HEADING_KEYS) ?? nonEmptyText(item) ?? `Item ${index + 1}`;
        const body = firstText(record, BODY_KEYS);
        const image = mediaUrlIn(record);
        const meta = firstText(record, ['price', 'date', 'dateTime', 'author', 'duration', 'status']);
        const link = toTutLink(record.cta ?? record.link ?? record.url);

        return (
          <article
            key={`${title}-${index}`}
            className="flex flex-col overflow-hidden rounded-lg border border-outline-variant bg-surface-container-low"
          >
            {image ? (
              <img src={image} alt={title} loading="lazy" className="h-44 w-full object-cover" />
            ) : null}
            <div className="flex flex-1 flex-col p-5">
              {meta ? (
                <p className="font-label text-[0.65rem] uppercase tracking-[0.18em] text-on-surface-variant">
                  {meta}
                </p>
              ) : null}
              <h3 className="mt-1 font-body text-base font-semibold text-on-surface">{title}</h3>
              {body ? (
                <p className="mt-2 font-body text-sm leading-relaxed text-on-surface-variant">{body}</p>
              ) : null}
              {link?.label ? (
                <a
                  href={link.url || undefined}
                  {...linkAttributes(link)}
                  className="mt-4 font-label text-xs uppercase tracking-[0.16em] text-primary-fixed underline-offset-4 hover:underline"
                >
                  {link.label}
                </a>
              ) : null}
            </div>
          </article>
        );
      })}
    </div>
  );
}

/** Scalar leftovers, shown compactly rather than as a full definition list. */
function MetaRow({ entries }: { entries: [string, unknown][] }) {
  if (entries.length === 0) return null;
  return (
    <dl className="mt-8 flex flex-wrap gap-x-10 gap-y-3 border-t border-outline-variant pt-5">
      {entries.map(([key, value]) => (
        <div key={key}>
          <dt className="font-label text-[0.65rem] uppercase tracking-[0.16em] text-on-surface-variant">
            {normalizeLabel(key)}
          </dt>
          <dd className="mt-0.5 font-body text-sm text-on-surface">{nonEmptyText(value) ?? '—'}</dd>
        </div>
      ))}
    </dl>
  );
}

// ---------------------------------------------------------------------------
// Layout inference
// ---------------------------------------------------------------------------

/**
 * Chooses the layout for a component from the shape of its authored content.
 *
 * Ordered most-specific first: a component with both `fields` and `questions` is a
 * form with a question list, not an FAQ.
 */
function chooseBody(data: Record<string, unknown>): React.ReactNode {
  const formFields = findArrayField(data, ['fields', 'inputs', 'formFields']);
  if (formFields || data.submitAction !== undefined || data.submitLabel !== undefined) {
    const submitLabel =
      nonEmptyText(data.submitLabel) ??
      firstText(isRecord(data.submitAction) ? data.submitAction : {}, ['label', 'title', 'text']) ??
      'Submit';
    return <FormLayout fields={formFields?.items ?? []} submitLabel={submitLabel} />;
  }

  const questions = findArrayField(data, ['questions', 'faqs', 'accordionItems']);
  if (questions) return <AccordionLayout entries={recordsOf(questions.items)} />;

  const steps = findArrayField(data, ['steps', 'stages', 'timeline']);
  if (steps) return <StepsLayout steps={steps.items} />;

  const stats = findArrayField(data, ['stats', 'metrics', 'figures']);
  if (stats) return <StatsLayout stats={recordsOf(stats.items)} />;

  const links = findArrayField(data, ['links', 'menuItems', 'navItems', 'breadcrumbs']);
  if (links) return <LinkListLayout links={links.items} />;

  const rows = findArrayField(data, ['rows']);
  if (rows) {
    const records = recordsOf(rows.items);
    const declared = asArray(data.columns)
      .map((column) => nonEmptyText(isRecord(column) ? (column.key ?? column.label ?? column.title) : column))
      .filter((value): value is string => Boolean(value));
    const keys = declared.length > 0 ? declared : commonKeys(records);
    if (records.length > 0 && keys.length > 0) return <TableLayout records={records} keys={keys} />;
  }

  // Any remaining collection. A wide, uniform one reads better as a table than as
  // cards — that is what makes a spec sheet legible instead of a wall of boxes.
  const collectionKey = Object.keys(data).find(
    (key) => !CHROME_KEYS.has(key) && asArray(data[key]).length > 0,
  );
  if (collectionKey) {
    const items = asArray(data[collectionKey]);
    const records = recordsOf(items);
    if (records.length >= 3) {
      const keys = commonKeys(records);
      const hasMedia = records.some((record) => mediaUrlIn(record) !== null);
      if (keys.length >= 3 && !hasMedia) return <TableLayout records={records} keys={keys} />;
    }
    if (records.length > 0) return <CardGridLayout items={items} />;

    const labels = items.map(nonEmptyText).filter((value): value is string => Boolean(value));
    if (labels.length > 0) {
      return (
        <ul className="flex flex-wrap gap-3">
          {labels.map((label, index) => (
            <li
              key={`${label}-${index}`}
              className="rounded-full border border-outline px-4 py-1.5 font-body text-sm text-on-surface-variant"
            >
              {label}
            </li>
          ))}
        </ul>
      );
    }
  }

  return null;
}

/**
 * A group renderer that lays content out rather than listing it.
 *
 * `groupName` is retained for diagnostics — the markup is driven by the content's
 * shape, which travels better across 406 components than a per-group guess would.
 */
export function createRichGroupRenderer(
  groupName: string,
  fallback?: FlexCmsRenderer,
): FlexCmsRenderer {
  const RichGroupRenderer: FlexCmsRenderer = (props) => {
    const { data, children, resourceType, name } = props;
    const content = (data ?? {}) as Record<string, unknown>;

    const heading = firstText(content, HEADING_KEYS) ?? normalizeLabel(
      resourceType?.split('/').pop() ?? name ?? 'Component',
    );
    const eyebrow = firstText(content, EYEBROW_KEYS);
    const body = firstText(content, BODY_KEYS);
    const cta = CTA_KEYS.map((key) => content[key]).find((value) => value !== undefined);
    const media = mediaUrlIn(content);

    const bodyLayout = chooseBody(content);

    // Anything the shell and the layout did not use, if it is a plain value worth
    // showing. Arrays and objects are left out: whatever consumed them already
    // rendered them, and dumping the rest re-creates the field list this replaces.
    const usedCollection = bodyLayout !== null;
    const meta = Object.entries(content).filter(([key, value]) => {
      if (SHELL_KEYS.has(key) || CHROME_KEYS.has(key) || isImageField(key)) return false;
      if (key === 'submitAction' || key === 'submitLabel') return false;
      if (Array.isArray(value) || isRecord(value)) return false;
      if (usedCollection && value === undefined) return false;
      return nonEmptyText(value) !== null;
    });

    // Nothing matched a layout and there is nothing to show: rather than emit an
    // empty section, hand back to the field list so authored content is never
    // silently dropped from the page.
    const renderedNothing =
      bodyLayout === null && meta.length === 0 && !body && !media && !children;
    if (renderedNothing && fallback) {
      const Fallback = fallback;
      return <Fallback {...props} />;
    }

    return (
      <div data-flexcms-group={groupName} data-flexcms-resource-type={resourceType}>
        <SectionShell eyebrow={eyebrow} heading={heading} body={body} media={media} cta={cta}>
          {bodyLayout}
          <MetaRow entries={meta} />
          {children ? <div className="mt-8 space-y-4">{children}</div> : null}
        </SectionShell>
      </div>
    );
  };

  RichGroupRenderer.displayName = `${groupName.replace(/[^a-z0-9]/gi, '')}RichRenderer`;
  return RichGroupRenderer;
}

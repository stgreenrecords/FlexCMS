/**
 * Accessibility smoke helpers (REB-25 scenario 7).
 *
 * Smoke, not an audit: these check the structural things whose absence makes a page
 * unusable with a keyboard or a screen reader, and which a suite can assert reliably
 * without a full rules engine. Anything subtler belongs to a real accessibility review.
 *
 * The checks return findings instead of throwing, so a scenario can decide whether a
 * given gap is a failure or an observation. `/dam` renders no `h1` and every other admin
 * route does — worth recording, and not worth failing an unrelated suite over.
 */
import { By, Key, type WebDriver } from 'selenium-webdriver';

export interface A11yFinding {
  check: string;
  detail: string;
}

/** Exactly one `<main>`, at least one `<nav>`, exactly one `<h1>`. */
export async function landmarkFindings(driver: WebDriver): Promise<A11yFinding[]> {
  const counts = await driver.executeScript<{ main: number; nav: number; h1: number }>(`
    return {
      main: document.querySelectorAll('main').length,
      nav: document.querySelectorAll('nav').length,
      h1: document.querySelectorAll('h1').length,
    };
  `);

  const findings: A11yFinding[] = [];
  if (counts.main !== 1) {
    findings.push({
      check: 'single main landmark',
      detail: `found ${counts.main} <main> elements; assistive technology needs exactly one`,
    });
  }
  if (counts.nav === 0) {
    findings.push({ check: 'nav landmark', detail: 'no <nav> element on the page' });
  }
  if (counts.h1 !== 1) {
    findings.push({
      check: 'single h1',
      detail: `found ${counts.h1} <h1> elements; a page needs exactly one title`,
    });
  }
  return findings;
}

/**
 * Interactive controls with no accessible name.
 *
 * Checked in the browser because an accessible name can come from several places —
 * text content, `aria-label`, `aria-labelledby`, `title`, or a `<label>` — and only the
 * DOM knows which applied.
 */
export async function unlabelledControlFindings(driver: WebDriver): Promise<A11yFinding[]> {
  const unlabelled = await driver.executeScript<string[]>(`
    function accessibleName(el) {
      if (el.getAttribute('aria-label')) return el.getAttribute('aria-label');
      const labelledBy = el.getAttribute('aria-labelledby');
      if (labelledBy) {
        const target = document.getElementById(labelledBy);
        if (target && target.innerText.trim()) return target.innerText.trim();
      }
      if (el.id) {
        const label = document.querySelector('label[for="' + el.id + '"]');
        if (label && label.innerText.trim()) return label.innerText.trim();
      }
      if (el.closest('label') && el.closest('label').innerText.trim()) return 'wrapped-label';
      if (el.getAttribute('title')) return el.getAttribute('title');
      if (el.getAttribute('placeholder')) return el.getAttribute('placeholder');
      if ((el.innerText || '').trim()) return el.innerText.trim();
      if (el.querySelector('svg') && el.getAttribute('aria-hidden') !== 'true') return null;
      return null;
    }

    const results = [];
    for (const el of document.querySelectorAll('button, input, select, textarea, a[href]')) {
      // Hidden controls are not reachable, so they are not the user's problem.
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) continue;
      if (el.type === 'hidden') continue;
      if (!accessibleName(el)) {
        results.push(el.tagName.toLowerCase()
          + (el.type ? '[type=' + el.type + ']' : '')
          + (el.className ? '.' + String(el.className).split(' ')[0] : ''));
      }
    }
    return results;
  `);

  // Reported as one finding per distinct shape: fifty identical icon buttons are one
  // defect, not fifty.
  const grouped = new Map<string, number>();
  for (const control of unlabelled) grouped.set(control, (grouped.get(control) ?? 0) + 1);

  return [...grouped.entries()].map(([control, count]) => ({
    check: 'labelled control',
    detail: `${control}${count > 1 ? ` (${count} occurrences)` : ''} has no accessible name`,
  }));
}

/** Whether Tab from the document body reaches a real control. */
export async function keyboardReachesControl(driver: WebDriver): Promise<A11yFinding[]> {
  const body = await driver.findElement(By.css('body'));
  await body.sendKeys(Key.TAB);

  const focused = await driver.executeScript<string>(
    'return document.activeElement ? document.activeElement.tagName : "NONE";',
  );

  if (['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'].includes(focused)) return [];
  return [
    {
      check: 'keyboard reachability',
      detail: `Tab from the body focused <${focused.toLowerCase()}> rather than a control`,
    },
  ];
}

/**
 * Whether the focused element shows a visible focus indicator.
 *
 * Deliberately lenient: it only reports when an outline has been explicitly removed and
 * nothing replaced it. Judging whether a custom indicator is *sufficient* is a design
 * question, not something to assert here.
 */
export async function focusIndicatorFindings(driver: WebDriver): Promise<A11yFinding[]> {
  const finding = await driver.executeScript<string | null>(`
    const el = document.activeElement;
    if (!el || el === document.body) return null;
    const s = getComputedStyle(el);
    const noOutline = s.outlineStyle === 'none' || s.outlineWidth === '0px';
    const noRing = (!s.boxShadow || s.boxShadow === 'none') && (!s.borderColor || s.borderStyle === 'none');
    if (noOutline && noRing) {
      return el.tagName.toLowerCase() + (el.className ? '.' + String(el.className).split(' ')[0] : '');
    }
    return null;
  `);

  return finding
    ? [{ check: 'visible focus indicator', detail: `${finding} suppresses its outline with no replacement` }]
    : [];
}

/** Every structural check for one page, in one call. */
export async function accessibilitySmoke(driver: WebDriver): Promise<A11yFinding[]> {
  return [
    ...(await landmarkFindings(driver)),
    ...(await unlabelledControlFindings(driver)),
    ...(await keyboardReachesControl(driver)),
    ...(await focusIndicatorFindings(driver)),
  ];
}

export function describeA11y(findings: A11yFinding[]): string {
  return findings.map((f) => `  [${f.check}] ${f.detail}`).join('\n');
}

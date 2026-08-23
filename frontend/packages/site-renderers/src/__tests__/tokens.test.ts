/**
 * The canvas tokens must stay identical to the site's.
 *
 * `tokens.css` re-declares the site's design tokens scoped to `.flexcms-canvas`, so
 * the renderers look the same inside the admin editor as they do on the published
 * page. That is a copy, and copies drift — which is the exact failure this whole
 * package exists to end. A retuned colour on the site would otherwise leave the
 * editor quietly showing the old palette, and "WYSIWYG" would erode one token at a
 * time with nothing failing.
 *
 * Rather than trust a comment, this compares the two files directly.
 */
import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

const TOKENS_CSS = path.resolve(__dirname, '../tokens.css');
const SITE_GLOBALS = path.resolve(
  __dirname,
  '../../../../apps/site-nextjs/src/app/globals.css',
);

/** Custom-property declarations inside the first block matching `selector`. */
function tokensIn(css: string, selector: RegExp): Record<string, string> {
  const block = css.match(selector);
  if (!block) throw new Error(`no block matching ${selector} found`);

  const tokens: Record<string, string> = {};
  for (const [, name, value] of block[1].matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    tokens[name] = value.trim();
  }
  return tokens;
}

describe('canvas design tokens', () => {
  const canvas = tokensIn(
    fs.readFileSync(TOKENS_CSS, 'utf8'),
    /\.flexcms-canvas\s*\{([\s\S]*?)\}/,
  );
  const site = tokensIn(fs.readFileSync(SITE_GLOBALS, 'utf8'), /:root\s*\{([\s\S]*?)\}/);

  it('declares the same token names as the site', () => {
    expect(Object.keys(canvas).sort()).to.deep.equal(Object.keys(site).sort());
  });

  it('declares the same value for every token', () => {
    expect(canvas).to.deep.equal(site);
  });

  it('covers the tokens the renderers actually resolve', () => {
    // A guard against an empty or truncated file passing the comparisons above.
    expect(Object.keys(canvas).length).to.be.greaterThan(20);
    expect(canvas['--color-surface']).to.be.a('string').and.not.equal('');
    expect(canvas['--font-body']).to.be.a('string').and.not.equal('');
  });
});

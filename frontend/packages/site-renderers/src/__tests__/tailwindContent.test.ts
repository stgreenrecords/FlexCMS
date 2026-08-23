/**
 * Every app rendering these components must scan this package for Tailwind classes.
 *
 * The renderers used to live inside the site app's `src/`, so its Tailwind content
 * glob picked them up for free. Moving them into a package silently ended that: the
 * site kept compiling and kept rendering the right elements, but every utility class
 * in this package was purged from its stylesheet, so the public pages came out
 * completely unstyled — plain white inputs, no spacing, no colours.
 *
 * Nothing about that fails a type-check, a unit test, or a build. It is only visible
 * to someone looking at the page, which makes it exactly the kind of regression worth
 * a test.
 */
import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

const APPS = ['site-nextjs', 'admin'];

describe('tailwind content globs', () => {
  for (const app of APPS) {
    it(`${app} scans the shared renderers`, () => {
      const configPath = path.resolve(__dirname, `../../../../apps/${app}/tailwind.config.js`);
      const config = fs.readFileSync(configPath, 'utf8');

      expect(
        config,
        `${app}/tailwind.config.js must include packages/site-renderers in its content globs, ` +
          'or every class these renderers use is purged and the pages render unstyled',
      ).to.contain('packages/site-renderers/src');
    });
  }

  it('admin defines the colour utilities the renderers use', () => {
    // Admin's own theme has no `surface` or `on-surface` colours; without these the
    // canvas renders the components with no background or text colour at all.
    const configPath = path.resolve(__dirname, '../../../../apps/admin/tailwind.config.js');
    const config = fs.readFileSync(configPath, 'utf8');

    for (const token of ['surface', 'on-surface-variant', 'outline-variant', 'on-primary']) {
      expect(config, `admin tailwind config is missing the "${token}" colour`).to.contain(token);
    }
  });
});

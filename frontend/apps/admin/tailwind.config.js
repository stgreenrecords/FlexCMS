/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{ts,tsx,js,jsx}',
    // Include @flexcms/ui components so their Tailwind classes are not purged
    '../../packages/ui/src/**/*.{ts,tsx}',
    // The shared TUT renderers are rendered inside the editor canvas, so their
    // utility classes must be generated here too or the canvas comes out unstyled.
    '../../packages/site-renderers/src/**/*.{ts,tsx}',
  ],
  // The colour and font utilities the shared renderers use. Every one resolves to a
  // CSS custom property, and `@flexcms/site-renderers/tokens.css` binds those
  // properties to the site's values inside `.flexcms-canvas` — so the same class
  // means the admin palette outside the canvas and the site palette within it.
  theme: {
    extend: {
      colors: {
        background: 'var(--color-background)',
        foreground: 'var(--color-foreground)',
        primary: 'var(--color-primary)',
        'on-primary': 'var(--color-on-primary)',
        'primary-fixed': 'var(--color-primary-fixed)',
        secondary: 'var(--color-secondary)',
        'on-secondary': 'var(--color-on-secondary)',
        surface: 'var(--color-surface)',
        'surface-variant': 'var(--color-surface-variant)',
        'surface-container': 'var(--color-surface-container)',
        'surface-container-low': 'var(--color-surface-container-low)',
        'surface-container-high': 'var(--color-surface-container-high)',
        'surface-container-highest': 'var(--color-surface-container-highest)',
        'on-surface': 'var(--color-on-surface)',
        'on-surface-variant': 'var(--color-on-surface-variant)',
        outline: 'var(--color-outline)',
        'outline-variant': 'var(--color-outline-variant)',
        error: 'var(--color-error)',
        'on-error': 'var(--color-on-error)',
        'error-container': 'var(--color-error-container)',
        'on-error-container': 'var(--color-on-error-container)',
      },
      fontFamily: {
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
        headline: ['var(--font-headline)', 'Georgia', 'serif'],
        label: ['var(--font-label)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};


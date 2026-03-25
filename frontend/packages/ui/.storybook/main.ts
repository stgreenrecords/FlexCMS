import type { StorybookConfig } from '@storybook/react-vite';

/**
 * Storybook configuration for @flexcms/ui design system.
 *
 * Uses the Vite builder for fast HMR and minimal config.
 * Stories live alongside components in src/stories/.
 */
const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|mjs|ts|tsx)', '../src/**/*.mdx'],
  addons: [
    '@storybook/addon-essentials',   // controls, actions, docs, backgrounds, viewport, toolbars
    '@storybook/addon-interactions', // interaction testing
    '@storybook/addon-a11y',         // accessibility auditing
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
  viteFinal(config) {
    return {
      ...config,
      css: {
        ...config.css,
        postcss: {
          plugins: [],
        },
      },
    };
  },
};

export default config;


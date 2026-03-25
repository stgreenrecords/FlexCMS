import type { Preview, Decorator } from '@storybook/react';
import React from 'react';
import { darkTheme, lightTheme, applyTheme } from '../src/themes';

// ---------------------------------------------------------------------------
// Theme decorator — applies FlexCMS design tokens to every story
// ---------------------------------------------------------------------------

const withFlexCmsTheme: Decorator = (Story, context) => {
  const theme = context.globals['theme'] ?? 'dark';
  const tokens = theme === 'dark' ? darkTheme : lightTheme;

  // Apply theme tokens to the document root
  React.useEffect(() => {
    applyTheme(tokens);
    document.documentElement.style.fontFamily = 'Inter, system-ui, sans-serif';
    document.documentElement.style.background = tokens['--color-background'];
    document.documentElement.style.color = tokens['--color-foreground'];
  }, [theme]);

  return (
    <div
      style={{
        fontFamily: 'Inter, system-ui, sans-serif',
        padding: '2rem',
        background: tokens['--color-background'],
        color: tokens['--color-foreground'],
        minHeight: '100vh',
      }}
    >
      <Story />
    </div>
  );
};

// ---------------------------------------------------------------------------
// Global decorators
// ---------------------------------------------------------------------------

const preview: Preview = {
  decorators: [withFlexCmsTheme],

  globalTypes: {
    theme: {
      description: 'FlexCMS color theme',
      defaultValue: 'dark',
      toolbar: {
        title: 'Theme',
        icon: 'circlehollow',
        items: [
          { value: 'light', title: 'Light', icon: 'sun' },
          { value: 'dark', title: 'Dark', icon: 'moon' },
        ],
        dynamicTitle: true,
      },
    },
  },

  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: { disable: true }, // We handle backgrounds via the theme decorator
    layout: 'fullscreen',
  },
};

export default preview;


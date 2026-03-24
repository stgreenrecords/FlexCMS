/**
 * FlexCMS Theme Token System
 *
 * All themes are defined as CSS custom property maps. Switching themes swaps
 * the custom properties on <html>, and every component reacts automatically.
 *
 * Brand teams can define custom themes in CMS site settings, which are
 * fetched and applied at runtime via applyTheme().
 */

export interface ThemeTokens {
  // Surface colors
  '--color-background': string;
  '--color-foreground': string;
  '--color-card': string;
  '--color-card-foreground': string;
  '--color-popover': string;
  '--color-popover-foreground': string;

  // Brand colors
  '--color-primary': string;
  '--color-primary-foreground': string;
  '--color-secondary': string;
  '--color-secondary-foreground': string;
  '--color-accent': string;
  '--color-accent-foreground': string;

  // Semantic colors
  '--color-muted': string;
  '--color-muted-foreground': string;
  '--color-destructive': string;
  '--color-destructive-foreground': string;

  // Borders
  '--color-border': string;
  '--color-input': string;
  '--color-ring': string;

  // Radius
  '--radius-sm': string;
  '--radius-md': string;
  '--radius-lg': string;

  // Allow custom tokens
  [key: `--${string}`]: string;
}

// ---------------------------------------------------------------------------
// Built-in Themes
// ---------------------------------------------------------------------------

export const lightTheme: ThemeTokens = {
  '--color-background': '#ffffff',
  '--color-foreground': '#0a0a0a',
  '--color-card': '#ffffff',
  '--color-card-foreground': '#0a0a0a',
  '--color-popover': '#ffffff',
  '--color-popover-foreground': '#0a0a0a',
  '--color-primary': '#2563eb',
  '--color-primary-foreground': '#ffffff',
  '--color-secondary': '#f5f5f5',
  '--color-secondary-foreground': '#171717',
  '--color-accent': '#f5f5f5',
  '--color-accent-foreground': '#171717',
  '--color-muted': '#f5f5f5',
  '--color-muted-foreground': '#737373',
  '--color-destructive': '#ef4444',
  '--color-destructive-foreground': '#ffffff',
  '--color-border': '#e5e5e5',
  '--color-input': '#e5e5e5',
  '--color-ring': '#2563eb',
  '--radius-sm': '0.25rem',
  '--radius-md': '0.375rem',
  '--radius-lg': '0.5rem',
};

export const darkTheme: ThemeTokens = {
  '--color-background': '#0a0a0a',
  '--color-foreground': '#fafafa',
  '--color-card': '#171717',
  '--color-card-foreground': '#fafafa',
  '--color-popover': '#171717',
  '--color-popover-foreground': '#fafafa',
  '--color-primary': '#3b82f6',
  '--color-primary-foreground': '#ffffff',
  '--color-secondary': '#262626',
  '--color-secondary-foreground': '#fafafa',
  '--color-accent': '#262626',
  '--color-accent-foreground': '#fafafa',
  '--color-muted': '#262626',
  '--color-muted-foreground': '#a3a3a3',
  '--color-destructive': '#dc2626',
  '--color-destructive-foreground': '#ffffff',
  '--color-border': '#262626',
  '--color-input': '#262626',
  '--color-ring': '#3b82f6',
  '--radius-sm': '0.25rem',
  '--radius-md': '0.375rem',
  '--radius-lg': '0.5rem',
};

// ---------------------------------------------------------------------------
// Theme Application
// ---------------------------------------------------------------------------

/** Apply a theme to the document root (swaps all CSS custom properties) */
export function applyTheme(tokens: ThemeTokens, element?: HTMLElement): void {
  const target = element ?? document.documentElement;
  for (const [key, value] of Object.entries(tokens)) {
    target.style.setProperty(key, value);
  }
}

/** Create a custom brand theme by overriding specific tokens */
export function createTheme(overrides: Partial<ThemeTokens>, base: ThemeTokens = lightTheme): ThemeTokens {
  return { ...base, ...overrides };
}


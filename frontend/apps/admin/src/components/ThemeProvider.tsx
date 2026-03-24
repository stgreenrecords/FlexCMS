'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { lightTheme, darkTheme, applyTheme, type ThemeTokens } from '@flexcms/ui';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: ThemeMode;
  /** Custom brand theme overrides (loaded from CMS site settings) */
  brandOverrides?: Partial<ThemeTokens>;
}

/**
 * Theme provider for the Admin UI.
 * Applies theme tokens to <html> and manages light/dark/system switching.
 */
export function ThemeProvider({ children, defaultTheme = 'system', brandOverrides }: ThemeProviderProps) {
  const [mode, setMode] = useState<ThemeMode>(defaultTheme);

  useEffect(() => {
    const resolved = mode === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : mode;

    const baseTokens = resolved === 'dark' ? darkTheme : lightTheme;
    const tokens = brandOverrides ? { ...baseTokens, ...brandOverrides } : baseTokens;
    applyTheme(tokens);

    document.documentElement.setAttribute('data-theme', resolved);
  }, [mode, brandOverrides]);

  // Expose theme setter via a global context (simplified here)
  useEffect(() => {
    (window as any).__flexcms_setTheme = setMode;
  }, []);

  return <>{children}</>;
}


/**
 * FlexCMS Selenium E2E — root configuration constants re-exported for
 * consumers outside `src/` (e.g. future CI scripts). Prefer importing
 * `src/driver/env.ts` directly from within the package.
 */
export { loadEnv } from './src/driver/env';
export type { SeleniumEnv } from './src/driver/env';


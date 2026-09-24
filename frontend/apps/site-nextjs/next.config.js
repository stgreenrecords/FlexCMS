const { assetRewrites } = require('./apiBases');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Transpile @flexcms/* packages so Next.js processes their JSX
  transpilePackages: ['@flexcms/sdk', '@flexcms/react', '@flexcms/site-renderers'],
  experimental: {
    workerThreads: true,
    webpackBuildWorker: false,
  },
  // Lets a second instance (e.g. live pages backed by the publish tier) run from the
  // same directory without both dev servers writing to `.next`.
  distDir: process.env.NEXT_DIST_DIR || '.next',
  // Standalone output for Docker (produces self-contained server.js)
  // Disabled on Windows local dev because symlink creation requires elevated permissions.
  ...(process.env.STANDALONE === '1' ? { output: 'standalone' } : {}),
  // DAM asset URLs are relative; proxy them to the tier each route reads from.
  async rewrites() {
    return assetRewrites();
  },
};

module.exports = nextConfig;

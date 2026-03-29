/** @type {import('next').NextConfig} */
const nextConfig = {
  // Transpile @flexcms/ui and adapter packages so Next.js processes their JSX
  transpilePackages: ['@flexcms/ui', '@flexcms/react', '@flexcms/sdk'],
  experimental: {
    workerThreads: true,
    webpackBuildWorker: false,
  },
  // Standalone output for Docker (produces self-contained server.js)
  // Disabled on Windows local dev because symlink creation requires elevated permissions.
  ...(process.env.STANDALONE === '1' ? { output: 'standalone' } : {}),
};

module.exports = nextConfig;


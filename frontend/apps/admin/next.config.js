/** @type {import('next').NextConfig} */
const nextConfig = {
  // Transpile @flexcms/ui and adapter packages so Next.js processes their JSX
  transpilePackages: ['@flexcms/ui', '@flexcms/react', '@flexcms/sdk'],
  // Standalone output for Docker (produces self-contained server.js)
  output: 'standalone',
};

module.exports = nextConfig;


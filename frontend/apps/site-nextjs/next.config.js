/** @type {import('next').NextConfig} */
const nextConfig = {
  // Transpile @flexcms/* packages so Next.js processes their JSX
  transpilePackages: ['@flexcms/sdk', '@flexcms/react'],
};

module.exports = nextConfig;


/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow images from local FlexCMS DAM proxy
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost', port: '8080' },
      { protocol: 'http', hostname: 'localhost', port: '8081' },
    ],
  },
};

module.exports = nextConfig;

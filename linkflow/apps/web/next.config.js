/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost', 'avatars.githubusercontent.com'],
    unoptimized: true,
  },
  // Allow importing from packages/ workspace
  transpilePackages: ['@linkflow/types'],
};

module.exports = nextConfig;

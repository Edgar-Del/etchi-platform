/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // React 19 e Next.js 16 - configurações otimizadas
  experimental: {
    // Next.js 16 features
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/:path*`,
      },
    ]
  },
}

module.exports = nextConfig


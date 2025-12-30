/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['workflow-builder'],
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8000/api/:path*',
      },
    ];
  },
};

export default nextConfig;

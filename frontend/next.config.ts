import type { NextConfig } from "next";

const nextConfig: any = {
  allowedDevOrigins: ["192.168.1.4", "localhost:3000"],
  async redirects() {
    return [
      {
        source: '/',
        destination: '/login',
        permanent: false,
      },
    ]
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3001/:path*', // Proxy to Backend
      },
    ]
  },
};

export default nextConfig;

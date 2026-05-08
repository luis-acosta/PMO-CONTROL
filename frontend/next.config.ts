import type { NextConfig } from "next";

const nextConfig: any = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  allowedDevOrigins: ["192.168.1.4", "localhost:3000"],
};

export default nextConfig;

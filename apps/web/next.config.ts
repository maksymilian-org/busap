import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@busap/shared'],
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
};

export default nextConfig;

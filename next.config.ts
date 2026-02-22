import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: '**.otomoto.pl' },
      { protocol: 'https', hostname: '**.autovit.ro' },
      { protocol: 'https', hostname: '**.olxcdn.com' },
      { protocol: 'https', hostname: '**.mobile.bg' },
      { protocol: 'https', hostname: '**.focus.bg' },
      { protocol: 'https', hostname: '**.999.md' },
      { protocol: 'https', hostname: '**.licdn.com' },
    ],
  },
};

export default nextConfig;

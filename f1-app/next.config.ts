import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Monorepo: repo root has its own package-lock.json; keep Turbopack scoped to this app
  // so we do not compile stray files (e.g. legacy proxy) from the parent directory.
  turbopack: {
    root: process.cwd(),
  },
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
        ],
      },
    ];
  },
};

export default nextConfig;

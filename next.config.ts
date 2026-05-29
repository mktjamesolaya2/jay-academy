import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  experimental: {
    serverActions: {
      bodySizeLimit: "15mb",
    },
  },
  async rewrites() {
    return [
      { source: "/magicshadow", destination: "/magicshadow/index.html" },
      { source: "/pmuclass", destination: "/pmuclass/index.html" },
      { source: "/laser", destination: "/laser/index.html" },
    ];
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  experimental: {
    serverActions: {
      bodySizeLimit: "15mb",
    },
  },
  async redirects() {
    return [
      { source: "/magicshadow", destination: "/magicshadow/", permanent: false },
      { source: "/pmuclass", destination: "/pmuclass/", permanent: false },
      { source: "/laser", destination: "/laser/", permanent: false },
    ];
  },
  async rewrites() {
    return [
      { source: "/magicshadow/", destination: "/magicshadow/index.html" },
      { source: "/pmuclass/", destination: "/pmuclass/index.html" },
      { source: "/laser/", destination: "/laser/index.html" },
    ];
  },
};

export default nextConfig;

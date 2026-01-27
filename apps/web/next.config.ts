import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
    instrumentationHook: true, // Enable instrumentation for env validation
  },
};

export default nextConfig;

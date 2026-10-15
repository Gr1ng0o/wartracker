import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep production builds within small CI/hosting memory limits.
  experimental: { cpus: 2 },
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Saving sends the undo history too (up to ~100 copies of the CV).
  experimental: { serverActions: { bodySizeLimit: "5mb" } },
};

export default nextConfig;

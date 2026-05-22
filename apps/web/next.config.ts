import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.1.11"],
  transpilePackages: ["@mewri/core", "@mewri/data"]
};

export default nextConfig;


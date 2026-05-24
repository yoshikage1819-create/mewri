import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["localhost", "127.0.0.1", "192.168.1.11"],
  transpilePackages: ["@mewri/core", "@mewri/data"]
};

export default nextConfig;


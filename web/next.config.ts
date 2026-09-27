import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pg", "pg-native"],
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;

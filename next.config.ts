import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Les fichiers CSV d'élèves (≈ 500 lignes) passent largement sous cette limite.
  experimental: { serverActions: { bodySizeLimit: "2mb" } },
};

export default nextConfig;

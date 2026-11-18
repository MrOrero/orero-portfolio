import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    // AVIF first (smallest), WebP as the fallback.
    formats: ["image/avif", "image/webp"],
    // 75 for thumbnails, 90 for the large project view (see optSet in src/lib/intro-key.ts).
    qualities: [75, 90],
    // Project screenshots never change under the same name; let browsers keep them for a month.
    minimumCacheTTL: 2678400,
  },
};

export default nextConfig;

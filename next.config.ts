import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    remotePatterns: [
      // Mock data placeholders (lib/mock). Remove once real images are in Supabase Storage.
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "fastly.picsum.photos" },
      // Supabase Storage public buckets.
      { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" },
    ],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;

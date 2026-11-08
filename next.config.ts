import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  experimental: {
    // /join/apply uploads a resume of up to 5MB through a server action (default limit 1MB), plus the form's overhead.
    serverActions: { bodySizeLimit: "6mb" },
  },
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

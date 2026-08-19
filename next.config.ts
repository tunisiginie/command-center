import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Tile images live in Supabase Storage — allow any project's public bucket
    // without hardcoding a project ref here.
    remotePatterns: [{ protocol: "https", hostname: "**.supabase.co" }],
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @sqp/shared ships as raw TS (workspace exports point at src) — transpile it.
  transpilePackages: ["@sqp/shared"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.pravatar.cc",
      },
      {
        protocol: "https",
        hostname: "ui.shadcn.com",
      },
    ],
  },
};

export default nextConfig;

// Make Cloudflare bindings (DB, etc.) available via getCloudflareContext() in
// `next dev`. Wrapped so a dev-only import never affects production builds.
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
void initOpenNextCloudflareForDev();

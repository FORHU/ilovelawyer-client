import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    // The (app) shell intentionally renders nothing until the persisted client
    // store has hydrated, so implicit instant-navigation validation would flag
    // every page under it as "dropped". Only validate segments that opt in.
    instantInsights: { validationLevel: "manual-warning" },
  },
  // The old onboarding flow lived under /auth; keep bookmarks and stale tabs working.
  async redirects() {
    return [{ source: "/auth/:path*", destination: "/login", permanent: false }];
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

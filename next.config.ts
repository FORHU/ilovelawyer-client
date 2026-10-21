import type { NextConfig } from "next";
import { API_URL, COOKIE_PATHS } from "./src/lib/api/config";

const nextConfig: NextConfig = {
  /* config options here */
  // Dev only: Next blocks /_next/* (the JS bundles) from any host but localhost unless it is
  // listed, so on ilovelawyer.local the page rendered but never hydrated.
  allowedDevOrigins: ["ilovelawyer.local", "app.ilovelawyer.local"],
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
  // The auth calls that set or read the refresh cookie go through this origin, so the cookie is
  // the client's own (see COOKIE_PATHS). Every other API call goes to API_URL directly.
  async rewrites() {
    return COOKIE_PATHS.map((path) => ({ source: path, destination: `${API_URL}${path}` }));
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

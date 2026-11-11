import fs from "node:fs";
import path from "node:path";
import type { NextConfig } from "next";
import { COOKIE_PATHS } from "./src/lib/api/config";

// next build doesn't auto-load .env.staging (only recognizes standard names), so load it
// explicitly — it's the one file deploy-dev.yml writes NEXT_PUBLIC_* into from the `staging`
// secrets, as ilovelawyer-app does. Absent locally, where .env.local applies.
const stagingEnvPath = path.join(import.meta.dirname, ".env.staging");
if (fs.existsSync(stagingEnvPath)) {
  process.loadEnvFile(stagingEnvPath);
}

// Read here, after the file above, rather than imported with COOKIE_PATHS: config.ts reads it as
// it's imported, and imports run before this file's own code, so its API_URL would miss the file.
const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001").replace(/\/$/, "");

const nextConfig: NextConfig = {
  /* config options here */
  // Hosts other than localhost that open the dev server (ilovelawyer.local, or the https
  // client-local.ilovelawyer.com that Google sign-in accepts, both from the hosts
  // file). Without this Next blocks their /_next/hmr connection. Dev only; ignored in production.
  allowedDevOrigins: ["ilovelawyer.local", "client-local.ilovelawyer.com"],
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

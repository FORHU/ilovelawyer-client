"use client";

import { GoogleOAuthProvider } from "@react-oauth/google";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ApiError } from "@/lib/api/fetch";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5,
        // A 4xx is the API's answer (bad token, not found, refused): asking again won't change it.
        // Retry once only for a network error or a 5xx.
        retry: (failureCount, error) =>
          failureCount < 1 && !(error instanceof ApiError && error.status >= 400 && error.status < 500),
      },
      mutations: {
        throwOnError: false,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

// One client per browser tab; a fresh one per server render so requests never share a cache.
function getQueryClient() {
  if (typeof window === "undefined") return makeQueryClient();
  browserQueryClient ??= makeQueryClient();
  return browserQueryClient;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? ""}>
      <QueryClientProvider client={getQueryClient()}>
        {children}
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </GoogleOAuthProvider>
  );
}

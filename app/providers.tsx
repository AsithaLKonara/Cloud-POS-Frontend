"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import api from "@/services/api";

import { useAuthStore } from "@/store/auth.store";

/**
 * Prefetches the CSRF token from the backend on app mount.
 * This triggers the server to set the `laural_csrf` cookie, which the
 * API interceptor in services/api.ts then reads and attaches as x-csrf-token
 * on all state-changing requests (POST, PUT, PATCH, DELETE).
 *
 * Without this, the very first mutation on a fresh browser session would fail
 * with a 403 CSRF error because the cookie doesn't exist yet.
 */
function CsrfInitializer() {
  useEffect(() => {
    // Silently fetch CSRF token — the response sets the laural_csrf cookie
    api.get("/auth/csrf").catch(() => {
      // Ignore errors — the cookie will be set on the next successful request
    });
  }, []);

  return null;
}

function AuthInitializer() {
  useEffect(() => {
    if (typeof window !== "undefined") {
      const path = window.location.pathname;
      if (path === "/login" || path === "/register") {
        useAuthStore.setState({ isLoading: false });
        return;
      }
    }
    useAuthStore.getState().initAuth();
  }, []);

  return null;
}

import { ThemeProvider } from "@/components/theme/ThemeProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            gcTime: 5 * 60 * 1000, // 5 minutes
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <CsrfInitializer />
        <AuthInitializer />
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  );
}


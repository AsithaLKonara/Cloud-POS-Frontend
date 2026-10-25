import axios from "axios";

// Use relative URL for client-side to go through Next.js proxy, absolute for server-side
const isServer = typeof window === 'undefined';
const baseURL = isServer 
  ? (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000/api/v1") 
  : "/api/v1";

export const api = axios.create({
  baseURL,
  timeout: 30000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Helper to read a cookie value by name (browser-only)
function getCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split("=")[1]) : undefined;
}

// In cross-domain deployments, JS cannot read the API's cookies via document.cookie
// We store the token in memory when it is returned by GET /auth/csrf
let csrfTokenMemory: string | null = null;

const STATE_MUTATING_METHODS = ["POST", "PUT", "PATCH", "DELETE"];

// Request interceptor: attach CSRF token to all state-changing requests
api.interceptors.request.use(
  (config) => {
    const method = (config.method || "").toUpperCase();

    if (STATE_MUTATING_METHODS.includes(method)) {
      const csrfToken = csrfTokenMemory || getCookie("laural_csrf");
      if (csrfToken) {
        config.headers["x-csrf-token"] = csrfToken;
      }
      // Note: if no CSRF cookie yet, CsrfInitializer in providers.tsx
      // will have already triggered the GET /auth/csrf to set it.
      // On the very first request before that completes, it may be absent —
      // the response interceptor handles the retry below.
    }

    // Attach multi-tenant header if active
    if (typeof window !== "undefined") {
      const activeTenant = localStorage.getItem("laural_tenant_id") || localStorage.getItem("active_tenant_id");
      const activeTenantSlug = localStorage.getItem("laural_tenant_slug") || localStorage.getItem("active_tenant_slug");
      if (activeTenant && !config.headers["x-tenant-id"]) {
        config.headers["x-tenant-id"] = activeTenant;
      }
      if (activeTenantSlug && !config.headers["x-tenant-slug"]) {
        config.headers["x-tenant-slug"] = activeTenantSlug;
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: handle 401s and CSRF retry on 403
api.interceptors.response.use(
  (response) => {
    // Automatically capture the CSRF token from the payload when fetching /auth/csrf
    if (response.config.url?.endsWith("/auth/csrf") && response.data?.data?.csrfToken) {
      csrfTokenMemory = response.data.data.csrfToken;
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // CSRF token missing/stale — fetch a fresh one and retry ONCE
    if (
      error.response?.status === 403 &&
      error.response?.data?.error?.includes("CSRF") &&
      !originalRequest._csrfRetry
    ) {
      originalRequest._csrfRetry = true;
      try {
        // This GET will cause the backend to set a fresh seramaaduwen_csrf cookie
        await api.get("/auth/csrf");
        // Re-attach the new token and retry
        const freshToken = csrfTokenMemory || getCookie("laural_csrf");
        if (freshToken) {
          originalRequest.headers["x-csrf-token"] = freshToken;
        }
        return api(originalRequest);
      } catch {
        // If CSRF fetch also fails, fall through to normal error handling
      }
    }

    // 401 — session expired or token invalid
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        // Clear tokens from localStorage
        localStorage.removeItem("laural_user");
        
        // Clear Next.js middleware cookies
        document.cookie = "laural_access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
        document.cookie = "laural_refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
        document.cookie = "laural_role=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
        
        const currentPath = window.location.pathname;
        const reqUrl = error.config?.url || "";
        const isAuthEndpoint = reqUrl.includes("/auth/me") || reqUrl.includes("/auth/login") || reqUrl.includes("/auth/refresh");

        // Only trigger an active redirect if user is on a protected route (not on /login, /register, etc.)
        if (currentPath !== "/login" && currentPath !== "/register" && !isAuthEndpoint) {
          import("@/store/auth.store").then(({ useAuthStore }) => {
            useAuthStore.getState().logout("/login");
          });
        } else {
          // Silently mark store as logged out without redirecting or looping
          import("@/store/auth.store").then(({ useAuthStore }) => {
            useAuthStore.setState({ user: null, isAuthenticated: false, isLoading: false });
          });
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;

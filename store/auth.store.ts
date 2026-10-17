"use client";

import { create } from "zustand";
import authService, { UserProfile, RegisterPayload, LoginPayload, AuthResponse } from "@/services/auth.service";

interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  setAuth: (user: UserProfile) => void;
  login: (payload: LoginPayload) => Promise<AuthResponse>;
  register: (payload: RegisterPayload) => Promise<AuthResponse>;
  logout: (redirectTo?: string) => Promise<void>;
  initAuth: () => Promise<void>;

  // RBAC Helpers
  hasPermission: (permissionCode: string) => boolean;
  hasRole: (roleName: string) => boolean;
  isAdmin: () => boolean;
  isSuperAdmin: () => boolean;
  isPublicUser: () => boolean;
}

const USER_KEY = "laural_user";

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setAuth: (user: UserProfile) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    }

    set({
      user,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  login: async (payload: LoginPayload) => {
    set({ isLoading: true });
    try {
      const data = await authService.login(payload);
      get().setAuth(data.user);
      return data;
    } finally {
      set({ isLoading: false });
    }
  },

  register: async (payload: RegisterPayload) => {
    set({ isLoading: true });
    try {
      const data = await authService.register(payload);
      get().setAuth(data.user);
      return data;
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async (redirectTo?: string) => {
    try {
      // 1. Clear Next.js server cookies via local route handler (fire-and-forget)
      fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
      // 2. Clear backend express cookies & refresh token
      await authService.logout().catch(() => {});
    } catch {
      // Ignore
    } finally {
      if (typeof window !== "undefined") {
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem("laural_user");
        localStorage.removeItem("laural_tenant_id");
        localStorage.removeItem("laural_tenant_slug");
        localStorage.removeItem("active_tenant_id");
        localStorage.removeItem("active_tenant_slug");

        // Clear all possible cookies in client
        document.cookie = "laural_access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
        document.cookie = "laural_refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
        document.cookie = "laural_role=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
      }

      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });

      // ONLY navigate if a destination is requested AND we are not already on that destination
      if (redirectTo && typeof window !== "undefined") {
        const currentPath = window.location.pathname;
        if (currentPath !== redirectTo) {
          window.location.replace(redirectTo);
        }
      }
    }
  },

  initAuth: async () => {
    if (typeof window === "undefined") {
      set({ isLoading: false });
      return;
    }

    // If user is already on /login or /register, do not attempt background token validation
    if (window.location.pathname === "/login" || window.location.pathname === "/register") {
      set({ isLoading: false });
      return;
    }

    try {
      const userJson = localStorage.getItem(USER_KEY);

      let cachedUser: UserProfile | null = null;
      if (userJson) {
        try {
          cachedUser = JSON.parse(userJson);
        } catch {
          // Ignore
        }
      }

      if (cachedUser) {
        set({
          user: cachedUser,
          isAuthenticated: true,
          isLoading: false,
        });
      }

      // Silently refresh profile in background using HttpOnly cookies
      try {
        const freshUser = await authService.getMe();
        if (freshUser) {
          localStorage.setItem(USER_KEY, JSON.stringify(freshUser));
          set({ user: freshUser, isAuthenticated: true, isLoading: false });
        }
      } catch (err: any) {
        if (err.response?.status === 401 && cachedUser) {
          try {
            const refreshed = await authService.refresh();
            get().setAuth(refreshed.user);
          } catch {
            set({ user: null, isAuthenticated: false, isLoading: false });
          }
        } else {
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      }
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    } finally {
      set({ isLoading: false });
    }
  },

  hasPermission: (permissionCode: string) => {
    const { user } = get();
    if (!user) return false;

    // Super Admin / Admin has all permissions
    const isSuper = user.roles?.some((r) => {
      const norm = r.toUpperCase().replace(/[\s_]/g, "");
      return norm === "SUPERADMIN" || norm === "ADMIN" || norm === "SYSTEMOWNER";
    });
    if (isSuper) return true;

    return user.permissions?.includes(permissionCode) ?? false;
  },

  hasRole: (roleName: string) => {
    const { user } = get();
    if (!user || !user.roles) return false;

    const targetNorm = roleName.toUpperCase().replace(/[\s_]/g, "");
    return user.roles.some((r) => r.toUpperCase().replace(/[\s_]/g, "") === targetNorm);
  },

  isAdmin: () => {
    const { user } = get();
    if (!user || !user.roles) return false;

    const nonAdminRoles = new Set(["PUBLIC_USER", "public user", "CUSTOMER", "customer"]);
    return user.roles.some((r) => !nonAdminRoles.has(r));
  },

  isSuperAdmin: () => {
    const { user } = get();
    if (!user || !user.roles) return false;

    return user.roles.some((r) => {
      const norm = r.toUpperCase().replace(/[\s_]/g, "");
      return norm === "SUPERADMIN" || norm === "SYSTEMOWNER";
    });
  },

  isPublicUser: () => {
    const { user } = get();
    if (!user || !user.roles) return true;
    return user.roles.length === 1 && (user.roles[0] === "PUBLIC_USER" || user.roles[0] === "Public User");
  },
}));

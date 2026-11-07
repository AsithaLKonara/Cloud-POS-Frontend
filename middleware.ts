import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function decodeJwt(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (error) {
    return null;
  }
}

function extractSubdomain(hostHeader: string | null): string | null {
  if (!hostHeader) return null;
  const host = hostHeader.split(':')[0].toLowerCase();
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(host)) return null;
  if (host === 'localhost') return null;

  const parts = host.split('.');
  if (parts.length >= 2 && parts[parts.length - 1] === 'localhost') {
    return parts[0];
  }
  if (parts.length >= 3) {
    const reserved = ['www', 'app', 'api', 'admin', 'pos', 'platform'];
    if (!reserved.includes(parts[0])) {
      return parts[0];
    }
  }
  return null;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get("host");
  const tenantSlug = extractSubdomain(host);

  const requestHeaders = new Headers(request.headers);
  if (tenantSlug) {
    requestHeaders.set("x-tenant-slug", tenantSlug);
  }
  
  const token = request.cookies.get("laural_access_token")?.value;
  let roles: string[] = [];
  let isExpired = false;

  if (token) {
    const payload = decodeJwt(token);
    if (payload) {
      if (payload.exp && Date.now() >= payload.exp * 1000) {
        isExpired = true;
      } else if (payload.roles && Array.isArray(payload.roles)) {
        roles = payload.roles.map((r: string) => r.toUpperCase().replace(/[\s_]/g, ""));
      }
    }
  }

  const isAuthRoute = pathname === "/login";
  const isProtectedRoute = pathname.startsWith("/admin") || pathname.startsWith("/branch-admin") || pathname.startsWith("/pos") || pathname.startsWith("/superadmin");

  // 1. Unauthenticated or expired user accessing protected routes
  if (isProtectedRoute) {
    if (!token || isExpired) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      const response = NextResponse.redirect(loginUrl);
      if (isExpired) {
        response.cookies.delete("laural_access_token");
        response.cookies.delete("laural_refresh_token");
      }
      return response;
    }

    // Role-based route guard
    const isCashier = roles.includes("CASHIER") || roles.includes("POSOPERATOR");
    const isAdmin = roles.includes("SUPERADMIN") || roles.includes("ADMIN") || roles.includes("TENANTADMIN") || roles.includes("SYSTEMOWNER");
    const isBranchManager = (roles.includes("BRANCHMANAGER") || roles.includes("BRANCHADMIN")) && !isAdmin;

    // Cashiers attempting to access Admin dashboard get redirected to POS
    if (isCashier && !isAdmin && (pathname.startsWith("/admin") || pathname.startsWith("/superadmin"))) {
      return NextResponse.redirect(new URL("/pos", request.url));
    }
  }

  // 2. Authenticated user visiting /login
  if (isAuthRoute && token && !isExpired) {
    const isSuperAdmin = roles.includes("SUPERADMIN") || roles.includes("SYSTEMOWNER");
    const isAdmin = roles.includes("ADMIN") || roles.includes("TENANTADMIN");
    const isCashier = roles.includes("CASHIER") || roles.includes("POSOPERATOR");
    const isBranchManager = (roles.includes("BRANCHMANAGER") || roles.includes("BRANCHADMIN")) && !isAdmin && !isSuperAdmin;
    const redirectTarget = isSuperAdmin ? "/superadmin" : isAdmin ? "/admin" : isBranchManager ? "/branch-admin" : isCashier ? "/pos" : "/admin";
    return NextResponse.redirect(new URL(redirectTarget, request.url));
  }

  const res = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  if (tenantSlug) {
    res.cookies.set("x_tenant_slug", tenantSlug, { path: "/", httpOnly: false, sameSite: "lax" });
  }

  return res;
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/branch-admin/:path*",
    "/pos/:path*",
    "/superadmin/:path*",
    "/superadmin",
    "/login",
  ],
};

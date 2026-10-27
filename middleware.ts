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

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
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

  return NextResponse.next();
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

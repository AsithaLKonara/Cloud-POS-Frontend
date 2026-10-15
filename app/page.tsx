import { redirect } from "next/navigation";
import { cookies } from "next/headers";

function decodeJwt(token: string) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export default async function RootPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("laural_access_token")?.value;

  if (!token) {
    redirect("/login");
  }

  const payload = decodeJwt(token);
  if (!payload || (payload.exp && Date.now() >= payload.exp * 1000)) {
    redirect("/login");
  }

  const rawRoles: string[] = payload.roles || [];
  const roles = rawRoles.map((r) => r.toUpperCase());

  if (roles.includes("CASHIER") || roles.includes("POS_OPERATOR")) {
    redirect("/pos");
  } else if (roles.includes("BRANCH_MANAGER")) {
    redirect("/branch-admin");
  } else {
    redirect("/admin");
  }
}

import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("laural_access_token");
    cookieStore.delete("laural_refresh_token");
    cookieStore.delete("laural_role");

    const response = NextResponse.json({ success: true, message: "Logged out" });
    response.cookies.set("laural_access_token", "", { path: "/", expires: new Date(0) });
    response.cookies.set("laural_refresh_token", "", { path: "/", expires: new Date(0) });
    response.cookies.set("laural_role", "", { path: "/", expires: new Date(0) });
    return response;
  } catch (error) {
    return NextResponse.json({ success: true });
  }
}

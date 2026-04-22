import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { createRequestUrl } from "@/lib/request-url";

const PUBLIC_PATHS = ["/login", "/api/auth/login"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    PUBLIC_PATHS.some((path) => pathname.startsWith(path)) ||
    pathname.startsWith("/_next") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const userId = request.cookies.get("pedido-poc-user")?.value;

  if (!userId) {
    return NextResponse.redirect(createRequestUrl(request, "/login"));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

import { NextResponse } from "next/server";

import { clearSessionCookie } from "@/lib/auth";
import { createRequestUrl } from "@/lib/request-url";

export async function POST(request: Request) {
  clearSessionCookie();
  return NextResponse.redirect(createRequestUrl(request, "/login"));
}

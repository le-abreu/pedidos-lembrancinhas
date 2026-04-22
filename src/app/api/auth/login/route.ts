import { NextResponse } from "next/server";

import { setSessionCookie } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createRequestUrl } from "@/lib/request-url";

export async function POST(request: Request) {
  const formData = await request.formData();
  const email = formData.get("email")?.toString() ?? "";
  const password = formData.get("password")?.toString() ?? "";

  const user = await prisma.user.findFirst({
    where: {
      email,
      password,
      active: true,
    },
  });

  if (!user) {
    return NextResponse.redirect(createRequestUrl(request, "/login?error=1"));
  }

  setSessionCookie(user.id);

  return NextResponse.redirect(createRequestUrl(request, "/"));
}

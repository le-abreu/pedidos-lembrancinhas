import { NextResponse } from "next/server";

import { setSessionCookie } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
    return NextResponse.redirect(new URL("/login?error=1", request.url));
  }

  setSessionCookie(user.id);

  return NextResponse.redirect(new URL("/", request.url));
}


import { NextResponse } from "next/server";

import { setSessionCookie } from "@/lib/auth";
import { hashPassword, isPasswordHashed, verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { createRequestUrl } from "@/lib/request-url";

export async function POST(request: Request) {
  const formData = await request.formData();
  const email = formData.get("email")?.toString() ?? "";
  const password = formData.get("password")?.toString() ?? "";

  const user = await prisma.user.findFirst({
    where: {
      email,
      active: true,
    },
  });

  if (!user || !verifyPassword(password, user.password)) {
    return NextResponse.redirect(createRequestUrl(request, "/login?error=1"));
  }

  if (!isPasswordHashed(user.password)) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashPassword(password),
      },
    });
  }

  setSessionCookie(user.id);

  return NextResponse.redirect(createRequestUrl(request, "/"));
}

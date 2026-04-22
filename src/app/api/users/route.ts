import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET() {
  const users = await prisma.user.findMany({
    orderBy: { name: "asc" },
    include: {
      profiles: true,
      company: true,
      customer: true,
      supplier: true,
    },
  });
  return NextResponse.json(users);
}

export async function POST(request: Request) {
  const body = await request.json();
  const user = await prisma.user.create({
    data: {
      name: body.name,
      email: body.email,
      password: body.password,
      active: body.active ?? true,
      companyId: body.companyId ?? null,
      customerId: body.customerId ?? null,
      supplierId: body.supplierId ?? null,
      profiles: {
        createMany: {
          data: (body.profiles ?? []).map((profile: string) => ({ profile })),
        },
      },
    },
    include: { profiles: true },
  });

  return NextResponse.json(user, { status: 201 });
}


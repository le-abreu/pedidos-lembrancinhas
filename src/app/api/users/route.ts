import { NextResponse } from "next/server";

import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { replaceUserCustomerAccesses, replaceUserSupplierAccesses } from "@/server/services/user-access-service";

export async function GET() {
  const users = await (prisma.user as any).findMany({
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
  const user = await (prisma.user as any).create({
    data: {
      name: body.name,
      email: body.email,
      password: hashPassword(body.password),
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

  await replaceUserCustomerAccesses(user.id, body.customerAccessIds ?? []);
  await replaceUserSupplierAccesses(user.id, body.supplierAccesses ?? []);

  return NextResponse.json(user, { status: 201 });
}

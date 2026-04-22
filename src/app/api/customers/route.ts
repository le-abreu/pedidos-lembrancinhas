import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET() {
  const customers = await prisma.customer.findMany({
    orderBy: { name: "asc" },
    include: { company: true },
  });
  return NextResponse.json(customers);
}

export async function POST(request: Request) {
  const body = await request.json();
  const customer = await prisma.customer.create({
    data: {
      companyId: body.companyId,
      name: body.name,
      document: body.document ?? null,
      email: body.email ?? null,
      phone: body.phone ?? null,
      notes: body.notes ?? null,
      active: body.active ?? true,
    },
  });

  return NextResponse.json(customer, { status: 201 });
}


import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET() {
  const suppliers = await prisma.supplier.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(suppliers);
}

export async function POST(request: Request) {
  const body = await request.json();
  const supplier = await prisma.supplier.create({
    data: {
      name: body.name,
      document: body.document ?? null,
      email: body.email ?? null,
      phone: body.phone ?? null,
      notes: body.notes ?? null,
      type: body.type,
      active: body.active ?? true,
    },
  });

  return NextResponse.json(supplier, { status: 201 });
}


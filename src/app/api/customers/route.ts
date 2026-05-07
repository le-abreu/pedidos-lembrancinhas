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
  const customer = await (prisma as any).customer.create({
    data: {
      companyId: body.companyId,
      name: body.name,
      document: body.document ?? null,
      email: body.email ?? null,
      phone: body.phone ?? null,
      addressZipCode: body.addressZipCode ?? null,
      addressStreet: body.addressStreet ?? null,
      addressNumber: body.addressNumber ?? null,
      addressComplement: body.addressComplement ?? null,
      addressNeighborhood: body.addressNeighborhood ?? null,
      addressCity: body.addressCity ?? null,
      addressState: body.addressState ?? null,
      addressReference: body.addressReference ?? null,
      notes: body.notes ?? null,
      active: body.active ?? true,
    },
  });

  return NextResponse.json(customer, { status: 201 });
}

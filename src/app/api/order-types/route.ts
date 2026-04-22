import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET() {
  const orderTypes = await prisma.orderType.findMany({
    orderBy: { name: "asc" },
    include: { products: true, workflow: true },
  });
  return NextResponse.json(orderTypes);
}

export async function POST(request: Request) {
  const body = await request.json();
  const orderType = await prisma.orderType.create({
    data: {
      name: body.name,
      description: body.description ?? null,
      active: body.active ?? true,
    },
  });

  return NextResponse.json(orderType, { status: 201 });
}


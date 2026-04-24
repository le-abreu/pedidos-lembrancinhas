import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET() {
  const statuses = await prisma.orderStatus.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(statuses);
}

export async function POST(request: Request) {
  const body = await request.json();
  const status = await prisma.orderStatus.create({
    data: {
      name: body.name,
      description: body.description ?? null,
      color: body.color,
      active: body.active ?? true,
    },
  });

  return NextResponse.json(status, { status: 201 });
}


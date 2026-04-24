import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET() {
  const workflows = await prisma.workflow.findMany({
    orderBy: { name: "asc" },
    include: {
      orderType: true,
      phases: {
        orderBy: { order: "asc" },
        include: { targetStatus: true },
      },
    },
  });
  return NextResponse.json(workflows);
}

export async function POST(request: Request) {
  const body = await request.json();
  const workflow = await prisma.workflow.create({
    data: {
      orderTypeId: body.orderTypeId,
      name: body.name,
      description: body.description ?? null,
      active: body.active ?? true,
    },
  });

  return NextResponse.json(workflow, { status: 201 });
}


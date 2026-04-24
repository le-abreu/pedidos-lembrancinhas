import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: {
    id: string;
  };
};

export async function GET(_: Request, { params }: RouteContext) {
  const phases = await prisma.orderPhaseExecution.findMany({
    where: { orderId: params.id },
    orderBy: { phase: { order: "asc" } },
    include: {
      phase: true,
      supplier: true,
      executedByUser: true,
    },
  });

  return NextResponse.json(phases);
}


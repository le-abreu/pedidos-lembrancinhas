import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getOrderIndexData } from "@/server/services/order-service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const adminUser = await prisma.user.findFirst({
    where: {
      profiles: {
        some: {
          profile: "ADMIN",
        },
      },
    },
    include: { profiles: true },
  });

  if (!adminUser) {
    return NextResponse.json([], { status: 200 });
  }

  const result = await getOrderIndexData(
    {
      page: Number(searchParams.get("page") ?? "1"),
      companyId: searchParams.get("companyId") ?? undefined,
      customerId: searchParams.get("customerId") ?? undefined,
      orderTypeId: searchParams.get("orderTypeId") ?? undefined,
      statusId: searchParams.get("statusId") ?? undefined,
      supplierId: searchParams.get("supplierId") ?? undefined,
      responsibleUserId: searchParams.get("responsibleUserId") ?? undefined,
      requestedFrom: searchParams.get("requestedFrom") ?? undefined,
      requestedTo: searchParams.get("requestedTo") ?? undefined,
      search: searchParams.get("search") ?? undefined,
    },
    adminUser,
  );

  return NextResponse.json(result.orders);
}

export async function POST(request: Request) {
  const body = await request.json();
  const workflow = await prisma.workflow.findUnique({
    where: { orderTypeId: body.orderTypeId },
  });

  if (!workflow) {
    return NextResponse.json(
      { message: "Tipo de pedido sem workflow configurado." },
      { status: 400 },
    );
  }

  const order = await prisma.order.create({
    data: {
      companyId: body.companyId,
      customerId: body.customerId,
      orderTypeId: body.orderTypeId,
      workflowId: workflow.id,
      currentStatusId: body.currentStatusId,
      createdById: body.createdById,
      shippingMethodId: body.shippingMethodId,
      requestedQuantity: body.requestedQuantity ?? 1,
      shippingPrice: body.shippingPrice ?? 0,
      deliveryAddress: body.deliveryAddress ?? null,
      title: body.title,
      description: body.description ?? null,
      requestedAt: new Date(body.requestedAt),
      expectedAt: body.expectedAt ? new Date(body.expectedAt) : null,
      notes: body.notes ?? null,
      active: body.active ?? true,
    },
  });

  return NextResponse.json(order, { status: 201 });
}

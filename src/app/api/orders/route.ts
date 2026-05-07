import { NextResponse } from "next/server";

import {
  calculateFreight,
  formatFreightAddress,
  hasMinimumFreightAddress,
} from "@/lib/freight-calculator";
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
  const [workflow, shippingMethod] = await Promise.all([
    prisma.workflow.findUnique({
      where: { orderTypeId: body.orderTypeId },
    }),
    (prisma as any).shippingMethod.findUnique({
      where: { id: body.shippingMethodId },
      select: { id: true, name: true, calculationType: true, fixedPrice: true },
    }),
  ]);

  if (!workflow) {
    return NextResponse.json(
      { message: "Tipo de pedido sem workflow configurado." },
      { status: 400 },
    );
  }

  if (!shippingMethod) {
    return NextResponse.json({ message: "Tipo de frete não encontrado." }, { status: 400 });
  }

  const freightAddress = {
    zipCode: body.deliveryZipCode ?? null,
    street: body.deliveryStreet ?? null,
    number: body.deliveryNumber ?? null,
    complement: body.deliveryComplement ?? null,
    neighborhood: body.deliveryNeighborhood ?? null,
    city: body.deliveryCity ?? null,
    state: body.deliveryState ?? null,
    reference: body.deliveryReference ?? null,
  };
  const freight = calculateFreight({ shippingMethod, address: freightAddress });

  if (freight.requiresAddress && !hasMinimumFreightAddress(freightAddress)) {
    return NextResponse.json(
      { message: "Informe CEP, logradouro, número, bairro, cidade e estado para calcular o frete." },
      { status: 400 },
    );
  }

  const itemsSubtotal = Number(body.itemsSubtotal ?? 0);
  const additionalChargeAmount = Number(body.additionalChargeAmount ?? 0);

  const order = await (prisma as any).order.create({
    data: {
      companyId: body.companyId,
      customerId: body.customerId,
      orderTypeId: body.orderTypeId,
      workflowId: workflow.id,
      currentStatusId: body.currentStatusId,
      createdById: body.createdById,
      shippingMethodId: body.shippingMethodId,
      requestedQuantity: body.requestedQuantity ?? 1,
      shippingPrice: freight.amount,
      itemsSubtotal,
      finalTotal: itemsSubtotal + freight.amount + additionalChargeAmount,
      additionalChargeAmount,
      additionalChargeReason: body.additionalChargeReason ?? null,
      deliveryAddress: formatFreightAddress(freightAddress) || null,
      deliveryZipCode: freightAddress.zipCode,
      deliveryStreet: freightAddress.street,
      deliveryNumber: freightAddress.number,
      deliveryComplement: freightAddress.complement,
      deliveryNeighborhood: freightAddress.neighborhood,
      deliveryCity: freightAddress.city,
      deliveryState: freightAddress.state,
      deliveryReference: freightAddress.reference,
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

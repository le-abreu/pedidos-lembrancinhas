import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { isUploadFile, uploadAndAttachFile } from "@/server/services/file-storage-service";

type RouteContext = {
  params: {
    id: string;
  };
};

export async function GET(_: Request, { params }: RouteContext) {
  const invoices = await prisma.invoice.findMany({
    where: { orderId: params.id },
    orderBy: { issuedAt: "desc" },
  });

  const attachments = await (prisma as any).fileAttachment.findMany({
    where: {
      entityType: "INVOICE",
      entityId: { in: invoices.map((invoice) => invoice.id) },
    },
    include: {
      storedFile: true,
    },
  });

  return NextResponse.json(
    invoices.map((invoice) => ({
      ...invoice,
      attachments: attachments.filter((attachment: any) => attachment.entityId === invoice.id),
    })),
  );
}

export async function POST(request: Request, { params }: RouteContext) {
  const body = await request.formData();
  const invoice = await prisma.invoice.create({
    data: {
      orderId: params.id,
      number: String(body.get("number") ?? ""),
      series: body.get("series") ? String(body.get("series")) : null,
      amount: String(body.get("amount") ?? "0"),
      issuedAt: new Date(String(body.get("issuedAt") ?? "")),
      notes: body.get("notes") ? String(body.get("notes")) : null,
    },
  });

  const file = body.get("file");

  if (isUploadFile(file)) {
    await uploadAndAttachFile({
      file,
      entityType: "INVOICE",
      entityId: invoice.id,
    });
  }

  return NextResponse.json(invoice, { status: 201 });
}

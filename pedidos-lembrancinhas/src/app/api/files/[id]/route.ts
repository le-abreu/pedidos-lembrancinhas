import { NextResponse } from "next/server";

import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildOrderScope } from "@/server/services/order-service";
import { getAttachmentStream } from "@/server/services/file-storage-service";

type RouteContext = {
  params: {
    id: string;
  };
};

async function canAccessStoredFile(storedFileId: string) {
  const user = await requireCurrentUser();
  const scope = buildOrderScope(user);

  if (user.avatarStoredFile?.id === storedFileId) {
    return true;
  }

  if (user.profiles.some((item: { profile: string }) => item.profile === "ADMIN")) {
    const [attachment, orderType, product] = await Promise.all([
      (prisma as any).fileAttachment.findFirst({
        where: { storedFileId },
      }),
      (prisma as any).orderType.findFirst({
        where: { fileStoredFileId: storedFileId },
      }),
      (prisma as any).orderTypeProduct.findFirst({
        where: { fileStoredFileId: storedFileId },
      }),
    ]);
    return Boolean(attachment || orderType || product);
  }

  const attachments = await (prisma as any).fileAttachment.findMany({
    where: { storedFileId },
  });
  const [orderType, product] = await Promise.all([
    (prisma as any).orderType.findFirst({
      where: {
        fileStoredFileId: storedFileId,
        orders: scope,
      },
    }),
    (prisma as any).orderTypeProduct.findFirst({
      where: {
        fileStoredFileId: storedFileId,
        orderItems: {
          some: {
            order: scope,
          },
        },
      },
    }),
  ]);

  if (orderType || product) {
    return true;
  }

  for (const attachment of attachments) {
    if (attachment.entityType === "ORDER") {
      const order = await prisma.order.findFirst({
        where: { id: attachment.entityId, ...scope },
      });

      if (order) {
        return true;
      }
    }

    if (attachment.entityType === "ORDER_PHASE_EXECUTION") {
      const execution = await prisma.orderPhaseExecution.findFirst({
        where: {
          id: attachment.entityId,
          order: scope,
        },
      });

      if (execution) {
        return true;
      }
    }

    if (attachment.entityType === "INVOICE") {
      const invoice = await prisma.invoice.findFirst({
        where: {
          id: attachment.entityId,
          order: scope,
        },
      });

      if (invoice) {
        return true;
      }
    }
  }

  return false;
}

export async function GET(_: Request, { params }: RouteContext) {
  const allowed = await canAccessStoredFile(params.id);

  if (!allowed) {
    return NextResponse.json({ message: "Arquivo não encontrado." }, { status: 404 });
  }

  const result = await getAttachmentStream(params.id);

  if (!result) {
    return NextResponse.json({ message: "Arquivo não encontrado." }, { status: 404 });
  }

  return new NextResponse(result.body as any, {
    headers: {
      "Content-Type": result.storedFile.mimeType ?? "application/octet-stream",
      "Content-Length": String(result.storedFile.byteSize),
      "Content-Disposition": `inline; filename="${result.storedFile.originalName}"`,
      "Cache-Control": "private, max-age=60",
    },
  });
}

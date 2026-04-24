import { prisma } from "@/lib/prisma";

export async function getCatalogSnapshot() {
  const [
    companies,
    customers,
    suppliers,
    users,
    statuses,
    orderTypes,
    workflows,
  ] = await Promise.all([
    prisma.company.findMany({ orderBy: { tradeName: "asc" } }),
    prisma.customer.findMany({
      orderBy: { name: "asc" },
      include: { company: true },
    }),
    prisma.supplier.findMany({ orderBy: { name: "asc" } }),
    prisma.user.findMany({
      orderBy: { name: "asc" },
      include: {
        company: true,
        customer: true,
        supplier: true,
        profiles: true,
      },
    }),
    prisma.orderStatus.findMany({ orderBy: { name: "asc" } }),
    prisma.orderType.findMany({
      orderBy: { name: "asc" },
      include: {
        products: { orderBy: { name: "asc" } },
        workflow: {
          include: {
            phases: {
              orderBy: { order: "asc" },
              include: { targetStatus: true },
            },
          },
        },
      },
    }),
    prisma.workflow.findMany({
      orderBy: { name: "asc" },
      include: {
        orderType: true,
        phases: {
          orderBy: { order: "asc" },
          include: { targetStatus: true },
        },
      },
    }),
  ]);

  return {
    companies,
    customers,
    suppliers,
    users,
    statuses,
    orderTypes,
    workflows,
  };
}


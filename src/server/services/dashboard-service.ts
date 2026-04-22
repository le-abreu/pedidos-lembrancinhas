import { PhaseExecutionStatus, UserProfileType } from "@prisma/client";

import { prisma } from "@/lib/prisma";

type DashboardUser = {
  id: string;
  companyId: string | null;
  customerId: string | null;
  supplierId: string | null;
  profiles: Array<{ profile: UserProfileType }>;
};

function getOrderScope(user: DashboardUser) {
  const profiles = user.profiles.map((item) => item.profile);

  if (profiles.includes(UserProfileType.ADMIN)) {
    return {};
  }

  if (profiles.includes(UserProfileType.CLIENT)) {
    return {
      companyId: user.companyId ?? undefined,
      customerId: user.customerId ?? undefined,
    };
  }

  if (profiles.includes(UserProfileType.EXECUTOR)) {
    return {
      OR: [
        { suppliers: { some: { supplierId: user.supplierId ?? undefined } } },
        { phaseExecutions: { some: { supplierId: user.supplierId ?? undefined } } },
      ],
    };
  }

  return {
    id: "__no_access__",
  };
}

export async function getDashboardSnapshot(user: DashboardUser) {
  const orderScope = getOrderScope(user);
  const isAdmin = user.profiles.some((item) => item.profile === UserProfileType.ADMIN);

  const [companies, customers, suppliers, orders, activeOrders, completedPhases, pendingPhases, recentOrders] =
    await Promise.all([
      isAdmin ? prisma.company.count() : Promise.resolve(user.companyId ? 1 : 0),
      isAdmin
        ? prisma.customer.count()
        : prisma.customer.count({ where: { companyId: user.companyId ?? undefined } }),
      isAdmin
        ? prisma.supplier.count()
        : prisma.supplier.count({ where: { id: user.supplierId ?? undefined } }),
      prisma.order.count({ where: orderScope }),
      prisma.order.count({
        where: {
          ...orderScope,
          currentStatus: {
            name: {
              notIn: ["Finalizado", "Entregue", "Cancelado"],
            },
          },
        },
      }),
      prisma.orderPhaseExecution.count({
        where: {
          status: PhaseExecutionStatus.COMPLETED,
          order: orderScope,
        },
      }),
      prisma.orderPhaseExecution.count({
        where: {
          status: { not: PhaseExecutionStatus.COMPLETED },
          order: orderScope,
        },
      }),
      prisma.order.findMany({
        where: orderScope,
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          company: true,
          customer: true,
          currentStatus: true,
        },
      }),
    ]);

  return {
    metrics: {
      companies,
      customers,
      suppliers,
      orders,
      activeOrders,
      completedPhases,
      pendingPhases,
    },
    recentOrders,
  };
}

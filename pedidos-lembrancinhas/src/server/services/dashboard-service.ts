import { PhaseExecutionStatus, UserProfileType } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  getAccessibleCompanyIds,
  getAccessibleCustomerIds,
  getAccessibleSupplierIds,
} from "@/lib/user-access";
import { getDashboardFinancialSnapshot } from "@/server/services/financial-service";

type DashboardUser = {
  id: string;
  companyId: string | null;
  customerId: string | null;
  supplierId: string | null;
  customerAccesses?: Array<{
    customerId: string;
    customer?: {
      companyId: string;
    } | null;
  }>;
  supplierAccesses?: Array<{ supplierId: string }>;
  profiles: Array<{ profile: UserProfileType }>;
};

function getOrderScope(user: DashboardUser) {
  const profiles = user.profiles.map((item) => item.profile);

  if (profiles.includes(UserProfileType.ADMIN)) {
    return {};
  }

  if (profiles.includes(UserProfileType.CLIENT)) {
    const companyIds = getAccessibleCompanyIds(user);
    const customerIds = getAccessibleCustomerIds(user);
    return {
      companyId: companyIds.length ? { in: companyIds } : user.companyId ?? undefined,
      customerId: customerIds.length ? { in: customerIds } : user.customerId ?? undefined,
    };
  }

  if (profiles.includes(UserProfileType.EXECUTOR)) {
    const supplierIds = getAccessibleSupplierIds(user);
    return {
      OR: [
        { suppliers: { some: { supplierId: supplierIds.length ? { in: supplierIds } : user.supplierId ?? undefined } } },
        {
          phaseExecutions: {
            some: {
              supplierId: supplierIds.length ? { in: supplierIds } : user.supplierId ?? undefined,
            },
          },
        },
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
  const companyIds = getAccessibleCompanyIds(user);
  const customerIds = getAccessibleCustomerIds(user);
  const supplierIds = getAccessibleSupplierIds(user);

  const [
    companies,
    customers,
    suppliers,
    orders,
    activeOrders,
    completedPhases,
    pendingPhases,
    dashboardFinancial,
  ] =
    await Promise.all([
      isAdmin ? prisma.company.count() : Promise.resolve(companyIds.length),
      isAdmin
        ? prisma.customer.count()
        : prisma.customer.count({
            where: customerIds.length
              ? { id: { in: customerIds } }
              : { companyId: user.companyId ?? undefined },
          }),
      isAdmin
        ? prisma.supplier.count()
        : prisma.supplier.count({
            where: supplierIds.length ? { id: { in: supplierIds } } : { id: user.supplierId ?? undefined },
          }),
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
      getDashboardFinancialSnapshot(user as any),
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
      financialPlanned: dashboardFinancial.financialSummary.planned,
      financialReceived: dashboardFinancial.financialSummary.received,
      financialOpen: dashboardFinancial.financialSummary.open,
      financialOverdueInstallments: dashboardFinancial.financialSummary.overdueInstallments,
      openInstallments: dashboardFinancial.financialSummary.openInstallments,
      ordersWithoutPayment: dashboardFinancial.financialSummary.ordersWithoutPayment,
      overduePaymentItems: dashboardFinancial.financialSummary.overdueItems,
    },
    orderStatusBreakdown: dashboardFinancial.orderStatusBreakdown,
  };
}

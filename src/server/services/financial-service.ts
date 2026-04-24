import { Prisma, UserProfileType } from "@prisma/client";

import { pageSize } from "@/lib/constants";
import { getPagination } from "@/lib/pagination";
import { prisma } from "@/lib/prisma";
import { buildOrderScope, type ScopedUser } from "@/server/services/order-service";

const ORDER_PAYMENT_INSTALLMENT_STATUS = {
  OPEN: "OPEN",
  PAID: "PAID",
} as const;

type FinancialFilters = {
  page: number;
  search?: string;
  companyId?: string;
  customerId?: string;
  statusId?: string;
  method?: string;
  startDate?: string;
  endDate?: string;
};

type FinancialDashboardFilters = {
  startDate?: string;
  endDate?: string;
};

function parseDateRange(filters?: FinancialDashboardFilters) {
  const startAt = filters?.startDate ? new Date(`${filters.startDate}T00:00:00`) : undefined;
  const endAt = filters?.endDate ? new Date(`${filters.endDate}T23:59:59.999`) : undefined;

  return {
    startAt: startAt && !Number.isNaN(startAt.getTime()) ? startAt : undefined,
    endAt: endAt && !Number.isNaN(endAt.getTime()) ? endAt : undefined,
  };
}

function searchContains(search?: string) {
  return search
    ? {
        contains: search,
        mode: Prisma.QueryMode.insensitive,
      }
    : undefined;
}

export async function getFinancialIndexData(filters: FinancialFilters, user: ScopedUser) {
  const orderScope = buildOrderScope(user);
  const { startAt, endAt } = parseDateRange({
    startDate: filters.startDate,
    endDate: filters.endDate,
  });
  const orderWhere: Prisma.OrderWhereInput = {
    ...orderScope,
    companyId: filters.companyId || undefined,
    customerId: filters.customerId || undefined,
    currentStatusId: filters.statusId || undefined,
    OR: filters.search
      ? [
          { title: searchContains(filters.search) },
          { description: searchContains(filters.search) },
        ]
      : undefined,
  };

  const where = {
    order: orderWhere,
    method: filters.method ? { equals: filters.method as any } : undefined,
    installments: startAt || endAt
      ? {
          some: {
            dueAt: {
              gte: startAt,
              lte: endAt,
            },
          },
        }
      : undefined,
  } as any;

  const [total, companies, customers, statuses, ordersWithoutPaymentCount, ordersWithoutPayment] = await Promise.all([
    (prisma as any).orderPaymentPlan.count({ where }),
    prisma.company.findMany({ orderBy: { tradeName: "asc" } }),
    prisma.customer.findMany({ orderBy: { name: "asc" } }),
    prisma.orderStatus.findMany({ orderBy: { name: "asc" } }),
    prisma.order.count({
      where: {
        ...orderWhere,
        paymentPlans: {
          none: {},
        },
      } as any,
    }),
    prisma.order.findMany({
      where: {
        ...orderWhere,
        paymentPlans: {
          none: {},
        },
      } as any,
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        company: true,
        customer: true,
        currentStatus: true,
      },
    }),
  ]);

  const pagination = getPagination(filters.page, total, pageSize);
  const paginatedPlans = await (prisma as any).orderPaymentPlan.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      order: {
        include: {
          company: true,
          customer: true,
          currentStatus: true,
        },
      },
      installments: {
        orderBy: { number: "asc" },
      },
    },
    skip: pagination.skip,
    take: pagination.take,
  });

  const summary = paginatedPlans.reduce(
    (acc: { planned: number; received: number; open: number }, plan: any) => {
      const totalAmount = Number(plan.totalAmount);
      const received = plan.installments.reduce(
        (sum: number, installment: any) =>
          sum + (installment.status === ORDER_PAYMENT_INSTALLMENT_STATUS.PAID ? Number(installment.amount) : 0),
        0,
      );

      acc.planned += totalAmount;
      acc.received += received;
      acc.open += totalAmount - received;
      return acc;
    },
    { planned: 0, received: 0, open: 0 },
  );

  return {
    items: paginatedPlans,
    pagination,
    filters: {
      companies,
      customers,
      statuses,
    },
    summary,
    ordersWithoutPaymentCount,
    ordersWithoutPayment,
  };
}

export async function getDashboardFinancialSnapshot(user: ScopedUser, filters?: FinancialDashboardFilters) {
  const orderScope = buildOrderScope(user);
  const today = new Date();
  const { startAt, endAt } = parseDateRange(filters);
  const installmentDueAtFilter =
    startAt || endAt
      ? {
          gte: startAt,
          lte: endAt,
        }
      : undefined;
  const orderCreatedAtFilter =
    startAt || endAt
      ? {
          gte: startAt,
          lte: endAt,
        }
      : undefined;

  const [statusSummary, scopedInstallments, openInstallments, overdueInstallments, ordersWithoutPayment, overdueItems] =
    await Promise.all([
    prisma.order.groupBy({
      by: ["currentStatusId"],
      where: {
        ...orderScope,
        createdAt: orderCreatedAtFilter,
      },
      _count: { _all: true },
    }),
    (prisma as any).orderPaymentInstallment.findMany({
      where: {
        dueAt: installmentDueAtFilter,
        plan: {
          order: orderScope,
        },
      },
    }),
    (prisma as any).orderPaymentInstallment.count({
      where: {
        status: ORDER_PAYMENT_INSTALLMENT_STATUS.OPEN,
        dueAt: installmentDueAtFilter,
        plan: {
          order: orderScope,
        },
      },
    }),
    (prisma as any).orderPaymentInstallment.count({
      where: {
        status: ORDER_PAYMENT_INSTALLMENT_STATUS.OPEN,
        dueAt: {
          lt: today,
          gte: startAt,
          lte: endAt,
        },
        plan: {
          order: orderScope,
        },
      },
    }),
    prisma.order.count({
      where: {
        createdAt: orderCreatedAtFilter,
        ...orderScope,
        paymentPlans: {
          none: {},
        },
      } as any,
    }),
    (prisma as any).orderPaymentInstallment.findMany({
      where: {
        status: ORDER_PAYMENT_INSTALLMENT_STATUS.OPEN,
        dueAt: {
          lt: today,
          gte: startAt,
          lte: endAt,
        },
        plan: {
          order: orderScope,
        },
      },
      orderBy: { dueAt: "asc" },
      take: 8,
      include: {
        plan: {
          include: {
            order: {
              include: {
                company: true,
                customer: true,
                currentStatus: true,
              },
            },
          },
        },
      },
    }),
  ]);

  const statuses = await prisma.orderStatus.findMany({
    where: {
      id: {
        in: statusSummary.map((item) => item.currentStatusId),
      },
    },
  });

  const statusMap = new Map(statuses.map((status) => [status.id, status]));
  const orderStatusBreakdown = statusSummary
    .map((item: any) => ({
      id: item.currentStatusId,
      name: statusMap.get(item.currentStatusId)?.name ?? "Sem status",
      color: statusMap.get(item.currentStatusId)?.color ?? "#b4653a",
      count: item._count._all,
    }))
    .sort((a: any, b: any) => b.count - a.count);

  const financialSummary = scopedInstallments.reduce(
    (acc: { planned: number; received: number; open: number }, installment: any) => {
      const amount = Number(installment.amount);
      acc.planned += amount;

      if (installment.status === ORDER_PAYMENT_INSTALLMENT_STATUS.PAID) {
        acc.received += amount;
      }

      if (installment.status === ORDER_PAYMENT_INSTALLMENT_STATUS.OPEN) {
        acc.open += amount;
      }

      return acc;
    },
    { planned: 0, received: 0, open: 0 },
  );

  return {
    orderStatusBreakdown,
    financialSummary: {
      planned: financialSummary.planned,
      received: financialSummary.received,
      open: financialSummary.open,
      openInstallments,
      overdueInstallments,
      ordersWithoutPayment,
      overdueItems,
    },
  };
}

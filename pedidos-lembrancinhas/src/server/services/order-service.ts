import { PhaseExecutionStatus, Prisma, UserProfileType } from "@prisma/client";

import { pageSize } from "@/lib/constants";
import { getPagination } from "@/lib/pagination";
import { prisma } from "@/lib/prisma";
import {
  getAccessibleCompanyIds,
  getAccessibleCustomerIds,
  getAccessibleSupplierIds,
} from "@/lib/user-access";
import { getAttachmentsByEntity } from "@/server/services/file-storage-service";

type OrderFilters = {
  page: number;
  companyId?: string;
  customerId?: string;
  orderTypeId?: string;
  statusId?: string;
  supplierId?: string;
  responsibleUserId?: string;
  requestedFrom?: string;
  requestedTo?: string;
  search?: string;
  active?: boolean;
};

export type ScopedUser = {
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

type OrderFormScope = Pick<
  ScopedUser,
  "id" | "companyId" | "customerId" | "customerAccesses" | "profiles"
>;

export function buildOrderScope(user: ScopedUser): Prisma.OrderWhereInput | undefined {
  const profiles = user.profiles.map((item) => item.profile);

  if (profiles.includes(UserProfileType.ADMIN)) {
    return undefined;
  }

  if (profiles.includes(UserProfileType.CLIENT)) {
    const customerIds = getAccessibleCustomerIds(user);
    const companyIds = getAccessibleCompanyIds(user);
    return {
      customerId: customerIds.length ? { in: customerIds } : user.customerId ?? undefined,
      companyId: companyIds.length ? { in: companyIds } : user.companyId ?? undefined,
    };
  }

  if (profiles.includes(UserProfileType.EXECUTOR)) {
    const supplierIds = getAccessibleSupplierIds(user);
    return {
      OR: [
        {
          suppliers: {
            some: {
              supplierId: supplierIds.length ? { in: supplierIds } : user.supplierId ?? undefined,
            },
          },
        },
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

export async function getOrderIndexData(filters: OrderFilters, user: ScopedUser) {
  const scope = buildOrderScope(user);

  const where: Prisma.OrderWhereInput = {
    ...scope,
    active: filters.active,
    companyId: filters.companyId || undefined,
    customerId: filters.customerId || undefined,
    orderTypeId: filters.orderTypeId || undefined,
    currentStatusId: filters.statusId || undefined,
    createdById: filters.responsibleUserId || undefined,
    requestedAt:
      filters.requestedFrom || filters.requestedTo
        ? {
            gte: filters.requestedFrom ? new Date(filters.requestedFrom) : undefined,
            lte: filters.requestedTo ? new Date(filters.requestedTo) : undefined,
          }
        : undefined,
    suppliers: filters.supplierId
      ? {
          some: {
            supplierId: filters.supplierId,
          },
        }
      : scope?.suppliers,
    OR: filters.search
      ? [
          {
            title: {
              contains: filters.search,
              mode: Prisma.QueryMode.insensitive,
            },
          },
          {
            description: {
              contains: filters.search,
              mode: Prisma.QueryMode.insensitive,
            },
          },
        ]
      : undefined,
  };

  const [total, filterOptions] = await Promise.all([
    prisma.order.count({ where }),
    prisma.$transaction([
      prisma.company.findMany({ orderBy: { tradeName: "asc" } }),
      prisma.customer.findMany({ orderBy: { name: "asc" } }),
      prisma.orderType.findMany({ orderBy: { name: "asc" } }),
      prisma.orderStatus.findMany({ orderBy: { name: "asc" } }),
      prisma.supplier.findMany({ orderBy: { name: "asc" } }),
      prisma.user.findMany({ orderBy: { name: "asc" } }),
    ]),
  ]);

  const pagination = getPagination(filters.page, total, pageSize);
  const orders = await (prisma.order as any).findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: pagination.skip,
    take: pagination.take,
    include: {
      company: true,
      customer: true,
      orderType: true,
      currentStatus: true,
      createdBy: true,
      suppliers: { include: { supplier: true } },
      _count: {
        select: {
          paymentPlans: true,
        },
      },
    },
  });

  return {
    orders,
    pagination,
    filterOptions: {
      companies: filterOptions[0],
      customers: filterOptions[1],
      orderTypes: filterOptions[2],
      statuses: filterOptions[3],
      suppliers: filterOptions[4],
      users: filterOptions[5],
    },
  };
}

export async function getOrderFormData(id?: string, user?: OrderFormScope) {
  const isClient = user?.profiles.some((item) => item.profile === UserProfileType.CLIENT);
  const accessibleCompanyIds = getAccessibleCompanyIds(user);
  const accessibleCustomerIds = getAccessibleCustomerIds(user);
  const companyWhere = isClient
    ? { id: { in: accessibleCompanyIds.length ? accessibleCompanyIds : [user?.companyId ?? "__no_access__"] } }
    : { active: true };
  const customerWhere = isClient
    ? { id: { in: accessibleCustomerIds.length ? accessibleCustomerIds : [user?.customerId ?? "__no_access__"] } }
    : { active: true };
  const userWhere = isClient ? { id: user?.id ?? "__no_access__" } : { active: true };

  const [companies, customers, orderTypes, statuses, shippingMethods, users, suppliers, item] =
    await prisma.$transaction([
      prisma.company.findMany({ where: companyWhere, orderBy: { tradeName: "asc" } }),
      prisma.customer.findMany({ where: customerWhere, orderBy: { name: "asc" } }),
      (prisma.orderType as any).findMany({
        where: { active: true },
        orderBy: { name: "asc" },
        include: {
          workflow: true,
          fileStoredFile: true,
          products: {
            where: { active: true },
            orderBy: { name: "asc" },
            include: { fileStoredFile: true },
          },
        },
      }),
      prisma.orderStatus.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
      (prisma as any).shippingMethod.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
      prisma.user.findMany({ where: userWhere, orderBy: { name: "asc" } }),
      prisma.supplier.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
      id
        ? (prisma.order as any).findUnique({
            where: { id },
            include: {
              items: true,
              suppliers: true,
            },
          })
        : prisma.order.findFirst({
            where: { id: "__not_found__" },
          }),
    ]);

  const orderAttachments = item ? await getAttachmentsByEntity("ORDER", [item.id]) : new Map<string, Array<any>>();

  return {
    companies,
    customers,
    orderTypes: orderTypes as any,
    statuses,
    shippingMethods: shippingMethods as any,
    users,
    suppliers,
    item: item
      ? ({
          ...item,
          attachments: orderAttachments.get(item.id) ?? [],
        } as any)
      : (item as any),
  };
}

export async function getOrderById(id: string, user: ScopedUser) {
  const scope = buildOrderScope(user);

  const order = await (prisma.order as any).findFirst({
    where: {
      id,
      ...scope,
    },
    include: {
      company: true,
      customer: true,
      orderType: {
        include: { fileStoredFile: true, products: { include: { fileStoredFile: true } } },
      },
      workflow: {
        include: {
          phases: {
            orderBy: { order: "asc" },
            include: { targetStatus: true, responsibleSupplier: true },
          },
        },
      },
      currentStatus: true,
      shippingMethod: true,
      createdBy: true,
      items: {
        include: { product: { include: { fileStoredFile: true } } },
      },
      suppliers: {
        include: { supplier: true },
      },
      phaseExecutions: {
        orderBy: { phase: { order: "asc" } },
        include: {
          phase: {
            include: { targetStatus: true, responsibleSupplier: true },
          },
          supplier: true,
          executedByUser: true,
        },
      },
      invoices: {
        orderBy: { issuedAt: "desc" },
      },
      paymentPlans: {
        orderBy: { createdAt: "desc" },
        include: {
          createdBy: {
            select: { id: true, name: true },
          },
          installments: {
            orderBy: { number: "asc" },
          },
        },
      },
    },
  });

  if (!order) {
    return null;
  }

  const [orderAttachments, executionAttachments, invoiceAttachments] = await Promise.all([
    getAttachmentsByEntity("ORDER", [order.id]),
    getAttachmentsByEntity(
      "ORDER_PHASE_EXECUTION",
      order.phaseExecutions.map((execution: { id: string }) => execution.id),
    ),
    getAttachmentsByEntity(
      "INVOICE",
      order.invoices.map((invoice: { id: string }) => invoice.id),
    ),
  ]);

  return {
    ...order,
    attachments: orderAttachments.get(order.id) ?? [],
    phaseExecutions: order.phaseExecutions.map((execution: { id: string }) => ({
      ...execution,
      attachments: executionAttachments.get(execution.id) ?? [],
    })),
    invoices: order.invoices.map((invoice: { id: string }) => ({
      ...invoice,
      attachments: invoiceAttachments.get(invoice.id) ?? [],
    })),
  };
}

export async function getWorkflowExecutionSummary(orderId: string, user: ScopedUser) {
  const scope = buildOrderScope(user);

  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      ...scope,
    },
    include: {
      workflow: {
        include: {
          phases: {
            orderBy: { order: "asc" },
            include: { targetStatus: true, responsibleSupplier: true },
          },
        },
      },
      phaseExecutions: {
        include: {
          phase: true,
          supplier: true,
          executedByUser: true,
        },
      },
      currentStatus: true,
    },
  });

  if (!order) {
    return null;
  }

  const executions = order.workflow.phases.map((phase) => {
    const execution = order.phaseExecutions.find((item) => item.phaseId === phase.id);

    return {
      phase,
      execution,
      isCurrent:
        execution?.status !== PhaseExecutionStatus.COMPLETED &&
        order.workflow.phases
          .filter((candidate) => candidate.order < phase.order)
          .every((candidate) =>
            order.phaseExecutions.find((item) => item.phaseId === candidate.id)?.status ===
            PhaseExecutionStatus.COMPLETED,
          ),
    };
  });

  return { order, executions };
}

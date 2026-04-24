import { Prisma, UserProfileType } from "@prisma/client";

import { pageSize } from "@/lib/constants";
import { getPagination } from "@/lib/pagination";
import { prisma } from "@/lib/prisma";
import { getCustomerAccessMap, getSupplierAccessMap } from "@/server/services/user-access-service";

type BaseListFilters = {
  page: number;
  search?: string;
  active?: boolean;
};

type CustomerFilters = BaseListFilters & {
  companyId?: string;
};

type UserFilters = BaseListFilters & {
  companyId?: string;
  profile?: UserProfileType;
};

type WorkflowFilters = BaseListFilters & {
  orderTypeId?: string;
};

function searchContains(search?: string) {
  return search
    ? {
        contains: search,
        mode: Prisma.QueryMode.insensitive,
      }
    : undefined;
}

export async function getCompaniesList(filters: BaseListFilters) {
  const where: Prisma.CompanyWhereInput = {
    active: filters.active,
    OR: filters.search
      ? [
          { legalName: searchContains(filters.search) },
          { tradeName: searchContains(filters.search) },
          { cnpj: searchContains(filters.search) },
          { email: searchContains(filters.search) },
        ]
      : undefined,
  };

  const total = await prisma.company.count({ where });
  const pagination = getPagination(filters.page, total, pageSize);
  const items = await prisma.company.findMany({
    where,
    orderBy: { tradeName: "asc" },
    skip: pagination.skip,
    take: pagination.take,
    include: {
      _count: {
        select: {
          customers: true,
          orders: true,
          users: true,
        },
      },
    },
  });

  return { items, pagination };
}

export async function getCustomersList(filters: CustomerFilters) {
  const where: Prisma.CustomerWhereInput = {
    companyId: filters.companyId || undefined,
    active: filters.active,
    OR: filters.search
      ? [
          { name: searchContains(filters.search) },
          { document: searchContains(filters.search) },
          { email: searchContains(filters.search) },
        ]
      : undefined,
  };

  const [total, companies] = await Promise.all([
    prisma.customer.count({ where }),
    prisma.company.findMany({ orderBy: { tradeName: "asc" } }),
  ]);

  const pagination = getPagination(filters.page, total, pageSize);

  const normalizedItems = await prisma.customer.findMany({
    where,
    orderBy: { name: "asc" },
    skip: pagination.skip,
    take: pagination.take,
    include: {
      company: true,
      _count: { select: { orders: true, users: true } },
    },
  });

  return { items: normalizedItems, pagination, companies };
}

export async function getSuppliersList(filters: BaseListFilters) {
  const where: Prisma.SupplierWhereInput = {
    active: filters.active,
    OR: filters.search
      ? [
          { name: searchContains(filters.search) },
          { document: searchContains(filters.search) },
          { email: searchContains(filters.search) },
        ]
      : undefined,
  };

  const total = await prisma.supplier.count({ where });
  const pagination = getPagination(filters.page, total, pageSize);
  const items = await prisma.supplier.findMany({
    where,
    orderBy: { name: "asc" },
    skip: pagination.skip,
    take: pagination.take,
    include: {
      _count: {
        select: {
          users: true,
          orderSuppliers: true,
          phaseExecutions: true,
        },
      },
    },
  });

  return { items, pagination };
}

export async function getUsersList(filters: UserFilters) {
  const where = {
    active: filters.active,
    ...(filters.companyId
      ? {
          OR: [
            { companyId: filters.companyId },
            {
              customerAccesses: {
                some: {
                  customer: {
                    companyId: filters.companyId,
                  },
                },
              },
            },
          ],
        }
      : {}),
    profiles: filters.profile
      ? {
          some: {
            profile: filters.profile,
          },
        }
      : undefined,
    AND: filters.search
      ? [
          {
            OR: [{ name: searchContains(filters.search) }, { email: searchContains(filters.search) }],
          },
        ]
      : undefined,
  } as any;

  const [total, companies] = await Promise.all([
    prisma.user.count({ where }),
    prisma.company.findMany({ orderBy: { tradeName: "asc" } }),
  ]);
  const pagination = getPagination(filters.page, total, pageSize);
  const items = await (prisma.user as any).findMany({
    where,
    orderBy: { name: "asc" },
    skip: pagination.skip,
    take: pagination.take,
    include: {
      profiles: true,
      company: true,
      customer: true,
      supplier: true,
      _count: {
        select: {
          createdOrders: true,
          phaseExecutions: true,
        },
      },
    },
  });

  const [customerAccessMap, supplierAccessMap] = await Promise.all([
    getCustomerAccessMap(items.map((item: any) => item.id)),
    getSupplierAccessMap(items.map((item: any) => item.id)),
  ]);

  const enrichedItems = items.map((item: any) => ({
    ...item,
    customerAccesses: (customerAccessMap.get(item.id) ?? []).map((access) => ({
      customerId: access.customerId,
      customer: {
        id: access.customerId,
        name: access.customerName,
        companyId: access.companyId,
        company: {
          id: access.companyId,
          tradeName: access.companyTradeName,
        },
      },
    })),
    supplierAccesses: (supplierAccessMap.get(item.id) ?? []).map((access) => ({
      supplierId: access.supplierId,
      role: access.role,
      supplier: {
        id: access.supplierId,
        name: access.supplierName,
      },
    })),
  }));

  return { items: enrichedItems, pagination, companies };
}

export async function getStatusesList(filters: BaseListFilters) {
  const where: Prisma.OrderStatusWhereInput = {
    active: filters.active,
    OR: filters.search
      ? [{ name: searchContains(filters.search) }, { description: searchContains(filters.search) }]
      : undefined,
  };

  const total = await prisma.orderStatus.count({ where });
  const pagination = getPagination(filters.page, total, pageSize);
  const items = await prisma.orderStatus.findMany({
    where,
    orderBy: { name: "asc" },
    skip: pagination.skip,
    take: pagination.take,
    include: {
      _count: {
        select: {
          orders: true,
          workflows: true,
        },
      },
    },
  });

  return { items, pagination };
}

export async function getShippingMethodsList(filters: BaseListFilters) {
  const where: Prisma.ShippingMethodWhereInput = {
    active: filters.active,
    OR: filters.search
      ? [{ name: searchContains(filters.search) }, { description: searchContains(filters.search) }]
      : undefined,
  };

  const total = await prisma.shippingMethod.count({ where });
  const pagination = getPagination(filters.page, total, pageSize);
  const items = await prisma.shippingMethod.findMany({
    where,
    orderBy: { name: "asc" },
    skip: pagination.skip,
    take: pagination.take,
    include: {
      _count: {
        select: {
          orders: true,
        },
      },
    },
  });

  return { items, pagination };
}

export async function getOrderTypesList(filters: BaseListFilters) {
  const where: Prisma.OrderTypeWhereInput = {
    active: filters.active,
    OR: filters.search
      ? [{ name: searchContains(filters.search) }, { description: searchContains(filters.search) }]
      : undefined,
  };

  const total = await prisma.orderType.count({ where });
  const pagination = getPagination(filters.page, total, pageSize);
  const items = await prisma.orderType.findMany({
    where,
    orderBy: { name: "asc" },
    skip: pagination.skip,
    take: pagination.take,
    include: {
      workflow: true,
      _count: {
        select: {
          products: true,
          orders: true,
        },
      },
    },
  });

  return { items, pagination };
}

export async function getWorkflowsList(filters: WorkflowFilters) {
  const where: Prisma.WorkflowWhereInput = {
    active: filters.active,
    orderTypeId: filters.orderTypeId || undefined,
    OR: filters.search
      ? [{ name: searchContains(filters.search) }, { description: searchContains(filters.search) }]
      : undefined,
  };

  const [total, orderTypes] = await Promise.all([
    prisma.workflow.count({ where }),
    prisma.orderType.findMany({ orderBy: { name: "asc" } }),
  ]);
  const pagination = getPagination(filters.page, total, pageSize);
  const items = await prisma.workflow.findMany({
    where,
    orderBy: { name: "asc" },
    skip: pagination.skip,
    take: pagination.take,
    include: {
      orderType: true,
      phases: {
        orderBy: { order: "asc" },
      },
      _count: {
        select: {
          orders: true,
          phases: true,
        },
      },
    },
  });

  return { items, pagination, orderTypes };
}

export async function getCompanyFormData(id?: string) {
  if (!id) {
    return null;
  }

  return prisma.company.findUnique({ where: { id } });
}

export async function getCustomerFormData(id?: string) {
  const [item, companies] = await Promise.all([
    id ? prisma.customer.findUnique({ where: { id } }) : Promise.resolve(null),
    prisma.company.findMany({ where: { active: true }, orderBy: { tradeName: "asc" } }),
  ]);

  return { item, companies };
}

export async function getSupplierFormData(id?: string) {
  if (!id) {
    return null;
  }

  return prisma.supplier.findUnique({ where: { id } });
}

export async function getUserFormData(id?: string) {
  const [item, companies, customers, suppliers] = await Promise.all([
    id
      ? (prisma.user as any).findUnique({
          where: { id },
          include: {
            profiles: true,
          },
        })
      : Promise.resolve(null),
    prisma.company.findMany({ where: { active: true }, orderBy: { tradeName: "asc" } }),
    prisma.customer.findMany({
      where: { active: true },
      orderBy: [{ company: { tradeName: "asc" } }, { name: "asc" }],
      include: {
        company: true,
      },
    }),
    prisma.supplier.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
  ]);

  if (!item) {
    return { item, companies, customers, suppliers };
  }

  const [customerAccessMap, supplierAccessMap] = await Promise.all([
    getCustomerAccessMap([item.id]),
    getSupplierAccessMap([item.id]),
  ]);

  return {
    item: {
      ...item,
      customerAccesses: (customerAccessMap.get(item.id) ?? []).map((access) => ({
        customerId: access.customerId,
        customer: {
          id: access.customerId,
          name: access.customerName,
          companyId: access.companyId,
          company: {
            id: access.companyId,
            tradeName: access.companyTradeName,
          },
        },
      })),
      supplierAccesses: (supplierAccessMap.get(item.id) ?? []).map((access) => ({
        supplierId: access.supplierId,
        role: access.role,
        supplier: {
          id: access.supplierId,
          name: access.supplierName,
        },
      })),
    },
    companies,
    customers,
    suppliers,
  };
}

export async function getStatusFormData(id?: string) {
  if (!id) {
    return null;
  }

  return prisma.orderStatus.findUnique({ where: { id } });
}

export async function getOrderTypeFormData(id?: string) {
  const item = id
    ? await (prisma.orderType as any).findUnique({
        where: { id },
        include: {
          fileStoredFile: true,
          products: { orderBy: { name: "asc" }, include: { fileStoredFile: true } },
          workflow: true,
        },
      })
    : null;

  return { item };
}

export async function getShippingMethodFormData(id?: string) {
  return id ? prisma.shippingMethod.findUnique({ where: { id } }) : null;
}

export async function getWorkflowFormData(id?: string) {
  const [item, statuses, orderTypes, suppliers] = await Promise.all([
    id
      ? prisma.workflow.findUnique({
          where: { id },
          include: {
            phases: {
              orderBy: { order: "asc" },
              include: { targetStatus: true, responsibleSupplier: true },
            },
          },
        })
      : Promise.resolve(null),
    prisma.orderStatus.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.orderType.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.supplier.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
  ]);

  return { item, statuses, orderTypes, suppliers };
}

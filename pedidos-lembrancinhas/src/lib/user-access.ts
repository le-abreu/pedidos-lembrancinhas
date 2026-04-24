import { UserProfileType } from "@prisma/client";

type UserAccessShape = {
  companyId?: string | null;
  customerId?: string | null;
  supplierId?: string | null;
  customerAccesses?: Array<{
    customerId: string;
    customer?: {
      companyId: string;
      company?: {
        id: string;
        tradeName: string;
      } | null;
      name?: string;
    } | null;
  }>;
  supplierAccesses?: Array<{
    supplierId: string;
    role?: string | null;
    supplier?: {
      id: string;
      name: string;
    } | null;
  }>;
  profiles?: Array<{ profile: UserProfileType }>;
};

export function getAccessibleCustomerIds(user: UserAccessShape | null | undefined) {
  const ids = user?.customerAccesses?.map((item) => item.customerId).filter(Boolean) ?? [];
  if (ids.length) {
    return [...new Set(ids)];
  }

  return user?.customerId ? [user.customerId] : [];
}

export function getAccessibleSupplierIds(user: UserAccessShape | null | undefined) {
  const ids = user?.supplierAccesses?.map((item) => item.supplierId).filter(Boolean) ?? [];
  if (ids.length) {
    return [...new Set(ids)];
  }

  return user?.supplierId ? [user.supplierId] : [];
}

export function getAccessibleCompanyIds(user: UserAccessShape | null | undefined) {
  const ids =
    user?.customerAccesses
      ?.map((item) => item.customer?.companyId)
      .filter((value): value is string => Boolean(value)) ?? [];

  if (ids.length) {
    return [...new Set(ids)];
  }

  return user?.companyId ? [user.companyId] : [];
}

export function hasProfile(
  user: Pick<UserAccessShape, "profiles"> | null | undefined,
  profile: UserProfileType,
) {
  return user?.profiles?.some((item) => item.profile === profile) ?? false;
}

export function canAccessSupplier(
  user: UserAccessShape | null | undefined,
  supplierId: string | null | undefined,
) {
  if (!supplierId) {
    return false;
  }

  return getAccessibleSupplierIds(user).includes(supplierId);
}

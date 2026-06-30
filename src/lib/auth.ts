import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { UserProfileType } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { createSessionToken, parseSessionToken } from "@/lib/auth/session-token";
import { getCustomerAccessMap, getSupplierAccessMap } from "@/server/services/user-access-service";

const AUTH_COOKIE = "pedido-poc-user";
const SESSION_SECRET =
  process.env.AUTH_SESSION_SECRET ??
  process.env.AUTH_SECRET ??
  process.env.NEXTAUTH_SECRET ??
  "pedido-lembrancinha-dev-session-secret";

export function getSessionUserId() {
  const token = cookies().get(AUTH_COOKIE)?.value;
  return parseSessionToken(token, SESSION_SECRET);
}

export function requireSession() {
  const userId = getSessionUserId();

  if (!userId) {
    redirect("/login");
  }

  return userId;
}

export function setSessionCookie(userId: string) {
  cookies().set(AUTH_COOKIE, createSessionToken(userId, SESSION_SECRET), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
}

export function clearSessionCookie() {
  cookies().delete(AUTH_COOKIE);
}

export async function getCurrentUser() {
  const userId = getSessionUserId();

  if (!userId) {
    return null;
  }

  const user = await (prisma.user as any).findUnique({
    where: { id: userId },
    include: {
      avatarStoredFile: {
        select: { id: true, originalName: true, mimeType: true },
      },
      company: true,
      customer: true,
      supplier: true,
      profiles: true,
    },
  });

  if (!user) {
    return null;
  }

  const [customerAccessMap, supplierAccessMap] = await Promise.all([
    getCustomerAccessMap([user.id]),
    getSupplierAccessMap([user.id]),
  ]);

  return {
    ...user,
    customerAccesses: (customerAccessMap.get(user.id) ?? []).map((item) => ({
      customerId: item.customerId,
      customer: {
        id: item.customerId,
        name: item.customerName,
        companyId: item.companyId,
        company: {
          id: item.companyId,
          tradeName: item.companyTradeName,
        },
      },
    })),
    supplierAccesses: (supplierAccessMap.get(user.id) ?? []).map((item) => ({
      supplierId: item.supplierId,
      role: item.role,
      supplier: {
        id: item.supplierId,
        name: item.supplierName,
      },
    })),
  } as any;
}

export async function requireCurrentUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export function getUserProfileTypes(
  user: { profiles: Array<{ profile: UserProfileType }> } | null | undefined,
) {
  return user?.profiles.map((item) => item.profile) ?? [];
}

export function hasAnyProfile(
  user: { profiles: Array<{ profile: UserProfileType }> } | null | undefined,
  allowedProfiles: UserProfileType[],
) {
  const profiles = getUserProfileTypes(user);
  return allowedProfiles.some((profile) => profiles.includes(profile));
}

export async function requireAnyProfile(allowedProfiles: UserProfileType[]) {
  const user = await requireCurrentUser();

  if (!hasAnyProfile(user, allowedProfiles)) {
    redirect("/");
  }

  return user;
}

import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

type CustomerAccessRow = {
  userId: string;
  customerId: string;
  customerName: string;
  companyId: string;
  companyTradeName: string;
};

type SupplierAccessRow = {
  userId: string;
  supplierId: string;
  supplierName: string;
  role: string | null;
};

export async function getCustomerAccessMap(userIds: string[]) {
  if (!userIds.length) {
    return new Map<string, CustomerAccessRow[]>();
  }

  const rows = await prisma.$queryRaw<CustomerAccessRow[]>(Prisma.sql`
    SELECT
      uca."userId" as "userId",
      uca."customerId" as "customerId",
      c."name" as "customerName",
      c."companyId" as "companyId",
      co."tradeName" as "companyTradeName"
    FROM "UserCustomerAccess" uca
    INNER JOIN "Customer" c ON c."id" = uca."customerId"
    INNER JOIN "Company" co ON co."id" = c."companyId"
    WHERE uca."userId" IN (${Prisma.join(userIds)})
    ORDER BY co."tradeName" ASC, c."name" ASC
  `);

  return rows.reduce((map, row) => {
    const current = map.get(row.userId) ?? [];
    current.push(row);
    map.set(row.userId, current);
    return map;
  }, new Map<string, CustomerAccessRow[]>());
}

export async function getSupplierAccessMap(userIds: string[]) {
  if (!userIds.length) {
    return new Map<string, SupplierAccessRow[]>();
  }

  const rows = await prisma.$queryRaw<SupplierAccessRow[]>(Prisma.sql`
    SELECT
      usa."userId" as "userId",
      usa."supplierId" as "supplierId",
      s."name" as "supplierName",
      usa."role" as "role"
    FROM "UserSupplierAccess" usa
    INNER JOIN "Supplier" s ON s."id" = usa."supplierId"
    WHERE usa."userId" IN (${Prisma.join(userIds)})
    ORDER BY s."name" ASC
  `);

  return rows.reduce((map, row) => {
    const current = map.get(row.userId) ?? [];
    current.push(row);
    map.set(row.userId, current);
    return map;
  }, new Map<string, SupplierAccessRow[]>());
}

export async function replaceUserCustomerAccesses(userId: string, customerIds: string[]) {
  await prisma.$executeRawUnsafe(`DELETE FROM "UserCustomerAccess" WHERE "userId" = '${userId.replace(/'/g, "''")}'`);

  if (!customerIds.length) {
    return;
  }

  const values = customerIds
    .map(
      (customerId) =>
        `(md5(random()::text || clock_timestamp()::text || '${userId.replace(/'/g, "''")}' || '${customerId.replace(/'/g, "''")}'), '${userId.replace(/'/g, "''")}', '${customerId.replace(/'/g, "''")}', CURRENT_TIMESTAMP)`,
    )
    .join(", ");

  await prisma.$executeRawUnsafe(
    `INSERT INTO "UserCustomerAccess" ("id", "userId", "customerId", "createdAt") VALUES ${values}`,
  );
}

export async function replaceUserSupplierAccesses(
  userId: string,
  supplierAccesses: Array<{ supplierId: string; role: string | null }>,
) {
  await prisma.$executeRawUnsafe(`DELETE FROM "UserSupplierAccess" WHERE "userId" = '${userId.replace(/'/g, "''")}'`);

  if (!supplierAccesses.length) {
    return;
  }

  const values = supplierAccesses
    .map((item) => {
      const supplierId = item.supplierId.replace(/'/g, "''");
      const role = item.role ? `'${item.role.replace(/'/g, "''")}'` : "NULL";
      const escapedUserId = userId.replace(/'/g, "''");
      return `(md5(random()::text || clock_timestamp()::text || '${escapedUserId}' || '${supplierId}'), '${escapedUserId}', '${supplierId}', ${role}, CURRENT_TIMESTAMP)`;
    })
    .join(", ");

  await prisma.$executeRawUnsafe(
    `INSERT INTO "UserSupplierAccess" ("id", "userId", "supplierId", "role", "createdAt") VALUES ${values}`,
  );
}

CREATE TABLE "UserCustomerAccess" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserCustomerAccess_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserSupplierAccess" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "role" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserSupplierAccess_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserCustomerAccess_userId_customerId_key" ON "UserCustomerAccess"("userId", "customerId");

CREATE UNIQUE INDEX "UserSupplierAccess_userId_supplierId_key" ON "UserSupplierAccess"("userId", "supplierId");

ALTER TABLE "UserCustomerAccess"
ADD CONSTRAINT "UserCustomerAccess_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserCustomerAccess"
ADD CONSTRAINT "UserCustomerAccess_customerId_fkey"
FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserSupplierAccess"
ADD CONSTRAINT "UserSupplierAccess_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserSupplierAccess"
ADD CONSTRAINT "UserSupplierAccess_supplierId_fkey"
FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "UserCustomerAccess" ("id", "userId", "customerId", "createdAt")
SELECT md5(random()::text || clock_timestamp()::text || "id" || "customerId"), "id", "customerId", CURRENT_TIMESTAMP
FROM "User"
WHERE "customerId" IS NOT NULL
ON CONFLICT ("userId", "customerId") DO NOTHING;

INSERT INTO "UserSupplierAccess" ("id", "userId", "supplierId", "createdAt")
SELECT md5(random()::text || clock_timestamp()::text || "id" || "supplierId"), "id", "supplierId", CURRENT_TIMESTAMP
FROM "User"
WHERE "supplierId" IS NOT NULL
ON CONFLICT ("userId", "supplierId") DO NOTHING;

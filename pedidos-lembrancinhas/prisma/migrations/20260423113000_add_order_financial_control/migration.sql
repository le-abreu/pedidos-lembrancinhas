CREATE TYPE "PaymentMethod" AS ENUM ('PIX', 'TRANSFER', 'CREDIT_CARD', 'BOLETO');

CREATE TYPE "PaymentInstallmentMode" AS ENUM ('SINGLE', 'INSTALLMENT');

CREATE TYPE "OrderPaymentInstallmentStatus" AS ENUM ('OPEN', 'PAID');

CREATE TABLE "OrderPaymentPlan" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "installmentMode" "PaymentInstallmentMode" NOT NULL DEFAULT 'SINGLE',
    "installmentsCount" INTEGER NOT NULL DEFAULT 1,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "OrderPaymentPlan_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OrderPaymentInstallment" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "notes" TEXT,
    "status" "OrderPaymentInstallmentStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "OrderPaymentInstallment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "OrderPaymentPlan_orderId_idx" ON "OrderPaymentPlan"("orderId");
CREATE INDEX "OrderPaymentInstallment_dueAt_idx" ON "OrderPaymentInstallment"("dueAt");
CREATE UNIQUE INDEX "OrderPaymentInstallment_planId_number_key" ON "OrderPaymentInstallment"("planId", "number");

ALTER TABLE "OrderPaymentPlan"
ADD CONSTRAINT "OrderPaymentPlan_orderId_fkey"
FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OrderPaymentPlan"
ADD CONSTRAINT "OrderPaymentPlan_createdById_fkey"
FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "OrderPaymentInstallment"
ADD CONSTRAINT "OrderPaymentInstallment_planId_fkey"
FOREIGN KEY ("planId") REFERENCES "OrderPaymentPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

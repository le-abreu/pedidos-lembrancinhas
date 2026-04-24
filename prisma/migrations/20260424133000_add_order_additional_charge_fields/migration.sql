ALTER TABLE "Order"
ADD COLUMN "additionalChargeAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN "additionalChargeReason" TEXT;

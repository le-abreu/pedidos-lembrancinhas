CREATE TYPE "FreightCalculationType" AS ENUM (
  'PICKUP',
  'FIXED',
  'DISTANCE',
  'REGION',
  'WEIGHT',
  'EXTERNAL_API'
);

ALTER TABLE "Customer"
ADD COLUMN "addressZipCode" TEXT,
ADD COLUMN "addressStreet" TEXT,
ADD COLUMN "addressNumber" TEXT,
ADD COLUMN "addressComplement" TEXT,
ADD COLUMN "addressNeighborhood" TEXT,
ADD COLUMN "addressCity" TEXT,
ADD COLUMN "addressState" TEXT,
ADD COLUMN "addressReference" TEXT;

ALTER TABLE "ShippingMethod"
ADD COLUMN "calculationType" "FreightCalculationType" NOT NULL DEFAULT 'FIXED',
ADD COLUMN "fixedPrice" DECIMAL(10, 2) NOT NULL DEFAULT 0;

UPDATE "ShippingMethod"
SET "calculationType" = 'PICKUP',
    "fixedPrice" = 0
WHERE LOWER("name") = 'retirada';

ALTER TABLE "Order"
ADD COLUMN "itemsSubtotal" DECIMAL(10, 2) NOT NULL DEFAULT 0,
ADD COLUMN "finalTotal" DECIMAL(10, 2) NOT NULL DEFAULT 0,
ADD COLUMN "deliveryZipCode" TEXT,
ADD COLUMN "deliveryStreet" TEXT,
ADD COLUMN "deliveryNumber" TEXT,
ADD COLUMN "deliveryComplement" TEXT,
ADD COLUMN "deliveryNeighborhood" TEXT,
ADD COLUMN "deliveryCity" TEXT,
ADD COLUMN "deliveryState" TEXT,
ADD COLUMN "deliveryReference" TEXT;

UPDATE "Order"
SET "itemsSubtotal" = COALESCE((
      SELECT SUM(oi."quantity" * COALESCE(oi."unitPrice", 0))
      FROM "OrderItem" oi
      WHERE oi."orderId" = "Order"."id"
    ), 0),
    "finalTotal" = COALESCE((
      SELECT SUM(oi."quantity" * COALESCE(oi."unitPrice", 0))
      FROM "OrderItem" oi
      WHERE oi."orderId" = "Order"."id"
    ), 0) + COALESCE("shippingPrice", 0) + COALESCE("additionalChargeAmount", 0);

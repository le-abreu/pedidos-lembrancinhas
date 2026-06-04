ALTER TABLE "OrderType" ADD COLUMN "workflowId" TEXT;
ALTER TABLE "OrderType" ADD COLUMN "minimumQuantity" INTEGER NOT NULL DEFAULT 1;

UPDATE "OrderType" AS ot
SET "workflowId" = w."id"
FROM "Workflow" AS w
WHERE w."orderTypeId" = ot."id";

UPDATE "OrderType" AS ot
SET "minimumQuantity" = GREATEST(
  1,
  COALESCE((
    SELECT MAX(otp."defaultQuantity")
    FROM "OrderTypeProduct" AS otp
    WHERE otp."orderTypeId" = ot."id"
  ), 1)
);

UPDATE "OrderTypeProduct" AS otp
SET "defaultQuantity" = 1
FROM "OrderType" AS ot
WHERE otp."orderTypeId" = ot."id"
  AND ot."minimumQuantity" > 1
  AND otp."defaultQuantity" = ot."minimumQuantity";

ALTER TABLE "Workflow" DROP CONSTRAINT IF EXISTS "Workflow_orderTypeId_fkey";
DROP INDEX IF EXISTS "Workflow_orderTypeId_key";
ALTER TABLE "Workflow" DROP COLUMN "orderTypeId";

ALTER TABLE "OrderType"
ADD CONSTRAINT "OrderType_workflowId_fkey"
FOREIGN KEY ("workflowId") REFERENCES "Workflow"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "OrderType_workflowId_idx" ON "OrderType"("workflowId");

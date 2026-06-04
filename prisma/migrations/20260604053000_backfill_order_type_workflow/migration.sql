UPDATE "OrderType"
SET "workflowId" = (
  SELECT "id"
  FROM "Workflow"
  WHERE "active" = true
  ORDER BY "createdAt" ASC, "name" ASC
  LIMIT 1
)
WHERE "workflowId" IS NULL
  AND EXISTS (
    SELECT 1
    FROM "Workflow"
    WHERE "active" = true
  );

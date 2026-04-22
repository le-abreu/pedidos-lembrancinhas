ALTER TABLE "WorkflowPhase"
ADD COLUMN "requiresSupplier" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "responsibleSupplierId" TEXT;

ALTER TABLE "WorkflowPhase"
ADD CONSTRAINT "WorkflowPhase_responsibleSupplierId_fkey"
FOREIGN KEY ("responsibleSupplierId")
REFERENCES "Supplier"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

CREATE INDEX "WorkflowPhase_responsibleSupplierId_idx"
ON "WorkflowPhase"("responsibleSupplierId");

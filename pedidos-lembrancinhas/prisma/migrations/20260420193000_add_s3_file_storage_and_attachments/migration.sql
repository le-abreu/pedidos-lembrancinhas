CREATE TYPE "AttachmentEntityType" AS ENUM ('ORDER', 'ORDER_PHASE_EXECUTION', 'INVOICE');

CREATE TABLE "StoredFile" (
  "id" TEXT NOT NULL,
  "bucket" TEXT NOT NULL,
  "objectKey" TEXT NOT NULL,
  "originalName" TEXT NOT NULL,
  "mimeType" TEXT,
  "byteSize" INTEGER NOT NULL,
  "checksumSha256" TEXT,
  "uploadedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "StoredFile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FileAttachment" (
  "id" TEXT NOT NULL,
  "storedFileId" TEXT NOT NULL,
  "entityType" "AttachmentEntityType" NOT NULL,
  "entityId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FileAttachment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StoredFile_objectKey_key" ON "StoredFile"("objectKey");
CREATE INDEX "FileAttachment_entityType_entityId_idx" ON "FileAttachment"("entityType", "entityId");
CREATE INDEX "FileAttachment_storedFileId_idx" ON "FileAttachment"("storedFileId");

ALTER TABLE "StoredFile"
ADD CONSTRAINT "StoredFile_uploadedById_fkey"
FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "FileAttachment"
ADD CONSTRAINT "FileAttachment_storedFileId_fkey"
FOREIGN KEY ("storedFileId") REFERENCES "StoredFile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OrderPhaseExecution" DROP COLUMN "fileUrl";
ALTER TABLE "Invoice" DROP COLUMN "fileUrl";

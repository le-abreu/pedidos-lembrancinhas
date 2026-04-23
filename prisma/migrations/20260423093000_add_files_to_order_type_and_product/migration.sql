ALTER TABLE "OrderType"
ADD COLUMN "fileStoredFileId" TEXT;

ALTER TABLE "OrderTypeProduct"
ADD COLUMN "fileStoredFileId" TEXT;

ALTER TABLE "OrderType"
ADD CONSTRAINT "OrderType_fileStoredFileId_fkey"
FOREIGN KEY ("fileStoredFileId") REFERENCES "StoredFile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "OrderTypeProduct"
ADD CONSTRAINT "OrderTypeProduct_fileStoredFileId_fkey"
FOREIGN KEY ("fileStoredFileId") REFERENCES "StoredFile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "OrderType_fileStoredFileId_idx" ON "OrderType"("fileStoredFileId");
CREATE INDEX "OrderTypeProduct_fileStoredFileId_idx" ON "OrderTypeProduct"("fileStoredFileId");

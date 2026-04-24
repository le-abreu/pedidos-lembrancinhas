ALTER TABLE "User"
ADD COLUMN "avatarStoredFileId" TEXT;

ALTER TABLE "User"
ADD CONSTRAINT "User_avatarStoredFileId_fkey"
FOREIGN KEY ("avatarStoredFileId") REFERENCES "StoredFile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

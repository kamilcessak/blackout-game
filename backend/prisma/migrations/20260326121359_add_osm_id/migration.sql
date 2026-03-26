-- AlterTable
ALTER TABLE "Location" ADD COLUMN "osmId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Location_osmId_key" ON "Location"("osmId");

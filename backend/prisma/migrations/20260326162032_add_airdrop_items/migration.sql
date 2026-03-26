-- CreateTable
CREATE TABLE "AirdropItem" (
    "id" SERIAL NOT NULL,
    "locationId" INTEGER NOT NULL,
    "itemId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "AirdropItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AirdropItem_locationId_itemId_key" ON "AirdropItem"("locationId", "itemId");

-- AddForeignKey
ALTER TABLE "AirdropItem" ADD CONSTRAINT "AirdropItem_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AirdropItem" ADD CONSTRAINT "AirdropItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

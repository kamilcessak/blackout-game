-- CreateTable
CREATE TABLE "UserLocationCooldown" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "locationId" INTEGER NOT NULL,
    "lootedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserLocationCooldown_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserLocationCooldown_userId_locationId_key" ON "UserLocationCooldown"("userId", "locationId");

-- AddForeignKey
ALTER TABLE "UserLocationCooldown" ADD CONSTRAINT "UserLocationCooldown_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserLocationCooldown" ADD CONSTRAINT "UserLocationCooldown_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

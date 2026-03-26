-- CreateTable
CREATE TABLE "GameConfig" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "xpPerLoot" INTEGER NOT NULL DEFAULT 10,
    "baseStorage" INTEGER NOT NULL DEFAULT 10,
    "storagePerLevel" INTEGER NOT NULL DEFAULT 5,

    CONSTRAINT "GameConfig_pkey" PRIMARY KEY ("id")
);

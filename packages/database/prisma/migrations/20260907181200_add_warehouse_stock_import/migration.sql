-- CreateEnum
CREATE TYPE "WarehouseStockImportState" AS ENUM ('draft', 'applied');

-- CreateEnum
CREATE TYPE "WarehouseStockImportSnapshotState" AS ENUM ('NOT_MATCHED', 'UNTOUCHED', 'MISSING_INPUT', 'MODIFIED');

-- CreateTable
CREATE TABLE "WarehouseStockImport" (
    "id" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "state" "WarehouseStockImportState" NOT NULL DEFAULT 'draft',
    "appliedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WarehouseStockImport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WarehouseStockImportSnapshot" (
    "id" TEXT NOT NULL,
    "importId" TEXT NOT NULL,
    "warehouseStockId" TEXT,
    "previousStock" INTEGER,
    "newStock" INTEGER,
    "externalId" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "modelName" TEXT,
    "state" "WarehouseStockImportSnapshotState" NOT NULL,

    CONSTRAINT "WarehouseStockImportSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WarehouseStockImport_warehouseId_idx" ON "WarehouseStockImport"("warehouseId");

-- CreateIndex
CREATE UNIQUE INDEX "WarehouseStockImport_warehouseId_draft_key" ON "WarehouseStockImport"("warehouseId") WHERE "state" = 'draft';

-- CreateIndex
CREATE INDEX "WarehouseStockImportSnapshot_importId_idx" ON "WarehouseStockImportSnapshot"("importId");

-- CreateIndex
CREATE INDEX "WarehouseStockImportSnapshot_warehouseStockId_idx" ON "WarehouseStockImportSnapshot"("warehouseStockId");

-- AddForeignKey
ALTER TABLE "WarehouseStockImport" ADD CONSTRAINT "WarehouseStockImport_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarehouseStockImportSnapshot" ADD CONSTRAINT "WarehouseStockImportSnapshot_importId_fkey" FOREIGN KEY ("importId") REFERENCES "WarehouseStockImport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarehouseStockImportSnapshot" ADD CONSTRAINT "WarehouseStockImportSnapshot_warehouseStockId_fkey" FOREIGN KEY ("warehouseStockId") REFERENCES "WarehouseStock"("id") ON UPDATE CASCADE;

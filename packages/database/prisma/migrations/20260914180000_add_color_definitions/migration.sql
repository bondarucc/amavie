-- CreateTable
CREATE TABLE "ColorDefinition" (
    "id" TEXT NOT NULL,
    "displayValue" TEXT NOT NULL,
    "normalizedValue" TEXT NOT NULL,
    "hex" TEXT NOT NULL,

    CONSTRAINT "ColorDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductColor" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "colorDefinitionId" TEXT NOT NULL,

    CONSTRAINT "ProductColor_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "ProductVariant" DROP CONSTRAINT "ProductVariant_productId_fkey";
DROP INDEX "ProductVariant_productId_size_color_key";
ALTER TABLE "ProductVariant" DROP COLUMN "productId";
ALTER TABLE "ProductVariant" DROP COLUMN "color";
ALTER TABLE "ProductVariant" ADD COLUMN "productColorId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ProductImage" DROP CONSTRAINT "ProductImage_productId_fkey";
DROP INDEX "ProductImage_productId_color_idx";
ALTER TABLE "ProductImage" DROP COLUMN "productId";
ALTER TABLE "ProductImage" DROP COLUMN "color";
ALTER TABLE "ProductImage" ADD COLUMN "productColorId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Model" ADD COLUMN "primaryImageId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "ColorDefinition_normalizedValue_key" ON "ColorDefinition"("normalizedValue");

-- CreateIndex
CREATE INDEX "ColorDefinition_displayValue_idx" ON "ColorDefinition"("displayValue");

-- CreateIndex
CREATE UNIQUE INDEX "ProductColor_productId_colorDefinitionId_key" ON "ProductColor"("productId", "colorDefinitionId");

-- CreateIndex
CREATE INDEX "ProductColor_colorDefinitionId_idx" ON "ProductColor"("colorDefinitionId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariant_productColorId_size_key" ON "ProductVariant"("productColorId", "size");

-- CreateIndex
CREATE INDEX "ProductImage_productColorId_idx" ON "ProductImage"("productColorId");

-- CreateIndex
CREATE UNIQUE INDEX "Model_primaryImageId_key" ON "Model"("primaryImageId");

-- AddForeignKey
ALTER TABLE "ProductColor" ADD CONSTRAINT "ProductColor_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductColor" ADD CONSTRAINT "ProductColor_colorDefinitionId_fkey" FOREIGN KEY ("colorDefinitionId") REFERENCES "ColorDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_productColorId_fkey" FOREIGN KEY ("productColorId") REFERENCES "ProductColor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductImage" ADD CONSTRAINT "ProductImage_productColorId_fkey" FOREIGN KEY ("productColorId") REFERENCES "ProductColor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Model" ADD CONSTRAINT "Model_primaryImageId_fkey" FOREIGN KEY ("primaryImageId") REFERENCES "ProductImage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

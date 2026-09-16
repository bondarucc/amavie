import { cacheLife, cacheTag } from "next/cache";
import { Prisma } from "@amavie/database";
import prisma from "@/lib/prisma";
import { PRODUCTS_CACHE_TAG } from "../products/const";
import {
  ALL_WAREHOUSES,
  PAGE_SIZE,
  WAREHOUSES_CACHE_TAG,
  WAREHOUSE_STOCK_CACHE_TAG,
} from "./const";
import type { StockQuery, StockRow, WarehouseOption } from "./query";

export async function cachedWarehouses(): Promise<WarehouseOption[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(WAREHOUSES_CACHE_TAG);

  return prisma.warehouse.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
}

export async function cachedProductColorImages(productColorId: string) {
  "use cache";
  cacheLife("hours");
  cacheTag(PRODUCTS_CACHE_TAG);

  return prisma.productImage.findMany({
    where: { productColorId },
    select: { id: true, filename: true },
    orderBy: { createdAt: "asc" },
  });
}

export async function cachedStockTable(query: StockQuery): Promise<{
  rows: StockRow[];
  total: number;
  selectedWarehouseName: string | null;
}> {
  "use cache";
  cacheLife("hours");
  cacheTag(WAREHOUSE_STOCK_CACHE_TAG);

  const warehouses = await prisma.warehouse.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  const warehouseId =
    query.warehouse !== ALL_WAREHOUSES &&
    warehouses.some((warehouse) => warehouse.id === query.warehouse)
      ? query.warehouse
      : null;

  const productWhere: Prisma.ProductWhereInput = {};
  if (query.externalId) {
    productWhere.externalId = {
      contains: query.externalId,
      mode: "insensitive",
    };
  }
  if (query.modelName) {
    productWhere.model = {
      name: { contains: query.modelName, mode: "insensitive" },
    };
  }

  const colorWhere: Prisma.ColorDefinitionWhereInput | undefined = query.color
    ? { displayValue: { contains: query.color, mode: "insensitive" } }
    : undefined;

  const where: Prisma.ProductVariantWhereInput = {
    ...(query.size
      ? { size: { contains: query.size, mode: "insensitive" } }
      : {}),
    productColor: {
      ...(colorWhere ? { colorDefinition: colorWhere } : {}),
      ...(Object.keys(productWhere).length > 0 ? { product: productWhere } : {}),
    },
  };

  const orderBy = buildOrderBy(query);

  const [total, variants] = await Promise.all([
    prisma.productVariant.count({ where }),
    prisma.productVariant.findMany({
      where,
      orderBy,
      skip: (query.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        size: true,
        productColor: {
          select: {
            id: true,
            product: {
              select: {
                id: true,
                externalId: true,
                description: true,
                model: { select: { name: true, type: true } },
              },
            },
            colorDefinition: { select: { displayValue: true } },
          },
        },
        stocks: {
          where: warehouseId ? { warehouseId } : undefined,
          select: {
            stock: true,
            warehouseId: true,
            warehouse: { select: { name: true } },
          },
          orderBy: { warehouse: { name: "asc" } },
        },
      },
    }),
  ]);

  const rows: StockRow[] = variants.map((variant) => {
    const warehouseStocks = variant.stocks.map((entry) => ({
      warehouseId: entry.warehouseId,
      warehouseName: entry.warehouse.name,
      stock: entry.stock,
    }));

    return {
      variantId: variant.id,
      productId: variant.productColor.product.id,
      productColorId: variant.productColor.id,
      modelName: variant.productColor.product.model.name,
      modelType: variant.productColor.product.model.type,
      externalId: variant.productColor.product.externalId,
      description: variant.productColor.product.description,
      size: variant.size,
      color: variant.productColor.colorDefinition.displayValue,
      stock: warehouseStocks.reduce((sum, entry) => sum + entry.stock, 0),
      warehouseStocks,
    };
  });

  return {
    rows,
    total,
    selectedWarehouseName: warehouseId
      ? (warehouses.find((warehouse) => warehouse.id === warehouseId)?.name ??
        null)
      : null,
  };
}

function buildOrderBy(
  query: StockQuery,
): Prisma.ProductVariantOrderByWithRelationInput[] {
  const dir = query.dir;

  if (query.sort === "externalId") {
    return [
      { productColor: { product: { externalId: dir } } },
      { productColor: { product: { model: { name: "asc" } } } },
      { size: "asc" },
    ];
  }

  if (query.sort === "color") {
    return [
      { productColor: { colorDefinition: { displayValue: dir } } },
      { productColor: { product: { model: { name: "asc" } } } },
      { productColor: { product: { externalId: "asc" } } },
      { size: "asc" },
    ];
  }

  if (query.sort === "modelName") {
    return [
      { productColor: { product: { model: { name: dir } } } },
      { productColor: { product: { externalId: "asc" } } },
      { size: "asc" },
    ];
  }

  return [
    { productColor: { product: { model: { name: "asc" } } } },
    { productColor: { product: { externalId: "asc" } } },
    { size: "asc" },
  ];
}

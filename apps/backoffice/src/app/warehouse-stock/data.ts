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

export async function cachedProductColorImages(
  productId: string,
  color: string,
) {
  "use cache";
  cacheLife("hours");
  cacheTag(PRODUCTS_CACHE_TAG);

  return prisma.productImage.findMany({
    where: { productId, color },
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

  const where: Prisma.ProductVariantWhereInput = {
    ...(query.size
      ? { size: { contains: query.size, mode: "insensitive" } }
      : {}),
    ...(query.color
      ? { color: { contains: query.color, mode: "insensitive" } }
      : {}),
    ...(Object.keys(productWhere).length > 0 ? { product: productWhere } : {}),
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
        color: true,
        productId: true,
        product: {
          select: {
            externalId: true,
            description: true,
            model: { select: { name: true, type: true } },
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
      productId: variant.productId,
      modelName: variant.product.model.name,
      modelType: variant.product.model.type,
      externalId: variant.product.externalId,
      description: variant.product.description,
      size: variant.size,
      color: variant.color,
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
      { product: { externalId: dir } },
      { product: { model: { name: "asc" } } },
      { size: "asc" },
    ];
  }

  if (query.sort === "color") {
    return [
      { color: dir },
      { product: { model: { name: "asc" } } },
      { product: { externalId: "asc" } },
      { size: "asc" },
    ];
  }

  if (query.sort === "modelName") {
    return [
      { product: { model: { name: dir } } },
      { product: { externalId: "asc" } },
      { size: "asc" },
    ];
  }

  return [
    { product: { model: { name: "asc" } } },
    { product: { externalId: "asc" } },
    { size: "asc" },
  ];
}

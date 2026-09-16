"use server";

import { Prisma } from "@amavie/database";
import { redirect } from "next/navigation";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { cachedProductColorImages } from "./data";
import { WAREHOUSES_CACHE_TAG, WAREHOUSE_STOCK_CACHE_TAG } from "./const";
import { syncDraftSnapshotsAfterStockUpdate } from "./import/syncDraftSnapshots";

export type CreateWarehouseState = {
  fieldError?: string;
  formError?: string;
};

function uniqueConstraintFields(error: unknown): string[] {
  if (
    !(error instanceof Prisma.PrismaClientKnownRequestError) ||
    error.code !== "P2002"
  ) {
    return [];
  }

  const target = error.meta?.target;
  if (Array.isArray(target)) {
    return target.map(String);
  }
  if (typeof target === "string") {
    return [target];
  }
  return [];
}

export async function createWarehouse(
  _prev: CreateWarehouseState,
  formData: FormData,
): Promise<CreateWarehouseState> {
  const name = String(formData.get("name") ?? "").trim();

  if (!name) {
    return { fieldError: "Название обязательно" };
  }

  let warehouseId: string;

  try {
    warehouseId = await prisma.$transaction(async (tx) => {
      const warehouse = await tx.warehouse.create({ data: { name } });
      const variants = await tx.productVariant.findMany({
        select: { id: true },
      });

      if (variants.length > 0) {
        await tx.warehouseStock.createMany({
          data: variants.map((variant) => ({
            productVariantId: variant.id,
            warehouseId: warehouse.id,
          })),
        });
      }

      return warehouse.id;
    });
  } catch (error) {
    if (uniqueConstraintFields(error).includes("name")) {
      return { fieldError: "Склад с таким названием уже существует" };
    }

    return { formError: "Не удалось создать склад" };
  }

  revalidateTag(WAREHOUSES_CACHE_TAG, { expire: 0 });
  revalidateTag(WAREHOUSE_STOCK_CACHE_TAG, { expire: 0 });

  const params = new URLSearchParams(String(formData.get("from") ?? ""));
  params.set("warehouse", warehouseId);
  params.delete("page");
  redirect(`/warehouse-stock?${params.toString()}`);
}

const stockEntrySchema = z.object({
  warehouseId: z.string().uuid(),
  stock: z.number().int().min(0, "Остаток не может быть отрицательным"),
});

const updateStocksSchema = z.object({
  productVariantId: z.string().uuid(),
  stocks: z.array(stockEntrySchema).min(1),
});

export async function updateVariantStocks(input: {
  productVariantId: string;
  stocks: { warehouseId: string; stock: number }[];
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = updateStocksSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, error: "Укажите целое неотрицательное число" };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const updated: { warehouseStockId: string; stock: number }[] = [];

      for (const entry of parsed.data.stocks) {
        const row = await tx.warehouseStock.update({
          where: {
            productVariantId_warehouseId: {
              productVariantId: parsed.data.productVariantId,
              warehouseId: entry.warehouseId,
            },
          },
          data: { stock: entry.stock },
          select: { id: true, stock: true },
        });
        updated.push({ warehouseStockId: row.id, stock: row.stock });
      }

      await syncDraftSnapshotsAfterStockUpdate(tx, updated);
    });
  } catch {
    return { ok: false, error: "Не удалось обновить остаток" };
  }

  revalidateTag(WAREHOUSE_STOCK_CACHE_TAG, { expire: 0 });
  return { ok: true };
}

export async function getProductColorImages(productColorId: string) {
  return cachedProductColorImages(productColorId);
}

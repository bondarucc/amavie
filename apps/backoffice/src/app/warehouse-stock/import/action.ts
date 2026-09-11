"use server";

import {
  WarehouseStockImportSnapshotState,
  type Prisma,
} from "@amavie/database";
import { redirect } from "next/navigation";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { WAREHOUSE_STOCK_CACHE_TAG } from "../const";
import { parseStockCsv, type CsvStockRow } from "./parseCsv";

export type UploadImportState = {
  error?: string;
};

const uuidSchema = z.string().uuid();

export async function uploadStockImport(
  _prev: UploadImportState,
  formData: FormData,
): Promise<UploadImportState> {
  const warehouseId = String(formData.get("warehouseId") ?? "");
  if (!uuidSchema.safeParse(warehouseId).success) {
    return { error: "Выберите склад" };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.name.length === 0) {
    return { error: "Выберите CSV-файл" };
  }

  if (!file.name.toLowerCase().endsWith(".csv")) {
    return { error: "Выберите файл в формате CSV" };
  }

  const warehouse = await prisma.warehouse.findUnique({
    where: { id: warehouseId },
    select: { id: true },
  });

  if (!warehouse) {
    return { error: "Склад не найден" };
  }

  const parsed = parseStockCsv(await file.text());
  if (!parsed.ok) {
    return { error: parsed.error };
  }

  const stocks = await loadWarehouseStocks(warehouseId);
  const snapshots = buildSnapshots(parsed.rows, stocks);

  try {
    await prisma.$transaction(async (tx) => {
      await tx.warehouseStockImport.deleteMany({
        where: { warehouseId, state: "draft" },
      });

      await tx.warehouseStockImport.create({
        data: {
          warehouseId,
          filename: file.name,
          state: "draft",
          snapshots: { createMany: { data: snapshots } },
        },
      });
    });
  } catch {
    return { error: "Не удалось сохранить импорт" };
  }

  redirect(`/warehouse-stock/import?warehouse=${warehouseId}`);
}

export async function rejectStockImport(formData: FormData) {
  const warehouseId = String(formData.get("warehouseId") ?? "");
  if (!uuidSchema.safeParse(warehouseId).success) {
    return;
  }

  await prisma.warehouseStockImport.deleteMany({
    where: { warehouseId, state: "draft" },
  });

  redirect(`/warehouse-stock/import?warehouse=${warehouseId}`);
}

export async function applyStockImport(formData: FormData) {
  const warehouseId = String(formData.get("warehouseId") ?? "");
  if (!uuidSchema.safeParse(warehouseId).success) {
    return;
  }

  const draft = await prisma.warehouseStockImport.findFirst({
    where: { warehouseId, state: "draft" },
    select: { id: true },
  });

  if (!draft) {
    redirect(`/warehouse-stock/import?warehouse=${warehouseId}`);
  }

  await prisma.$transaction(async (tx) => {
    const modified = await tx.warehouseStockImportSnapshot.findMany({
      where: {
        importId: draft.id,
        state: "MODIFIED",
        warehouseStockId: { not: null },
        newStock: { not: null },
      },
      select: { warehouseStockId: true, newStock: true },
    });

    for (const row of modified) {
      if (!row.warehouseStockId || row.newStock === null) {
        continue;
      }

      await tx.warehouseStock.update({
        where: { id: row.warehouseStockId },
        data: { stock: row.newStock },
      });
    }

    await tx.warehouseStockImport.update({
      where: { id: draft.id },
      data: { state: "applied", appliedAt: new Date() },
    });
  });

  revalidateTag(WAREHOUSE_STOCK_CACHE_TAG, { expire: 0 });
  redirect(`/warehouse-stock?warehouse=${warehouseId}`);
}

type StockMatch = {
  id: string;
  stock: number;
  externalId: string;
  size: string;
  color: string;
  modelName: string;
};

async function loadWarehouseStocks(warehouseId: string): Promise<StockMatch[]> {
  const stocks = await prisma.warehouseStock.findMany({
    where: { warehouseId },
    select: {
      id: true,
      stock: true,
      productVariant: {
        select: {
          size: true,
          color: true,
          product: {
            select: {
              externalId: true,
              model: { select: { name: true } },
            },
          },
        },
      },
    },
  });

  return stocks.map((entry) => ({
    id: entry.id,
    stock: entry.stock,
    externalId: entry.productVariant.product.externalId,
    size: entry.productVariant.size,
    color: entry.productVariant.color,
    modelName: entry.productVariant.product.model.name,
  }));
}

function identityKey(externalId: string, size: string, color: string) {
  return `${externalId}\0${size}\0${color}`;
}

function buildSnapshots(
  csvRows: CsvStockRow[],
  stocks: StockMatch[],
): Prisma.WarehouseStockImportSnapshotCreateManyImportInput[] {
  const remaining = new Map(
    stocks.map((stock) => [
      identityKey(
        stock.externalId.trim(),
        stock.size.trim(),
        stock.color.trim(),
      ),
      stock,
    ]),
  );

  const snapshots: Prisma.WarehouseStockImportSnapshotCreateManyImportInput[] =
    [];

  for (const row of csvRows) {
    const matched = remaining.get(
      identityKey(row.externalId, row.size, row.color),
    );

    if (!matched) {
      snapshots.push({
        warehouseStockId: null,
        previousStock: null,
        newStock: row.stock,
        externalId: row.externalId,
        size: row.size,
        color: row.color,
        modelName: null,
        state: WarehouseStockImportSnapshotState.NOT_MATCHED,
      });
      continue;
    }

    remaining.delete(identityKey(row.externalId, row.size, row.color));
    snapshots.push({
      warehouseStockId: matched.id,
      previousStock: matched.stock,
      newStock: row.stock,
      externalId: matched.externalId,
      size: matched.size,
      color: matched.color,
      modelName: matched.modelName,
      state:
        matched.stock === row.stock
          ? WarehouseStockImportSnapshotState.UNTOUCHED
          : WarehouseStockImportSnapshotState.MODIFIED,
    });
  }

  for (const stock of remaining.values()) {
    snapshots.push({
      warehouseStockId: stock.id,
      previousStock: stock.stock,
      newStock: null,
      externalId: stock.externalId,
      size: stock.size,
      color: stock.color,
      modelName: stock.modelName,
      state: WarehouseStockImportSnapshotState.MISSING_INPUT,
    });
  }

  return snapshots;
}

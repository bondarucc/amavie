import { Prisma, WarehouseStockImportSnapshotState } from "@amavie/database";
import prisma from "@/lib/prisma";
import { PAGE_SIZE } from "../const";
import type { ImportQuery } from "./query";

export type DraftImport = {
  id: string;
  filename: string;
  createdAt: Date;
};

export type SnapshotRow = {
  id: string;
  state: WarehouseStockImportSnapshotState;
  modelName: string | null;
  externalId: string;
  size: string;
  color: string;
  previousStock: number | null;
  newStock: number | null;
};

export async function getDraftImport(
  warehouseId: string,
): Promise<DraftImport | null> {
  return prisma.warehouseStockImport.findFirst({
    where: { warehouseId, state: "draft" },
    select: { id: true, filename: true, createdAt: true },
  });
}

export async function getDraftSnapshots(
  importId: string,
  query: ImportQuery,
): Promise<{
  rows: SnapshotRow[];
  total: number;
  hasNotMatched: boolean;
}> {
  const where: Prisma.WarehouseStockImportSnapshotWhereInput = {
    importId,
  };

  if (query.modelName) {
    where.modelName = { contains: query.modelName, mode: "insensitive" };
  }
  if (query.externalId) {
    where.externalId = { contains: query.externalId, mode: "insensitive" };
  }
  if (query.size) {
    where.size = { contains: query.size, mode: "insensitive" };
  }
  if (query.color) {
    where.color = { contains: query.color, mode: "insensitive" };
  }
  if (query.state) {
    where.state = query.state;
  }

  const [total, rows, notMatchedCount] = await Promise.all([
    prisma.warehouseStockImportSnapshot.count({ where }),
    prisma.warehouseStockImportSnapshot.findMany({
      where,
      orderBy: [
        { state: "asc" },
        { externalId: "asc" },
        { size: "asc" },
        { color: "asc" },
      ],
      skip: (query.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        state: true,
        modelName: true,
        externalId: true,
        size: true,
        color: true,
        previousStock: true,
        newStock: true,
      },
    }),
    prisma.warehouseStockImportSnapshot.count({
      where: { importId, state: "NOT_MATCHED" },
    }),
  ]);

  return { rows, total, hasNotMatched: notMatchedCount > 0 };
}

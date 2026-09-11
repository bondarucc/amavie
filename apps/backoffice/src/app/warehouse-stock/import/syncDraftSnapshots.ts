import { Prisma, WarehouseStockImportSnapshotState } from "@amavie/database";

export async function syncDraftSnapshotsAfterStockUpdate(
  tx: Prisma.TransactionClient,
  updates: { warehouseStockId: string; stock: number }[],
) {
  if (updates.length === 0) {
    return;
  }

  const stockById = new Map(
    updates.map((entry) => [entry.warehouseStockId, entry.stock]),
  );
  const snapshots = await tx.warehouseStockImportSnapshot.findMany({
    where: {
      warehouseStockId: { in: [...stockById.keys()] },
      import: { state: "draft" },
    },
  });

  for (const snapshot of snapshots) {
    if (!snapshot.warehouseStockId) {
      continue;
    }

    const previousStock = stockById.get(snapshot.warehouseStockId);
    if (previousStock === undefined) {
      continue;
    }

    const data: Prisma.WarehouseStockImportSnapshotUpdateInput = {
      previousStock,
    };

    if (snapshot.newStock !== null) {
      data.state =
        previousStock === snapshot.newStock
          ? WarehouseStockImportSnapshotState.UNTOUCHED
          : WarehouseStockImportSnapshotState.MODIFIED;
    }

    await tx.warehouseStockImportSnapshot.update({
      where: { id: snapshot.id },
      data,
    });
  }
}

export async function syncDraftSnapshotsForNewStocks(
  tx: Prisma.TransactionClient,
  stocks: Array<{
    id: string;
    warehouseId: string;
    stock: number;
    externalId: string;
    size: string;
    color: string;
    modelName: string;
  }>,
) {
  if (stocks.length === 0) {
    return;
  }

  const warehouseIds = [...new Set(stocks.map((stock) => stock.warehouseId))];
  const drafts = await tx.warehouseStockImport.findMany({
    where: { warehouseId: { in: warehouseIds }, state: "draft" },
    include: {
      snapshots: { where: { state: "NOT_MATCHED" } },
    },
  });
  const draftByWarehouse = new Map(
    drafts.map((draft) => [draft.warehouseId, draft]),
  );

  for (const stock of stocks) {
    const draft = draftByWarehouse.get(stock.warehouseId);
    if (!draft) {
      continue;
    }

    const matchIndex = draft.snapshots.findIndex(
      (snapshot) =>
        snapshot.externalId === stock.externalId &&
        snapshot.size === stock.size &&
        snapshot.color === stock.color,
    );

    if (matchIndex >= 0) {
      const match = draft.snapshots[matchIndex];
      draft.snapshots.splice(matchIndex, 1);

      const state =
        match.newStock === stock.stock
          ? WarehouseStockImportSnapshotState.UNTOUCHED
          : WarehouseStockImportSnapshotState.MODIFIED;

      await tx.warehouseStockImportSnapshot.update({
        where: { id: match.id },
        data: {
          warehouseStockId: stock.id,
          previousStock: stock.stock,
          modelName: stock.modelName,
          state,
        },
      });
      continue;
    }

    await tx.warehouseStockImportSnapshot.create({
      data: {
        importId: draft.id,
        warehouseStockId: stock.id,
        previousStock: stock.stock,
        newStock: null,
        externalId: stock.externalId,
        size: stock.size,
        color: stock.color,
        modelName: stock.modelName,
        state: WarehouseStockImportSnapshotState.MISSING_INPUT,
      },
    });
  }
}

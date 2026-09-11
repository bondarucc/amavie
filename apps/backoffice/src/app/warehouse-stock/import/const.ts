import type { WarehouseStockImportSnapshotState } from "@amavie/database/browser";

export const MAX_IMPORT_ROWS = 1000;

export const SNAPSHOT_STATES = [
  "NOT_MATCHED",
  "UNTOUCHED",
  "MISSING_INPUT",
  "MODIFIED",
] as const satisfies readonly WarehouseStockImportSnapshotState[];

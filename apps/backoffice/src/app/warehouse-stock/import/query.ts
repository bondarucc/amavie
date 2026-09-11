import type { WarehouseStockImportSnapshotState } from "@amavie/database/browser";
import { SNAPSHOT_STATES } from "./const";

export type ImportQuery = {
  warehouse: string;
  modelName: string;
  externalId: string;
  size: string;
  color: string;
  state: WarehouseStockImportSnapshotState | "";
  page: number;
};

type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string {
  if (typeof value === "string") {
    return value;
  }
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }
  return "";
}

export function parseImportQuery(searchParams: SearchParams): ImportQuery {
  const pageValue = Number.parseInt(first(searchParams.page), 10);
  const stateValue = first(searchParams.state).trim();

  return {
    warehouse: first(searchParams.warehouse).trim(),
    modelName: first(searchParams.modelName).trim(),
    externalId: first(searchParams.externalId).trim(),
    size: first(searchParams.size).trim(),
    color: first(searchParams.color).trim(),
    state: SNAPSHOT_STATES.includes(
      stateValue as WarehouseStockImportSnapshotState,
    )
      ? (stateValue as WarehouseStockImportSnapshotState)
      : "",
    page: Number.isFinite(pageValue) && pageValue > 0 ? pageValue : 1,
  };
}

export function toImportSearchParams(query: ImportQuery): URLSearchParams {
  const params = new URLSearchParams();

  if (query.warehouse) {
    params.set("warehouse", query.warehouse);
  }
  if (query.modelName) {
    params.set("modelName", query.modelName);
  }
  if (query.externalId) {
    params.set("externalId", query.externalId);
  }
  if (query.size) {
    params.set("size", query.size);
  }
  if (query.color) {
    params.set("color", query.color);
  }
  if (query.state) {
    params.set("state", query.state);
  }
  if (query.page > 1) {
    params.set("page", String(query.page));
  }

  return params;
}

export function importHref(query: ImportQuery, patch: Partial<ImportQuery>) {
  const next = { ...query, ...patch };
  const qs = toImportSearchParams(next).toString();
  return qs ? `/warehouse-stock/import?${qs}` : "/warehouse-stock/import";
}

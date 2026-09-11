import type { ModelType } from "@amavie/database/browser";
import {
  ALL_WAREHOUSES,
  SORT_COLUMNS,
  type SortColumn,
  type SortDirection,
} from "./const";

export type StockQuery = {
  warehouse: string;
  modelName: string;
  externalId: string;
  size: string;
  color: string;
  sort: SortColumn | null;
  dir: SortDirection;
  page: number;
};

export type WarehouseOption = {
  id: string;
  name: string;
};

export type WarehouseStockEntry = {
  warehouseId: string;
  warehouseName: string;
  stock: number;
};

export type StockRow = {
  variantId: string;
  productId: string;
  modelName: string;
  modelType: ModelType;
  externalId: string;
  description: string;
  size: string;
  color: string;
  stock: number;
  warehouseStocks: WarehouseStockEntry[];
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

export function parseStockQuery(searchParams: SearchParams): StockQuery {
  const sortValue = first(searchParams.sort);
  const dirValue = first(searchParams.dir);
  const pageValue = Number.parseInt(first(searchParams.page), 10);
  const warehouse = first(searchParams.warehouse).trim() || ALL_WAREHOUSES;

  return {
    warehouse,
    modelName: first(searchParams.modelName).trim(),
    externalId: first(searchParams.externalId).trim(),
    size: first(searchParams.size).trim(),
    color: first(searchParams.color).trim(),
    sort: SORT_COLUMNS.includes(sortValue as SortColumn)
      ? (sortValue as SortColumn)
      : null,
    dir: dirValue === "desc" ? "desc" : "asc",
    page: Number.isFinite(pageValue) && pageValue > 0 ? pageValue : 1,
  };
}

export function toSearchParams(query: StockQuery): URLSearchParams {
  const params = new URLSearchParams();

  if (query.warehouse !== ALL_WAREHOUSES) {
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
  if (query.sort) {
    params.set("sort", query.sort);
    params.set("dir", query.dir);
  }
  if (query.page > 1) {
    params.set("page", String(query.page));
  }

  return params;
}

export function stockHref(
  query: StockQuery,
  patch: Partial<StockQuery>,
): string {
  const next = { ...query, ...patch };
  const qs = toSearchParams(next).toString();
  return qs ? `/warehouse-stock?${qs}` : "/warehouse-stock";
}

export function importPageHref(warehouse: string): string {
  if (warehouse !== ALL_WAREHOUSES) {
    return `/warehouse-stock/import?warehouse=${encodeURIComponent(warehouse)}`;
  }
  return "/warehouse-stock/import";
}

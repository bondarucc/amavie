export const WAREHOUSES_CACHE_TAG = "warehouses";
export const WAREHOUSE_STOCK_CACHE_TAG = "warehouse-stock";

export const PAGE_SIZE = 20;

export const ALL_WAREHOUSES = "all";

export const SORT_COLUMNS = ["modelName", "externalId", "color"] as const;

export type SortColumn = (typeof SORT_COLUMNS)[number];
export type SortDirection = "asc" | "desc";

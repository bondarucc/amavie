import { Suspense } from "react";
import { cachedStockTable, cachedWarehouses } from "./data";
import { parseStockQuery } from "./query";
import { WarehouseStockView } from "./WarehouseStockView";
import { WarehouseToolbar } from "./WarehouseToolbar";

export default function WarehouseStockPage({
  searchParams,
}: PageProps<"/warehouse-stock">) {
  return (
    <div className="p-6 max-w-full overflow-y-auto w-full">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold mb-1">Остатки по складам</h1>
        <p className="text-muted-foreground">
          Остатки товаров по складам. Выберите склад или смотрите сумму по всем.
        </p>
      </div>

      <Suspense fallback={<p className="text-muted-foreground">Загрузка…</p>}>
        <WarehouseStockBody searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function WarehouseStockBody({
  searchParams,
}: {
  searchParams: PageProps<"/warehouse-stock">["searchParams"];
}) {
  const query = parseStockQuery(await searchParams);
  const [warehouses, table] = await Promise.all([
    cachedWarehouses(),
    cachedStockTable(query),
  ]);

  return (
    <>
      <WarehouseToolbar warehouses={warehouses} query={query} />
      <WarehouseStockView
        query={query}
        rows={table.rows}
        total={table.total}
        selectedWarehouseName={table.selectedWarehouseName}
      />
    </>
  );
}

import { Suspense } from "react";
import Link from "next/link";
import { cachedWarehouses } from "../data";
import { getDraftImport, getDraftSnapshots } from "./data";
import { ImportView } from "./ImportView";
import { parseImportQuery } from "./query";

export default function WarehouseStockImportPage({
  searchParams,
}: PageProps<"/warehouse-stock/import">) {
  return (
    <div className="w-full max-w-full overflow-y-auto p-6">
      <div className="mb-8">
        <p className="mb-2 text-sm">
          <Link
            href="/warehouse-stock"
            className="text-muted-foreground hover:underline"
          >
            Остатки по складам
          </Link>
        </p>
        <h1 className="mb-1 text-2xl font-semibold">Импорт остатков</h1>
        <p className="text-muted-foreground">
          Загрузите CSV по выбранному складу, проверьте снимок, затем примените
          изменения.
        </p>
      </div>

      <Suspense fallback={<p className="text-muted-foreground">Загрузка…</p>}>
        <ImportBody searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function ImportBody({
  searchParams,
}: {
  searchParams: PageProps<"/warehouse-stock/import">["searchParams"];
}) {
  const query = parseImportQuery(await searchParams);
  const warehouses = await cachedWarehouses();

  if (warehouses.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Сначала создайте склад на странице остатков.
      </p>
    );
  }

  const warehouseId = warehouses.some(
    (warehouse) => warehouse.id === query.warehouse,
  )
    ? query.warehouse
    : "";

  const draft = warehouseId ? await getDraftImport(warehouseId) : null;
  const snapshots = draft
    ? await getDraftSnapshots(draft.id, query)
    : { rows: [], total: 0, hasNotMatched: false };

  return (
    <ImportView
      warehouses={warehouses}
      query={query}
      draft={draft}
      rows={snapshots.rows}
      total={snapshots.total}
      hasNotMatched={snapshots.hasNotMatched}
    />
  );
}

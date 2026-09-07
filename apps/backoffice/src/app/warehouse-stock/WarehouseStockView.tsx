"use client";

import Link from "next/link";
import { useState } from "react";
import { CaretDownIcon, CaretUpIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MODEL_TYPE_LABELS } from "../products/const";
import { EditStockDialog } from "./EditStockDialog";
import { PAGE_SIZE, ALL_WAREHOUSES, type SortColumn } from "./const";
import { stockHref, type StockQuery, type StockRow } from "./query";

export function WarehouseStockView({
  query,
  rows,
  total,
  selectedWarehouseName,
}: {
  query: StockQuery;
  rows: StockRow[];
  total: number;
  selectedWarehouseName: string | null;
}) {
  const [editing, setEditing] = useState<StockRow | null>(null);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const isAllWarehouses = selectedWarehouseName === null;
  const warehouseTitle = selectedWarehouseName ?? "Все склады";

  return (
    <>
      <form
        method="get"
        action="/warehouse-stock"
        className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5"
      >
        {query.warehouse !== ALL_WAREHOUSES && (
          <input type="hidden" name="warehouse" value={query.warehouse} />
        )}
        {query.sort && (
          <>
            <input type="hidden" name="sort" value={query.sort} />
            <input type="hidden" name="dir" value={query.dir} />
          </>
        )}
        <FilterField
          id="filter-modelName"
          name="modelName"
          label="Модель"
          defaultValue={query.modelName}
        />
        <FilterField
          id="filter-externalId"
          name="externalId"
          label="Артикул"
          defaultValue={query.externalId}
        />
        <FilterField
          id="filter-size"
          name="size"
          label="Размер"
          defaultValue={query.size}
        />
        <FilterField
          id="filter-color"
          name="color"
          label="Цвет"
          defaultValue={query.color}
        />
        <div className="flex items-end">
          <Button type="submit" variant="outline">
            Найти
          </Button>
        </div>
      </form>

      <Table>
        <TableHeader>
          <TableRow>
            <SortableHead column="modelName" label="Модель" query={query} />
            <TableHead>Тип</TableHead>
            <SortableHead column="externalId" label="Артикул" query={query} />
            <TableHead>Размер</TableHead>
            <SortableHead column="color" label="Цвет" query={query} />
            <TableHead>Остаток</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-muted-foreground">
                Нет вариантов для отображения.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow key={row.variantId}>
                <TableCell>{row.modelName}</TableCell>
                <TableCell>{MODEL_TYPE_LABELS[row.modelType]}</TableCell>
                <TableCell>{row.externalId}</TableCell>
                <TableCell>{row.size}</TableCell>
                <TableCell>{row.color}</TableCell>
                <TableCell>{row.stock}</TableCell>
                <TableCell>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className={"cursor-pointer"}
                    onClick={() => setEditing(row)}
                  >
                    Изменить
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {total > 0 && (
        <Pagination className="mt-4 justify-end">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href={stockHref(query, { page: Math.max(1, query.page - 1) })}
                text="Назад"
                className={
                  query.page <= 1 ? "pointer-events-none opacity-50" : undefined
                }
                aria-disabled={query.page <= 1}
              />
            </PaginationItem>
            <PaginationItem>
              <span className="px-3 text-sm text-muted-foreground">
                {query.page} / {totalPages}
              </span>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext
                href={stockHref(query, {
                  page: Math.min(totalPages, query.page + 1),
                })}
                text="Вперёд"
                className={
                  query.page >= totalPages
                    ? "pointer-events-none opacity-50"
                    : undefined
                }
                aria-disabled={query.page >= totalPages}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      <EditStockDialog
        row={editing}
        warehouseTitle={warehouseTitle}
        isAllWarehouses={isAllWarehouses}
        onClose={() => setEditing(null)}
      />
    </>
  );
}

function FilterField({
  id,
  name,
  label,
  defaultValue,
}: {
  id: string;
  name: string;
  label: string;
  defaultValue: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} name={name} defaultValue={defaultValue} />
    </div>
  );
}

function SortableHead({
  column,
  label,
  query,
}: {
  column: SortColumn;
  label: string;
  query: StockQuery;
}) {
  const active = (query.sort ?? "modelName") === column;
  const nextDir = active && query.dir === "asc" ? "desc" : "asc";

  return (
    <TableHead>
      <Link
        href={stockHref(query, { sort: column, dir: nextDir, page: 1 })}
        className="inline-flex items-center gap-1 hover:underline"
      >
        {label}
        {active &&
          (query.dir === "desc" ? (
            <CaretDownIcon className="size-3.5" />
          ) : (
            <CaretUpIcon className="size-3.5" />
          ))}
      </Link>
    </TableHead>
  );
}

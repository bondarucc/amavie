"use client";

import { useActionState, useState, type FormEvent } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import type { WarehouseStockImportSnapshotState } from "@amavie/database/browser";
import { SpinnerGapIcon } from "@phosphor-icons/react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PAGE_SIZE } from "../const";
import type { WarehouseOption } from "../query";
import {
  applyStockImport,
  rejectStockImport,
  uploadStockImport,
  type UploadImportState,
} from "./action";
import { SNAPSHOT_STATES } from "./const";
import type { DraftImport, SnapshotRow } from "./data";
import { importHref, type ImportQuery } from "./query";
import { SnapshotStateIcon } from "./SnapshotStateIcon";

const initialUploadState: UploadImportState = {};

const STATE_FILTER_ALL = "all";

const STATE_ITEMS: Record<string, string> = {
  [STATE_FILTER_ALL]: "Все",
  NOT_MATCHED: "Не найден",
  UNTOUCHED: "Без изменений",
  MISSING_INPUT: "Нет в файле",
  MODIFIED: "Изменён",
};

export function ImportView({
  warehouses,
  query,
  draft,
  rows,
  total,
  hasNotMatched,
}: {
  warehouses: WarehouseOption[];
  query: ImportQuery;
  draft: DraftImport | null;
  rows: SnapshotRow[];
  total: number;
  hasNotMatched: boolean;
}) {
  const router = useRouter();
  const selected = warehouses.some(
    (warehouse) => warehouse.id === query.warehouse,
  )
    ? query.warehouse
    : "";
  const warehouseItems = Object.fromEntries(
    warehouses.map((warehouse) => [warehouse.id, warehouse.name]),
  );

  return (
    <>
      <div className="mb-6 flex min-w-56 flex-col gap-1.5">
        <span className="text-sm font-medium">Склад</span>
        <Select
          items={warehouseItems}
          value={selected || null}
          onValueChange={(value) => {
            if (typeof value !== "string") {
              return;
            }
            router.push(`/warehouse-stock/import?warehouse=${value}`);
          }}
        >
          <SelectTrigger className="w-64 max-w-full">
            <SelectValue placeholder="Выберите склад" />
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false} align="start">
            {warehouses.map((warehouse) => (
              <SelectItem key={warehouse.id} value={warehouse.id}>
                {warehouse.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selected ? (
        <WarehouseImportPanel
          warehouseId={selected}
          query={query}
          draft={draft}
          rows={rows}
          total={total}
          hasNotMatched={hasNotMatched}
        />
      ) : (
        <p className="text-sm text-muted-foreground">
          Выберите склад, чтобы загрузить CSV.
        </p>
      )}
    </>
  );
}

function WarehouseImportPanel({
  warehouseId,
  query,
  draft,
  rows,
  total,
  hasNotMatched,
}: {
  warehouseId: string;
  query: ImportQuery;
  draft: DraftImport | null;
  rows: SnapshotRow[];
  total: number;
  hasNotMatched: boolean;
}) {
  const [uploadState, uploadAction, uploading] = useActionState(
    uploadStockImport,
    initialUploadState,
  );
  const [clientError, setClientError] = useState<string>();

  function handleUploadSubmit(event: FormEvent<HTMLFormElement>) {
    const fileInput = event.currentTarget.elements.namedItem("file");
    const file =
      fileInput instanceof HTMLInputElement ? fileInput.files?.[0] : undefined;

    if (!file) {
      event.preventDefault();
      setClientError("Выберите CSV-файл");
      return;
    }

    if (!file.name.toLowerCase().endsWith(".csv")) {
      event.preventDefault();
      setClientError("Выберите файл в формате CSV");
      return;
    }

    setClientError(undefined);
  }

  const error = clientError ?? uploadState.error;

  return (
    <div className="flex flex-col gap-6">
      {draft && (
        <p className="text-sm text-muted-foreground">
          Черновик: {draft.filename}
        </p>
      )}

      <form
        action={uploadAction}
        onSubmit={handleUploadSubmit}
        className="flex flex-wrap items-end gap-3"
      >
        <input type="hidden" name="warehouseId" value={warehouseId} />
        <div className="flex min-w-64 flex-col gap-1.5">
          <Label htmlFor="import-csv">CSV-файл</Label>
          <Input
            id="import-csv"
            name="file"
            type="file"
            accept=".csv,text/csv"
            disabled={uploading}
          />
        </div>
        <Button type="submit" disabled={uploading}>
          {uploading ? "Загрузка…" : "Загрузить"}
        </Button>
      </form>
      <p className="text-sm text-muted-foreground">
        Файл без заголовка, столбцы: артикул, размер, цвет, остаток. Разделитель
        — запятая или точка с запятой.
      </p>
      {error && (
        <p className="whitespace-pre-line text-sm text-destructive">{error}</p>
      )}

      {uploading ? (
        <ImportLoadingState />
      ) : (
        draft && (
          <DraftSnapshotTable
            warehouseId={warehouseId}
            query={query}
            rows={rows}
            total={total}
            hasNotMatched={hasNotMatched}
          />
        )
      )}
    </div>
  );
}

function ImportLoadingState() {
  return (
    <div className="flex flex-col gap-3" aria-busy="true" aria-live="polite">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <SpinnerGapIcon className="size-4 animate-spin" />
        Обработка файла…
      </div>
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
  );
}

function DraftSnapshotTable({
  warehouseId,
  query,
  rows,
  total,
  hasNotMatched,
}: {
  warehouseId: string;
  query: ImportQuery;
  rows: SnapshotRow[];
  total: number;
  hasNotMatched: boolean;
}) {
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <form
        method="get"
        action="/warehouse-stock/import"
        className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6"
      >
        <input type="hidden" name="warehouse" value={warehouseId} />
        {query.state && (
          <input type="hidden" name="state" value={query.state} />
        )}
        <FilterField
          id="import-filter-modelName"
          name="modelName"
          label="Модель"
          defaultValue={query.modelName}
        />
        <FilterField
          id="import-filter-externalId"
          name="externalId"
          label="Артикул"
          defaultValue={query.externalId}
        />
        <FilterField
          id="import-filter-size"
          name="size"
          label="Размер"
          defaultValue={query.size}
        />
        <FilterField
          id="import-filter-color"
          name="color"
          label="Цвет"
          defaultValue={query.color}
        />
        <StateFilter query={query} />
        <div className="flex items-end">
          <Button type="submit" variant="outline">
            Найти
          </Button>
        </div>
      </form>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Статус</TableHead>
            <TableHead>Модель</TableHead>
            <TableHead>Артикул</TableHead>
            <TableHead>Размер</TableHead>
            <TableHead>Цвет</TableHead>
            <TableHead>Было</TableHead>
            <TableHead>Станет</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-muted-foreground">
                Нет записей для отображения.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  <SnapshotStateIcon state={row.state} />
                </TableCell>
                <TableCell>{row.modelName ?? ""}</TableCell>
                <TableCell>{row.externalId}</TableCell>
                <TableCell>{row.size}</TableCell>
                <TableCell>{row.color}</TableCell>
                <TableCell>
                  {row.previousStock === null ? "" : row.previousStock}
                </TableCell>
                <TableCell>
                  {row.newStock === null ? "" : row.newStock}
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
                href={importHref(query, { page: Math.max(1, query.page - 1) })}
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
                href={importHref(query, {
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

      <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
        <form action={rejectStockImport}>
          <input type="hidden" name="warehouseId" value={warehouseId} />
          <PendingSubmitButton variant="outline" pendingLabel="Удаление…">
            Отклонить
          </PendingSubmitButton>
        </form>
        <form
          action={applyStockImport}
          className="flex flex-wrap items-center gap-3"
        >
          {hasNotMatched && (
            <p className="text-sm text-destructive">
              Игнорировать неизвестные записи
            </p>
          )}
          <input type="hidden" name="warehouseId" value={warehouseId} />
          <PendingSubmitButton pendingLabel="Применение…">
            Подтвердить
          </PendingSubmitButton>
        </form>
      </div>
    </>
  );
}

function StateFilter({ query }: { query: ImportQuery }) {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-1.5">
      <Label>Статус</Label>
      <Select
        items={STATE_ITEMS}
        value={query.state || STATE_FILTER_ALL}
        onValueChange={(value) => {
          if (typeof value !== "string") {
            return;
          }
          router.push(
            importHref(query, {
              state:
                value === STATE_FILTER_ALL
                  ? ""
                  : (value as WarehouseStockImportSnapshotState),
              page: 1,
            }),
          );
        }}
      >
        <SelectTrigger className="w-full max-w-full">
          <SelectValue placeholder="Все" />
        </SelectTrigger>
        <SelectContent alignItemWithTrigger={false} align="start">
          <SelectItem value={STATE_FILTER_ALL}>Все</SelectItem>
          {SNAPSHOT_STATES.map((state) => (
            <SelectItem key={state} value={state}>
              <SnapshotStateIcon state={state} />
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
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

function PendingSubmitButton({
  children,
  pendingLabel,
  variant,
}: {
  children: string;
  pendingLabel: string;
  variant?: "outline";
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant={variant} disabled={pending}>
      {pending ? pendingLabel : children}
    </Button>
  );
}

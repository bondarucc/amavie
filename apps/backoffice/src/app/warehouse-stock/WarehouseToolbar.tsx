"use client";

import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CreateWarehouseDialog } from "./CreateWarehouseDialog";
import { ALL_WAREHOUSES } from "./const";
import {
  importPageHref,
  stockHref,
  type StockQuery,
  type WarehouseOption,
} from "./query";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function WarehouseToolbar({
  warehouses,
  query,
}: {
  warehouses: WarehouseOption[];
  query: StockQuery;
}) {
  const router = useRouter();
  const items: Record<string, string> = {
    [ALL_WAREHOUSES]: "Все",
    ...Object.fromEntries(
      warehouses.map((warehouse) => [warehouse.id, warehouse.name]),
    ),
  };
  const selected =
    query.warehouse !== ALL_WAREHOUSES && items[query.warehouse]
      ? query.warehouse
      : ALL_WAREHOUSES;

  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div className="flex min-w-56 flex-col gap-1.5">
        <span className="text-sm font-medium">Склад</span>
        <Select
          items={items}
          value={selected}
          onValueChange={(value) => {
            if (typeof value !== "string") {
              return;
            }
            router.push(stockHref(query, { warehouse: value, page: 1 }));
          }}
        >
          <SelectTrigger className="w-64 max-w-full">
            <SelectValue placeholder="Выберите склад" />
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false} align="start">
            <SelectItem value={ALL_WAREHOUSES}>Все</SelectItem>
            {warehouses.map((warehouse) => (
              <SelectItem key={warehouse.id} value={warehouse.id}>
                {warehouse.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={importPageHref(selected)}
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          Импорт
        </Link>
        <CreateWarehouseDialog query={query} />
      </div>
    </div>
  );
}

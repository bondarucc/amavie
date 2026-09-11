"use client";

import type { WarehouseStockImportSnapshotState } from "@amavie/database/browser";
import {
  CheckIcon,
  MinusIcon,
  QuestionIcon,
  XIcon,
} from "@phosphor-icons/react";

export function SnapshotStateIcon({
  state,
  className,
}: {
  state: WarehouseStockImportSnapshotState;
  className?: string;
}) {
  switch (state) {
    case "NOT_MATCHED":
      return (
        <XIcon
          className={className ?? "size-7 text-red-500"}
          weight="bold"
          aria-label="Не найден"
        />
      );
    case "UNTOUCHED":
      return (
        <MinusIcon
          className={className ?? "size-4 text-muted-foreground"}
          aria-label="Без изменений"
        />
      );
    case "MODIFIED":
      return (
        <CheckIcon
          className={className ?? "size-5 text-green-600"}
          weight="bold"
          aria-label="Изменён"
        />
      );
    case "MISSING_INPUT":
      return (
        <QuestionIcon
          className={className ?? "size-4 text-muted-foreground"}
          aria-label="Нет в файле"
        />
      );
  }
}

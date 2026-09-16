"use client";

import { useEffect, useState, type FormEvent } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { getProductColorImages, updateVariantStocks } from "./action";
import type { StockRow } from "./query";

type ColorImage = {
  id: string;
  filename: string;
};

export function EditStockDialog({
  row,
  warehouseTitle,
  isAllWarehouses,
  onClose,
}: {
  row: StockRow | null;
  warehouseTitle: string;
  isAllWarehouses: boolean;
  onClose: () => void;
}) {
  return (
    <Dialog
      open={row !== null}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Изменить остаток — {warehouseTitle}</DialogTitle>
        </DialogHeader>
        {row && (
          <EditStockForm
            key={row.variantId}
            row={row}
            isAllWarehouses={isAllWarehouses}
            onClose={onClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function initialValues(row: StockRow, isAllWarehouses: boolean) {
  if (isAllWarehouses) {
    return Object.fromEntries(
      row.warehouseStocks.map((entry) => [
        entry.warehouseId,
        String(entry.stock),
      ]),
    );
  }

  const warehouseId = row.warehouseStocks[0]?.warehouseId;
  return warehouseId ? { [warehouseId]: "" } : {};
}

function EditStockForm({
  row,
  isAllWarehouses,
  onClose,
}: {
  row: StockRow;
  isAllWarehouses: boolean;
  onClose: () => void;
}) {
  const [values, setValues] = useState(() =>
    initialValues(row, isAllWarehouses),
  );
  const [error, setError] = useState<string | undefined>();
  const [pending, setPending] = useState(false);
  const single = row.warehouseStocks[0];

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const stocks: { warehouseId: string; stock: number }[] = [];
    for (const [warehouseId, raw] of Object.entries(values)) {
      const stock = Number(raw);
      if (!Number.isInteger(stock) || stock < 0) {
        setError("Укажите целое неотрицательное число");
        return;
      }
      stocks.push({ warehouseId, stock });
    }

    if (stocks.length === 0) {
      setError("Нет складов для обновления");
      return;
    }

    setPending(true);
    setError(undefined);
    const result = await updateVariantStocks({
      productVariantId: row.variantId,
      stocks,
    });
    setPending(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    onClose();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Field>
        <FieldLabel>Модель</FieldLabel>
        <p className="text-sm">{row.modelName}</p>
      </Field>
      <Field>
        <FieldLabel>Артикул</FieldLabel>
        <p className="text-sm">{row.externalId}</p>
      </Field>
      <Field>
        <FieldLabel>Описание</FieldLabel>
        <p className="text-sm">{row.description}</p>
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field>
          <FieldLabel>Цвет</FieldLabel>
          <p className="text-sm">{row.color}</p>
        </Field>
        <Field>
          <FieldLabel>Размер</FieldLabel>
          <p className="text-sm">{row.size}</p>
        </Field>
      </div>
      <Field>
        <FieldLabel>Изображения</FieldLabel>
        <ModalColorImages productColorId={row.productColorId} />
      </Field>
      {isAllWarehouses ? (
        <div className="flex flex-col gap-3">
          {row.warehouseStocks.length === 0 && (
            <p className="text-sm text-muted-foreground">Нет складов.</p>
          )}
          {row.warehouseStocks.map((entry) => (
            <Field key={entry.warehouseId}>
              <FieldLabel htmlFor={`stock-${entry.warehouseId}`}>
                {entry.warehouseName}
              </FieldLabel>
              <p className="text-sm text-muted-foreground">
                Текущий остаток: {entry.stock}
              </p>
              <Input
                id={`stock-${entry.warehouseId}`}
                type="number"
                min={0}
                step={1}
                value={values[entry.warehouseId] ?? ""}
                onChange={(event) => {
                  setValues((current) => ({
                    ...current,
                    [entry.warehouseId]: event.target.value,
                  }));
                }}
              />
            </Field>
          ))}
        </div>
      ) : (
        <Field>
          <FieldLabel htmlFor="new-stock">Новый остаток</FieldLabel>
          <p className="text-sm text-muted-foreground">
            Текущий остаток: {single?.stock ?? row.stock}
          </p>
          <Input
            id="new-stock"
            type="number"
            min={0}
            step={1}
            value={single ? (values[single.warehouseId] ?? "") : ""}
            onChange={(event) => {
              if (!single) {
                return;
              }
              setValues({ [single.warehouseId]: event.target.value });
            }}
          />
        </Field>
      )}
      {error && <FieldError>{error}</FieldError>}
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={onClose}
        >
          Отмена
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Сохранение…" : "Сохранить"}
        </Button>
      </div>
    </form>
  );
}

function ModalColorImages({ productColorId }: { productColorId: string }) {
  const [images, setImages] = useState<ColorImage[] | null>(null);

  useEffect(() => {
    let cancelled = false;

    getProductColorImages(productColorId)
      .then((result) => {
        if (!cancelled) {
          setImages(result);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setImages([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [productColorId]);

  if (images === null) {
    return <p className="text-sm text-muted-foreground">Загрузка…</p>;
  }

  if (images.length === 0) {
    return <p className="text-sm text-muted-foreground">Нет изображений.</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {images.map((image) => (
        <div
          key={image.id}
          className="relative size-21 shrink-0 overflow-hidden rounded-(--radius) border"
        >
          <Image
            src={`/products/images/${image.filename}`}
            alt=""
            fill
            sizes="84px"
            className="object-cover"
          />
        </div>
      ))}
    </div>
  );
}

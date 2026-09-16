"use client";

import { useMemo, useState } from "react";
import { XIcon } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { CreateColorDefinitionModal } from "../../colors/CreateColorDefinitionDialog";
import type { ColorOption } from "../../colors/color";
import { ColorImages } from "./ColorImages";
import {
  useCreateProductForm,
  useProductDraft,
} from "./CreateProductFormContext";

export function ColorsField({ productId }: { productId: string }) {
  const {
    dictionaryColors,
    pendingColors,
    addColor,
    addPendingColor,
    removeColor,
  } = useCreateProductForm();
  const { product, errors } = useProductDraft(productId);
  const [createOpen, setCreateOpen] = useState(false);

  const colorById = useMemo(() => {
    const map = new Map<string, ColorOption>();
    for (const color of [...dictionaryColors, ...pendingColors]) {
      map.set(color.id, color);
    }
    return map;
  }, [dictionaryColors, pendingColors]);

  const availableColors = useMemo(
    () =>
      [...dictionaryColors, ...pendingColors].filter(
        (color) => !product.colorIds.includes(color.id),
      ),
    [dictionaryColors, pendingColors, product.colorIds],
  );

  const reservedNormalizedValues = useMemo(
    () =>
      [...dictionaryColors, ...pendingColors].map(
        (color) => color.normalizedValue,
      ),
    [dictionaryColors, pendingColors],
  );

  return (
    <Field>
      <FieldLabel>Цвета</FieldLabel>
      <div className="flex gap-2">
        <div className="min-w-0 flex-1">
          <Combobox
            items={availableColors}
            value={null}
            onValueChange={(value) => {
              if (value) {
                addColor(productId, value);
              }
            }}
            itemToStringLabel={(item: ColorOption) => item.displayValue}
          >
            <ComboboxInput placeholder="Найти цвет" />
            <ComboboxContent>
              <ComboboxEmpty>Цвета не найдены</ComboboxEmpty>
              <ComboboxList>
                {(item: ColorOption) => (
                  <ComboboxItem key={item.id} value={item}>
                    <span
                      className="size-3.5 shrink-0 rounded-sm border border-border"
                      style={{ backgroundColor: item.hex }}
                      aria-hidden
                    />
                    <span className="truncate">{item.displayValue}</span>
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => setCreateOpen(true)}
        >
          Создать цвет
        </Button>
      </div>
      <CreateColorDefinitionModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        mode="validate"
        reservedNormalizedValues={reservedNormalizedValues}
        onValidated={(color) => addPendingColor(productId, color)}
      />
      {product.colorIds.length > 0 && (
        <div className="flex flex-col gap-3">
          {product.colorIds.map((colorId) => {
            const color = colorById.get(colorId);
            if (!color) {
              return null;
            }
            return (
              <div
                key={colorId}
                className="flex flex-col gap-2 rounded-(--radius) border border-border p-3"
              >
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="gap-1.5">
                    <span
                      className="size-3 shrink-0 rounded-sm border border-border"
                      style={{ backgroundColor: color.hex }}
                      aria-hidden
                    />
                    {color.displayValue}
                  </Badge>
                  <button
                    type="button"
                    aria-label={`Удалить цвет ${color.displayValue}`}
                    onClick={() => removeColor(productId, colorId)}
                  >
                    <XIcon />
                  </button>
                </div>
                <ColorImages
                  productId={productId}
                  colorId={colorId}
                  colorLabel={color.displayValue}
                  items={product.images[colorId] ?? []}
                />
              </div>
            );
          })}
        </div>
      )}
      <FieldError>{errors?.colors}</FieldError>
      <FieldError>{errors?.images}</FieldError>
    </Field>
  );
}

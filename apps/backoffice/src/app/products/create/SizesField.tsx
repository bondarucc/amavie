"use client";

import { useRef, useState } from "react";
import { SizeType } from "@amavie/database/browser";
import { XIcon } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { DIMENSION_PATTERN, LETTER_SIZES, NUMERIC_SIZES } from "../const";
import {
  useCreateProductForm,
  useProductDraft,
} from "./CreateProductFormContext";

export function SizesField({ productId }: { productId: string }) {
  const { model } = useCreateProductForm();
  const { product, errors, update } = useProductDraft(productId);
  const { sizeType } = model;
  const { sizes } = product;

  return (
    <Field>
      <FieldLabel>Размеры</FieldLabel>
      {sizeType !== SizeType.Dimension && (
        <ToggleGroup
          multiple
          variant="outline"
          className="flex w-full flex-wrap"
          value={sizes}
          onValueChange={(value) => update({ sizes: value })}
        >
          {(sizeType === SizeType.Letter ? LETTER_SIZES : NUMERIC_SIZES).map(
            (size) => (
              <ToggleGroupItem key={size} value={size}>
                {size}
              </ToggleGroupItem>
            ),
          )}
        </ToggleGroup>
      )}
      {sizeType === SizeType.Dimension && (
        <DimensionSizeField
          sizes={sizes}
          onSizesChange={(nextSizes) => update({ sizes: nextSizes })}
        />
      )}
      <FieldError>{errors?.sizes}</FieldError>
    </Field>
  );
}

function DimensionSizeField({
  sizes,
  onSizesChange,
}: {
  sizes: string[];
  onSizesChange: (sizes: string[]) => void;
}) {
  const dimensionDraftRef = useRef<HTMLInputElement>(null);
  const [dimensionError, setDimensionError] = useState<string>();

  function addDimension() {
    const next = dimensionDraftRef.current?.value.trim() ?? "";
    if (!DIMENSION_PATTERN.test(next)) {
      setDimensionError("Размер в формате 40x60");
      return;
    }
    onSizesChange([...new Set([...sizes, next])]);
    if (dimensionDraftRef.current) {
      dimensionDraftRef.current.value = "";
    }
    setDimensionError(undefined);
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          ref={dimensionDraftRef}
          placeholder="например, 40x60"
          aria-invalid={dimensionError ? true : undefined}
          onChange={() => setDimensionError(undefined)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addDimension();
            }
          }}
        />
        <Button type="button" variant="outline" onClick={addDimension}>
          Добавить
        </Button>
      </div>
      {dimensionError && <FieldError>{dimensionError}</FieldError>}
      {sizes.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {sizes.map((size) => (
            <Badge key={size} variant="secondary">
              {size}
              <button
                type="button"
                aria-label={`Удалить размер ${size}`}
                onClick={() =>
                  onSizesChange(sizes.filter((item) => item !== size))
                }
              >
                <XIcon />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

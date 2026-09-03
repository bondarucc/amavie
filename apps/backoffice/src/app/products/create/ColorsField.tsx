"use client";

import { useRef } from "react";
import { XIcon } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ColorImages } from "./ColorImages";
import { useCreateProductForm, useProductDraft } from "./CreateProductFormContext";

export function ColorsField({ productId }: { productId: string }) {
  const { removeColor } = useCreateProductForm();
  const { product, errors, update } = useProductDraft(productId);
  const colorDraftRef = useRef<HTMLInputElement>(null);

  function addColor() {
    const next = colorDraftRef.current?.value.trim() ?? "";
    if (!next) {
      return;
    }
    update({ colors: [...new Set([...product.colors, next])] });
    if (colorDraftRef.current) {
      colorDraftRef.current.value = "";
    }
  }

  return (
    <Field>
      <FieldLabel>Цвета</FieldLabel>
      <div className="flex gap-2">
        <Input
          ref={colorDraftRef}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addColor();
            }
          }}
        />
        <Button type="button" variant="outline" onClick={addColor}>
          Добавить
        </Button>
      </div>
      {product.colors.length > 0 && (
        <div className="flex flex-col gap-3">
          {product.colors.map((color) => (
            <div
              key={color}
              className="flex flex-col gap-2 rounded-(--radius) border border-border p-3"
            >
              <div className="flex items-center justify-between">
                <Badge variant="secondary">{color}</Badge>
                <button
                  type="button"
                  aria-label={`Удалить цвет ${color}`}
                  onClick={() => removeColor(productId, color)}
                >
                  <XIcon />
                </button>
              </div>
              <ColorImages
                productId={productId}
                color={color}
                items={product.images[color] ?? []}
              />
            </div>
          ))}
        </div>
      )}
      <FieldError>{errors?.colors}</FieldError>
      <FieldError>{errors?.images}</FieldError>
    </Field>
  );
}

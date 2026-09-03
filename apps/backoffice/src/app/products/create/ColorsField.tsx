"use client";

import { useRef } from "react";
import { XIcon } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useProductDraft } from "./CreateProductFormContext";

export function ColorsField({ productId }: { productId: string }) {
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
        <div className="flex flex-wrap gap-1.5">
          {product.colors.map((color) => (
            <Badge key={color} variant="secondary">
              {color}
              <button
                type="button"
                aria-label={`Удалить цвет ${color}`}
                onClick={() =>
                  update({
                    colors: product.colors.filter((item) => item !== color),
                  })
                }
              >
                <XIcon />
              </button>
            </Badge>
          ))}
        </div>
      )}
      <FieldError>{errors?.colors}</FieldError>
    </Field>
  );
}

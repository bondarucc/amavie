"use client";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ColorsField } from "./ColorsField";
import {
  useCreateProductForm,
  useProductDraft,
} from "./CreateProductFormContext";
import { SizesField } from "./SizesField";

export function ProductFields({ productId }: { productId: string }) {
  const { products, removeProduct } = useCreateProductForm();
  const { product, errors, update } = useProductDraft(productId);

  return (
    <FieldGroup>
      {products.length > 1 && (
        <div className="flex justify-end">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => removeProduct(productId)}
          >
            Удалить артикул
          </Button>
        </div>
      )}
      <Field>
        <FieldLabel htmlFor={`externalId-${productId}`}>Артикул</FieldLabel>
        <Input
          id={`externalId-${productId}`}
          value={product.externalId}
          onChange={(event) => update({ externalId: event.target.value })}
          placeholder="например, 3.1847 A2"
          aria-invalid={!!errors?.externalId}
        />
        <FieldError>{errors?.externalId}</FieldError>
      </Field>

      <Field>
        <FieldLabel htmlFor={`description-${productId}`}>Описание</FieldLabel>
        <Textarea
          id={`description-${productId}`}
          value={product.description}
          onChange={(event) => update({ description: event.target.value })}
          aria-invalid={!!errors?.description}
        />
        <FieldError>{errors?.description}</FieldError>
      </Field>

      <Field>
        <FieldLabel htmlFor={`fabric-${productId}`}>Ткань</FieldLabel>
        <Input
          id={`fabric-${productId}`}
          value={product.fabric}
          onChange={(event) => update({ fabric: event.target.value })}
          aria-invalid={!!errors?.fabric}
        />
        <FieldError>{errors?.fabric}</FieldError>
      </Field>

      <SizesField productId={productId} />
      <ColorsField productId={productId} />
    </FieldGroup>
  );
}

import { Badge } from "@/components/ui/badge";
import { Field, FieldLabel } from "@/components/ui/field";
import { ColorImageGallery } from "./ColorImageGallery";
import type { ProductWithRelations } from "./ProductViewTabs";

export function ProductView({ product }: { product: ProductWithRelations }) {
  const sizes = [...new Set(product.variants.map((variant) => variant.size))];
  const colors = [
    ...new Set(product.variants.map((variant) => variant.color)),
  ];

  return (
    <div className="flex flex-col gap-6">
      <Field>
        <FieldLabel>Описание</FieldLabel>
        <p className="text-sm">{product.description}</p>
      </Field>

      <Field>
        <FieldLabel>Ткань</FieldLabel>
        <p className="text-sm">{product.fabric}</p>
      </Field>

      <Field>
        <FieldLabel>Размеры</FieldLabel>
        <div className="flex flex-wrap gap-1.5">
          {sizes.map((size) => (
            <Badge key={size} variant="secondary">
              {size}
            </Badge>
          ))}
        </div>
      </Field>

      <Field>
        <FieldLabel>Цвета</FieldLabel>
        <ColorImageGallery colors={colors} images={product.images} />
      </Field>
    </div>
  );
}

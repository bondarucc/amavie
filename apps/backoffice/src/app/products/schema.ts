import { ModelType, SizeType } from "@amavie/database/browser";
import { z } from "zod";
import {
  DIMENSION_PATTERN,
  EXTERNAL_ID_PATTERN,
  LETTER_SIZES,
  NAME_PATTERN,
  NUMERIC_SIZES,
} from "./const";

const letterSizeSet = new Set<string>(LETTER_SIZES);
const numericSizeSet = new Set<string>(NUMERIC_SIZES);

const productDraftSchema = z.object({
  externalId: z
    .string()
    .trim()
    .regex(EXTERNAL_ID_PATTERN, "Формат артикула: 3.1847 A2"),
  description: z.string().trim().min(1, "Описание обязательно"),
  fabric: z.string().trim().min(1, "Укажите ткань"),
  sizes: z
    .array(z.string().trim().min(1))
    .min(1, "Добавьте хотя бы один размер"),
  colors: z
    .array(z.string().trim().min(1))
    .min(1, "Добавьте хотя бы один цвет"),
});

export const createProductSchema = z
  .object({
    type: z.enum(ModelType, { error: "Выберите тип товара" }),
    name: z
      .string()
      .trim()
      .regex(NAME_PATTERN, "Название должно быть одним словом"),
    sizeType: z.enum(SizeType, { error: "Выберите тип размера" }),
    products: z
      .array(productDraftSchema)
      .min(1, "Добавьте хотя бы один артикул"),
  })
  .superRefine((data, ctx) => {
    const seenExternalIds = new Map<string, number>();

    for (const [productIndex, product] of data.products.entries()) {
      const previousIndex = seenExternalIds.get(product.externalId);
      if (previousIndex !== undefined) {
        ctx.addIssue({
          code: "custom",
          path: ["products", productIndex, "externalId"],
          message: "Артикул должен быть уникальным",
        });
      } else {
        seenExternalIds.set(product.externalId, productIndex);
      }

      for (const [sizeIndex, size] of product.sizes.entries()) {
        const valid =
          data.sizeType === SizeType.Letter
            ? letterSizeSet.has(size)
            : data.sizeType === SizeType.Numeric
              ? numericSizeSet.has(size)
              : DIMENSION_PATTERN.test(size);

        if (!valid) {
          ctx.addIssue({
            code: "custom",
            path: ["products", productIndex, "sizes", sizeIndex],
            message:
              data.sizeType === SizeType.Dimension
                ? "Размер в формате 40x60"
                : "Недопустимый размер для выбранного типа",
          });
        }
      }
    }
  });

export type CreateProductInput = z.infer<typeof createProductSchema>;

export type ProductFieldErrors = Partial<{
  externalId: string;
  description: string;
  fabric: string;
  sizes: string;
  colors: string;
}>;

export type CreateProductState = {
  fieldErrors?: {
    type?: string;
    name?: string;
    sizeType?: string;
    products?: ProductFieldErrors[];
  };
  formError?: string;
};

function parseProducts(formData: FormData) {
  const products = [];

  for (let index = 0; formData.has(`products.${index}.externalId`); index++) {
    products.push({
      externalId: String(formData.get(`products.${index}.externalId`) ?? ""),
      description: String(formData.get(`products.${index}.description`) ?? ""),
      fabric: String(formData.get(`products.${index}.fabric`) ?? ""),
      sizes: formData
        .getAll(`products.${index}.sizes`)
        .map(String)
        .filter(Boolean),
      colors: formData
        .getAll(`products.${index}.colors`)
        .map(String)
        .filter(Boolean),
    });
  }

  return products;
}

export function parseCreateProductForm(formData: FormData) {
  return createProductSchema.safeParse({
    type: String(formData.get("type") ?? ""),
    name: String(formData.get("name") ?? ""),
    sizeType: String(formData.get("sizeType") ?? ""),
    products: parseProducts(formData),
  });
}

export function fieldErrorsFromZod(
  error: z.ZodError,
): CreateProductState["fieldErrors"] {
  const fieldErrors: NonNullable<CreateProductState["fieldErrors"]> = {};
  const productErrors: ProductFieldErrors[] = [];

  for (const issue of error.issues) {
    const [head, second, third] = issue.path;

    if (head === "products") {
      if (typeof second !== "number") {
        continue;
      }

      productErrors[second] ??= {};
      const field =
        third === "externalId" ||
        third === "description" ||
        third === "fabric" ||
        third === "sizes" ||
        third === "colors"
          ? third
          : undefined;

      if (field && !productErrors[second][field]) {
        productErrors[second][field] = issue.message;
      }

      continue;
    }

    if (head === "type" || head === "name" || head === "sizeType") {
      fieldErrors[head] ??= issue.message;
    }
  }

  if (productErrors.length > 0) {
    fieldErrors.products = productErrors;
  }

  return fieldErrors;
}

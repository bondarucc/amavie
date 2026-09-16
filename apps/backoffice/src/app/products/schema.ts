import { ModelType, SizeType } from "@amavie/database/browser";
import { z } from "zod";
import { HEX_PATTERN, normalizeDisplayValue } from "../colors/color";
import {
  DIMENSION_PATTERN,
  EXTERNAL_ID_PATTERN,
  LETTER_SIZES,
  MAX_IMAGES_PER_COLOR,
  MIN_IMAGES_PER_COLOR,
  NAME_PATTERN,
  NUMERIC_SIZES,
} from "./const";

const letterSizeSet = new Set<string>(LETTER_SIZES);
const numericSizeSet = new Set<string>(NUMERIC_SIZES);

const pendingColorSchema = z.object({
  id: z.uuid(),
  displayValue: z.string().trim().min(1, "Название обязательно"),
  hex: z
    .string()
    .trim()
    .toLowerCase()
    .regex(HEX_PATTERN, "Укажите цвет в формате #RRGGBB"),
});

const productImageGroupSchema = z.object({
  colorKey: z.uuid(),
  items: z
    .array(
      z.object({
        id: z.string().trim().min(1),
        filename: z.string().trim().min(1),
      }),
    )
    .min(MIN_IMAGES_PER_COLOR, "Добавьте хотя бы одно изображение")
    .max(
      MAX_IMAGES_PER_COLOR,
      `Не более ${MAX_IMAGES_PER_COLOR} изображений на цвет`,
    ),
});

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
  colorKeys: z.array(z.uuid()).min(1, "Добавьте хотя бы один цвет"),
  images: z.array(productImageGroupSchema),
});

export const createProductSchema = z
  .object({
    type: z.enum(ModelType, { error: "Выберите тип товара" }),
    name: z
      .string()
      .trim()
      .regex(NAME_PATTERN, "Название должно быть одним словом"),
    sizeType: z.enum(SizeType, { error: "Выберите тип размера" }),
    primaryImageId: z.uuid("Выберите главное изображение"),
    pendingColors: z.array(pendingColorSchema),
    products: z
      .array(productDraftSchema)
      .min(1, "Добавьте хотя бы один артикул"),
  })
  .superRefine((data, ctx) => {
    const seenExternalIds = new Map<string, number>();
    const pendingNormalized = new Map<string, number>();
    const imageIds = new Set<string>();

    for (const [index, color] of data.pendingColors.entries()) {
      const normalized = normalizeDisplayValue(color.displayValue);
      const previous = pendingNormalized.get(normalized);
      if (previous !== undefined) {
        ctx.addIssue({
          code: "custom",
          path: ["pendingColors", index, "displayValue"],
          message: "Цвет с таким названием уже добавлен",
        });
      } else {
        pendingNormalized.set(normalized, index);
      }
    }

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

      const colorSet = new Set(product.colorKeys);
      if (colorSet.size !== product.colorKeys.length) {
        ctx.addIssue({
          code: "custom",
          path: ["products", productIndex, "colorKeys"],
          message: "Цвета в артикуле не должны повторяться",
        });
      }

      const imageColorSet = new Set(
        product.images.map((group) => group.colorKey),
      );
      const missingImages = product.colorKeys.filter(
        (colorKey) => !imageColorSet.has(colorKey),
      );
      const unknownImages = product.images.filter(
        (group) => !colorSet.has(group.colorKey),
      );

      if (missingImages.length > 0 || unknownImages.length > 0) {
        ctx.addIssue({
          code: "custom",
          path: ["products", productIndex, "images"],
          message: "Для каждого цвета нужно от 1 до 3 изображений",
        });
      }

      for (const group of product.images) {
        for (const item of group.items) {
          imageIds.add(item.id);
        }
      }
    }

    if (!imageIds.has(data.primaryImageId)) {
      ctx.addIssue({
        code: "custom",
        path: ["primaryImageId"],
        message: "Выберите главное изображение",
      });
    }
  });

export type CreateProductInput = z.infer<typeof createProductSchema>;

export type ProductFieldErrors = Partial<{
  externalId: string;
  description: string;
  fabric: string;
  sizes: string;
  colors: string;
  images: string;
}>;

export type CreateProductState = {
  fieldErrors?: {
    type?: string;
    name?: string;
    sizeType?: string;
    primaryImageId?: string;
    products?: ProductFieldErrors[];
  };
  formError?: string;
};

function parseImageGroups(formData: FormData, productIndex: number) {
  const groups = [];

  for (
    let colorIndex = 0;
    formData.has(`products.${productIndex}.imageGroups.${colorIndex}.colorKey`);
    colorIndex++
  ) {
    const colorKey = String(
      formData.get(
        `products.${productIndex}.imageGroups.${colorIndex}.colorKey`,
      ) ?? "",
    );
    const ids = formData
      .getAll(`products.${productIndex}.imageGroups.${colorIndex}.ids`)
      .map(String);
    const filenames = formData
      .getAll(`products.${productIndex}.imageGroups.${colorIndex}.filenames`)
      .map(String);

    groups.push({
      colorKey,
      items: ids.map((id, i) => ({ id, filename: filenames[i] ?? "" })),
    });
  }

  return groups;
}

function parsePendingColors(formData: FormData) {
  const colors = [];

  for (let index = 0; formData.has(`pendingColors.${index}.id`); index++) {
    colors.push({
      id: String(formData.get(`pendingColors.${index}.id`) ?? ""),
      displayValue: String(
        formData.get(`pendingColors.${index}.displayValue`) ?? "",
      ),
      hex: String(formData.get(`pendingColors.${index}.hex`) ?? ""),
    });
  }

  return colors;
}

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
      colorKeys: formData
        .getAll(`products.${index}.colorKeys`)
        .map(String)
        .filter(Boolean),
      images: parseImageGroups(formData, index),
    });
  }

  return products;
}

export function parseCreateProductForm(formData: FormData) {
  return createProductSchema.safeParse({
    type: String(formData.get("type") ?? ""),
    name: String(formData.get("name") ?? ""),
    sizeType: String(formData.get("sizeType") ?? ""),
    primaryImageId: String(formData.get("primaryImageId") ?? ""),
    pendingColors: parsePendingColors(formData),
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
        third === "colorKeys" ||
        third === "images"
          ? third === "colorKeys"
            ? "colors"
            : third
          : undefined;

      if (field && !productErrors[second][field]) {
        productErrors[second][field] = issue.message;
      }

      continue;
    }

    if (
      head === "type" ||
      head === "name" ||
      head === "sizeType" ||
      head === "primaryImageId"
    ) {
      fieldErrors[head] ??= issue.message;
    }
  }

  if (productErrors.length > 0) {
    fieldErrors.products = productErrors;
  }

  return fieldErrors;
}

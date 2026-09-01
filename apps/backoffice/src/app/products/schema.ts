import { ProductType, SizeType } from "@amavie/database/browser";
import { z } from "zod";
import {
  DIMENSION_PATTERN,
  LETTER_SIZES,
  MODEL_NUMBER_PATTERN,
  NAME_PATTERN,
  NUMERIC_SIZES,
} from "./const";

const letterSizeSet = new Set<string>(LETTER_SIZES);
const numericSizeSet = new Set<string>(NUMERIC_SIZES);

export const createProductSchema = z
  .object({
    type: z.enum(ProductType, { error: "Выберите тип товара" }),
    modelNumber: z
      .string()
      .trim()
      .regex(MODEL_NUMBER_PATTERN, "Формат артикула: 3.1847 A2"),
    name: z
      .string()
      .trim()
      .regex(NAME_PATTERN, "Название должно быть одним словом"),
    description: z.string().trim().min(1, "Описание обязательно"),
    fabric: z.string().trim().min(1, "Укажите ткань"),
    sizeType: z.enum(SizeType, { error: "Выберите тип размера" }),
    sizes: z
      .array(z.string().trim().min(1))
      .min(1, "Добавьте хотя бы один размер"),
    colors: z
      .array(z.string().trim().min(1))
      .min(1, "Добавьте хотя бы один цвет"),
  })
  .superRefine((data, ctx) => {
    for (const [index, size] of data.sizes.entries()) {
      const valid =
        data.sizeType === SizeType.Letter
          ? letterSizeSet.has(size)
          : data.sizeType === SizeType.Numeric
            ? numericSizeSet.has(size)
            : DIMENSION_PATTERN.test(size);

      if (!valid) {
        ctx.addIssue({
          code: "custom",
          path: ["sizes", index],
          message:
            data.sizeType === SizeType.Dimension
              ? "Размер в формате 40x60"
              : "Недопустимый размер для выбранного типа",
        });
      }
    }
  });

export type CreateProductInput = z.infer<typeof createProductSchema>;

export function parseCreateProductForm(formData: FormData) {
  return createProductSchema.safeParse({
    type: String(formData.get("type") ?? ""),
    modelNumber: String(formData.get("modelNumber") ?? ""),
    name: String(formData.get("name") ?? ""),
    description: String(formData.get("description") ?? ""),
    fabric: String(formData.get("fabric") ?? ""),
    sizeType: String(formData.get("sizeType") ?? ""),
    sizes: formData.getAll("sizes").map(String).filter(Boolean),
    colors: formData.getAll("colors").map(String).filter(Boolean),
  });
}

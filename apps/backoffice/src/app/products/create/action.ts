"use server";

import { Prisma } from "@amavie/database";
import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { PRODUCTS_CACHE_TAG } from "../const";
import { parseCreateProductForm } from "../schema";

export type CreateProductField =
  | "type"
  | "modelNumber"
  | "name"
  | "description"
  | "fabric"
  | "sizeType"
  | "sizes"
  | "colors";

export type CreateProductState = {
  fieldErrors?: Partial<Record<CreateProductField, string>>;
  formError?: string;
};

function fieldErrorsFromZod(
  error: z.ZodError,
): CreateProductState["fieldErrors"] {
  const { fieldErrors } = z.flattenError(error) as {
    fieldErrors: Partial<Record<string, string[]>>;
  };
  const pick = (key: CreateProductField) => fieldErrors[key]?.[0];

  return {
    type: pick("type"),
    modelNumber: pick("modelNumber"),
    name: pick("name"),
    description: pick("description"),
    fabric: pick("fabric"),
    sizeType: pick("sizeType"),
    sizes: pick("sizes"),
    colors: pick("colors"),
  };
}

function isModelNumberConflict(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

export async function createProduct(
  _prev: CreateProductState,
  formData: FormData,
): Promise<CreateProductState> {
  const parsed = parseCreateProductForm(formData);

  console.log(parsed);

  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFromZod(parsed.error) };
  }

  const {
    type,
    modelNumber,
    name,
    description,
    fabric,
    sizeType,
    sizes,
    colors,
  } = parsed.data;

  try {
    await prisma.product.create({
      data: {
        type,
        modelNumber,
        name,
        description,
        fabric,
        sizeType,
        variants: {
          create: sizes.flatMap((size) =>
            colors.map((color) => ({ size, color, stock: 0 })),
          ),
        },
      },
    });
  } catch (error) {
    if (isModelNumberConflict(error)) {
      return {
        fieldErrors: { modelNumber: "Товар с таким артикулом уже существует" },
      };
    }

    console.log(error);

    return { formError: "Не удалось создать товар" };
  }

  revalidateTag(PRODUCTS_CACHE_TAG, { expire: 0 });
  redirect("/products");
}

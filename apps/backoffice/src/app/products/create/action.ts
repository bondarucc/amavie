"use server";

import { Prisma } from "@amavie/database";
import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { WAREHOUSE_STOCK_CACHE_TAG } from "../../warehouse-stock/const";
import { PRODUCTS_CACHE_TAG } from "../const";
import {
  fieldErrorsFromZod,
  parseCreateProductForm,
  type CreateProductInput,
  type CreateProductState,
  type ProductFieldErrors,
} from "../schema";

export type { CreateProductState, ProductFieldErrors };

function uniqueConstraintFields(error: unknown): string[] {
  if (
    !(error instanceof Prisma.PrismaClientKnownRequestError) ||
    error.code !== "P2002"
  ) {
    return [];
  }

  const target = error.meta?.target;
  if (Array.isArray(target)) {
    return target.map(String);
  }
  if (typeof target === "string") {
    return [target];
  }
  return [];
}

async function conflictFieldErrors(
  error: unknown,
  products: CreateProductInput["products"],
): Promise<CreateProductState | undefined> {
  const fields = uniqueConstraintFields(error);
  if (fields.length === 0) {
    return undefined;
  }

  if (fields.includes("name")) {
    return {
      fieldErrors: { name: "Модель с таким названием уже существует" },
    };
  }

  if (fields.includes("externalId")) {
    const existing = await prisma.product.findMany({
      where: {
        externalId: { in: products.map((product) => product.externalId) },
      },
      select: { externalId: true },
    });
    const taken = new Set(existing.map((product) => product.externalId));
    if (taken.size === 0) {
      return { formError: "Товар с таким артикулом уже существует" };
    }
    const productErrors: ProductFieldErrors[] = products.map((product) =>
      taken.has(product.externalId)
        ? { externalId: "Товар с таким артикулом уже существует" }
        : {},
    );

    return { fieldErrors: { products: productErrors } };
  }

  return undefined;
}

export async function createProduct(
  _prev: CreateProductState,
  formData: FormData,
): Promise<CreateProductState> {
  const parsed = parseCreateProductForm(formData);

  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFromZod(parsed.error) };
  }

  const { type, name, sizeType, products } = parsed.data;

  let modelId: string;

  try {
    modelId = await prisma.$transaction(async (tx) => {
      const model = await tx.model.create({
        data: {
          type,
          name,
          sizeType,
          products: {
            create: products.map((product) => ({
              externalId: product.externalId,
              description: product.description,
              fabric: product.fabric,
              variants: {
                create: product.sizes.flatMap((size) =>
                  product.colors.map((color) => ({ size, color })),
                ),
              },
            })),
          },
        },
        include: { products: { include: { variants: true } } },
      });

      const warehouses = await tx.warehouse.findMany({ select: { id: true } });
      const variantIds = model.products.flatMap((product) =>
        product.variants.map((variant) => variant.id),
      );

      if (warehouses.length > 0 && variantIds.length > 0) {
        await tx.warehouseStock.createMany({
          data: variantIds.flatMap((productVariantId) =>
            warehouses.map((warehouse) => ({
              productVariantId,
              warehouseId: warehouse.id,
            })),
          ),
        });
      }

      const images = model.products.flatMap((createdProduct) => {
        const draft = products.find(
          (product) => product.externalId === createdProduct.externalId,
        );

        return (draft?.images ?? []).flatMap((group) =>
          group.items.map((item) => ({
            id: item.id,
            filename: item.filename,
            color: group.color,
            productId: createdProduct.id,
          })),
        );
      });

      if (images.length > 0) {
        await tx.productImage.createMany({ data: images });
      }

      return model.id;
    });
  } catch (error) {
    const conflict = await conflictFieldErrors(error, products);
    if (conflict) {
      return conflict;
    }

    return { formError: "Не удалось создать модель" };
  }

  revalidateTag(PRODUCTS_CACHE_TAG, { expire: 0 });
  revalidateTag(WAREHOUSE_STOCK_CACHE_TAG, { expire: 0 });
  redirect(`/products/${modelId}`);
}

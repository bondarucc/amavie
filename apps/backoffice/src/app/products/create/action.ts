"use server";

import { Prisma } from "@amavie/database";
import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { COLORS_CACHE_TAG } from "../../colors/const";
import { normalizeDisplayValue } from "../../colors/color";
import { WAREHOUSE_STOCK_CACHE_TAG } from "../../warehouse-stock/const";
import { syncDraftSnapshotsForNewStocks } from "../../warehouse-stock/import/syncDraftSnapshots";
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

  if (fields.includes("normalizedValue")) {
    return { formError: "Цвет с таким названием уже существует" };
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

  const { type, name, sizeType, products, pendingColors, primaryImageId } =
    parsed.data;

  const pendingIds = new Set(pendingColors.map((color) => color.id));
  const existingColorIds = [
    ...new Set(
      products.flatMap((product) =>
        product.colorKeys.filter((key) => !pendingIds.has(key)),
      ),
    ),
  ];

  if (existingColorIds.length > 0) {
    const existing = await prisma.colorDefinition.findMany({
      where: { id: { in: existingColorIds } },
      select: { id: true },
    });
    if (existing.length !== existingColorIds.length) {
      return { formError: "Выбранный цвет больше не существует" };
    }
  }

  let modelId: string;
  let createdPending = false;

  try {
    modelId = await prisma.$transaction(async (tx) => {
      if (pendingColors.length > 0) {
        await tx.colorDefinition.createMany({
          data: pendingColors.map((color) => ({
            id: color.id,
            displayValue: color.displayValue,
            normalizedValue: normalizeDisplayValue(color.displayValue),
            hex: color.hex,
          })),
        });
        createdPending = true;
      }

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
              colors: {
                create: product.colorKeys.map((colorKey) => ({
                  colorDefinitionId: colorKey,
                  variants: {
                    create: product.sizes.map((size) => ({ size })),
                  },
                  images: {
                    create: (
                      product.images.find(
                        (group) => group.colorKey === colorKey,
                      )?.items ?? []
                    ).map((item) => ({
                      id: item.id,
                      filename: item.filename,
                    })),
                  },
                })),
              },
            })),
          },
        },
        include: {
          products: {
            include: {
              colors: {
                include: {
                  variants: true,
                  colorDefinition: {
                    select: { normalizedValue: true, displayValue: true },
                  },
                },
              },
            },
          },
        },
      });

      await tx.model.update({
        where: { id: model.id },
        data: { primaryImageId },
      });

      const warehouses = await tx.warehouse.findMany({ select: { id: true } });
      const createdVariants = model.products.flatMap((product) =>
        product.colors.flatMap((color) =>
          color.variants.map((variant) => ({
            variantId: variant.id,
            size: variant.size,
            externalId: product.externalId,
            normalizedColor: color.colorDefinition.normalizedValue,
            displayColor: color.colorDefinition.displayValue,
            modelName: name,
          })),
        ),
      );

      if (warehouses.length > 0 && createdVariants.length > 0) {
        await tx.warehouseStock.createMany({
          data: createdVariants.flatMap((variant) =>
            warehouses.map((warehouse) => ({
              productVariantId: variant.variantId,
              warehouseId: warehouse.id,
            })),
          ),
        });

        const createdStocks = await tx.warehouseStock.findMany({
          where: {
            productVariantId: {
              in: createdVariants.map((variant) => variant.variantId),
            },
            warehouseId: { in: warehouses.map((warehouse) => warehouse.id) },
          },
          select: {
            id: true,
            warehouseId: true,
            stock: true,
            productVariantId: true,
          },
        });

        const variantById = new Map(
          createdVariants.map((variant) => [variant.variantId, variant]),
        );

        await syncDraftSnapshotsForNewStocks(
          tx,
          createdStocks.map((entry) => {
            const variant = variantById.get(entry.productVariantId);
            return {
              id: entry.id,
              warehouseId: entry.warehouseId,
              stock: entry.stock,
              externalId: variant?.externalId ?? "",
              size: variant?.size ?? "",
              normalizedColor: variant?.normalizedColor ?? "",
              displayColor: variant?.displayColor ?? "",
              modelName: variant?.modelName ?? name,
            };
          }),
        );
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
  if (createdPending) {
    revalidateTag(COLORS_CACHE_TAG, { expire: 0 });
  }
  redirect(`/products/${modelId}`);
}

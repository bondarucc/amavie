"use server";

import { Prisma } from "@amavie/database";
import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { parseColorInput, type ColorOption } from "./color";
import { COLORS_CACHE_TAG } from "./const";

export type CreateColorDefinitionState = {
  fieldError?: string;
  field?: "displayValue" | "hex";
  formError?: string;
  color?: ColorOption;
};

const uuidSchema = z.uuid();

function uniqueConstraintFields(error: unknown): string[] {
  if (
    !(error instanceof Prisma.PrismaClientKnownRequestError) ||
    error.code !== "P2002"
  ) {
    return [];
  }

  return (
    (error.meta?.driverAdapterError as any)?.cause?.constraint?.fields ?? []
  );
}

function parseFormColor(formData: FormData) {
  return parseColorInput(
    String(formData.get("displayValue") ?? ""),
    String(formData.get("hex") ?? ""),
  );
}

function reservedNormalizedValues(formData: FormData) {
  return formData
    .getAll("reservedNormalizedValues")
    .map((value) => String(value).trim().toLowerCase())
    .filter(Boolean);
}

export async function createColorDefinition(
  _prev: CreateColorDefinitionState,
  formData: FormData,
): Promise<CreateColorDefinitionState> {
  const parsed = parseFormColor(formData);
  if ("error" in parsed) {
    return { fieldError: parsed.error, field: parsed.field };
  }
  try {
    await prisma.colorDefinition.create({
      data: {
        displayValue: parsed.displayValue,
        normalizedValue: parsed.normalizedValue,
        hex: parsed.hex,
      },
    });
  } catch (error) {
    if (uniqueConstraintFields(error).includes('"normalizedValue"')) {
      return {
        fieldError: "Цвет с таким названием уже существует",
        field: "displayValue",
      };
    }

    return { formError: "Не удалось создать цвет" };
  }

  revalidateTag(COLORS_CACHE_TAG, { expire: 0 });
  redirect("/colors");
}

export async function validateColorDefinition(
  _prev: CreateColorDefinitionState,
  formData: FormData,
): Promise<CreateColorDefinitionState> {
  const parsed = parseFormColor(formData);
  if ("error" in parsed) {
    return { fieldError: parsed.error, field: parsed.field };
  }

  if (reservedNormalizedValues(formData).includes(parsed.normalizedValue)) {
    return {
      fieldError: "Цвет с таким названием уже добавлен",
      field: "displayValue",
    };
  }

  const existing = await prisma.colorDefinition.findUnique({
    where: { normalizedValue: parsed.normalizedValue },
    select: { id: true },
  });

  if (existing) {
    return {
      fieldError: "Цвет с таким названием уже существует",
      field: "displayValue",
    };
  }

  return {
    color: {
      id: crypto.randomUUID(),
      displayValue: parsed.displayValue,
      hex: parsed.hex,
      normalizedValue: parsed.normalizedValue,
    },
  };
}

export async function deleteColorDefinition(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!uuidSchema.safeParse(id).success) {
    return;
  }

  const used = await prisma.productColor.count({
    where: { colorDefinitionId: id },
  });
  if (used > 0) {
    return;
  }

  try {
    await prisma.colorDefinition.delete({ where: { id } });
  } catch {
    return;
  }

  revalidateTag(COLORS_CACHE_TAG, { expire: 0 });
  redirect("/colors");
}

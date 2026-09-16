import { cacheLife, cacheTag } from "next/cache";
import prisma from "@/lib/prisma";
import { COLORS_CACHE_TAG } from "./const";
import type { ColorDefinitionListItem, ColorOption } from "./color";

export async function cachedColorDefinitions(): Promise<
  ColorDefinitionListItem[]
> {
  "use cache";
  cacheLife("hours");
  cacheTag(COLORS_CACHE_TAG);

  const colors = await prisma.colorDefinition.findMany({
    orderBy: { displayValue: "asc" },
    select: {
      id: true,
      displayValue: true,
      hex: true,
      normalizedValue: true,
      _count: { select: { productColors: true } },
    },
  });

  return colors.map((color) => ({
    id: color.id,
    displayValue: color.displayValue,
    hex: color.hex,
    normalizedValue: color.normalizedValue,
    deletable: color._count.productColors === 0,
  }));
}

export async function cachedColorOptions(): Promise<ColorOption[]> {
  const colors = await cachedColorDefinitions();
  return colors.map(
    ({ id, displayValue, hex, normalizedValue }): ColorOption => ({
      id,
      displayValue,
      hex,
      normalizedValue,
    }),
  );
}

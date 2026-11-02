import { cacheLife, cacheTag } from "next/cache";
import { Suspense } from "react";
import prisma from "@/lib/prisma";
import { groupModelColors } from "./colors";
import { ModelCard } from "./ModelCard";
import { PRODUCTS_CACHE_TAG } from "./const";

export default function CatalogPage() {
  return (
    <div className="mx-auto w-full max-w-page px-gutter ">
      <Suspense fallback={<p className="text-muted-foreground">Загрузка…</p>}>
        <ModelList />
      </Suspense>
    </div>
  );
}

async function getModels() {
  "use cache";
  cacheLife("hours");
  cacheTag(PRODUCTS_CACHE_TAG);

  return prisma.model.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      type: true,
      height: true,
      season: true,
      purposes: true,
      primaryImage: {
        select: {
          filename: true,
        },
      },
      products: {
        select: {
          colors: {
            select: {
              colorDefinition: {
                select: {
                  id: true,
                  displayValue: true,
                  hex: true,
                },
              },
              variants: {
                select: {
                  id: true,
                  size: true,
                },
              },
            },
          },
        },
      },
    },
  });
}

async function ModelList() {
  const models = await getModels();

  if (models.length === 0) {
    return (
      <p className="mt-8 font-display text-h3 text-foreground">
        Пока нет товаров.
      </p>
    );
  }

  return (
    <ul className="mt-8 grid grid-cols-2 gap-grid lg:grid-cols-3">
      {models.map((model) => (
        <li key={model.id}>
          <ModelCard
            name={model.name}
            type={model.type}
            height={model.height}
            season={model.season}
            purposes={model.purposes}
            primaryImage={model.primaryImage}
            colors={groupModelColors(model.products)}
          />
        </li>
      ))}
    </ul>
  );
}

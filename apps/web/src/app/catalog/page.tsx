import { cacheLife, cacheTag } from "next/cache";
import { Suspense } from "react";
import prisma from "@/lib/prisma";
import { ModelCard } from "./ModelCard";
import { PRODUCTS_CACHE_TAG } from "./const";

export default function CatalogPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-10">
      <Suspense fallback={<p className="text-muted-foreground">Загрузка…</p>}>
        <ModelList />
      </Suspense>
    </div>
  );
}

async function ModelList() {
  "use cache";
  cacheLife("hours");
  cacheTag(PRODUCTS_CACHE_TAG);

  const models = await prisma.model.findMany({
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
    },
  });

  if (models.length === 0) {
    return <p className="text-muted-foreground">Пока нет товаров.</p>;
  }

  return (
    <ul className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {models.map((model) => (
        <li key={model.id}>
          <ModelCard
            name={model.name}
            type={model.type}
            height={model.height}
            season={model.season}
            purposes={model.purposes}
            primaryImage={model.primaryImage}
          />
        </li>
      ))}
    </ul>
  );
}

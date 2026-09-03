import Link from "next/link";
import { cacheLife, cacheTag } from "next/cache";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import prisma from "@/lib/prisma";
import { MODEL_TYPE_LABELS, PRODUCTS_CACHE_TAG } from "./const";

export default function ProductsPage() {
  return (
    <div className="p-6 max-w-full overflow-y-auto w-full">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold mb-1">Каталог товаров</h1>
          <p className="text-muted-foreground">
            Список моделей магазина. Остатки по размерам и цветам появятся
            позже.
          </p>
        </div>
        <Button render={<Link href="/products/create" />}>
          Добавить товар
        </Button>
      </div>

      <Suspense fallback={<p className="text-muted-foreground">Загрузка…</p>}>
        <ProductList />
      </Suspense>
    </div>
  );
}

async function ProductList() {
  "use cache";
  cacheLife("hours");
  cacheTag(PRODUCTS_CACHE_TAG);

  const models = await prisma.model.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      type: true,
    },
  });

  if (models.length === 0) {
    return <p className="text-muted-foreground">Пока нет товаров.</p>;
  }

  return (
    <ul className="divide-y divide-border rounded-2xl border border-border">
      {models.map((model) => (
        <li key={model.id}>
          <Link
            href={`/products/${model.id}`}
            className="flex flex-wrap items-baseline justify-between gap-2 px-4 py-3 hover:bg-muted/50"
          >
            <span className="font-medium">{model.name}</span>
            <span className="text-sm text-muted-foreground">
              {MODEL_TYPE_LABELS[model.type]}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

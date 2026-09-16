import { Suspense } from "react";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { MODEL_TYPE_LABELS, SIZE_TYPE_LABELS } from "../const";
import { ProductViewTabs } from "./ProductViewTabs";

// This route has no `generateStaticParams`, so Next would otherwise need to
// prerender a static fallback shell for unknown `[id]`s. The root layout's
// Sidebar reads `usePathname()` outside of Suspense, which blocks that
// fallback shell. This route doesn't need an instant/static shell (it's a
// single admin detail view), so opt it out of that validation entirely.
export const instant = false;

export default function ProductViewPage({
  params,
}: PageProps<"/products/[id]">) {
  return (
    <div className="p-6 max-w-full overflow-y-auto w-full">
      <Suspense fallback={<p className="text-muted-foreground">Загрузка…</p>}>
        <ModelView params={params} />
      </Suspense>
    </div>
  );
}

async function ModelView({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const model = await prisma.model.findUnique({
    where: { id },
    include: {
      products: {
        include: {
          colors: {
            include: {
              colorDefinition: true,
              images: { orderBy: { createdAt: "asc" } },
              variants: true,
            },
          },
        },
      },
    },
  });

  if (!model) {
    notFound();
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold mb-1">{model.name}</h1>
        <p className="text-muted-foreground">
          {MODEL_TYPE_LABELS[model.type]} · {SIZE_TYPE_LABELS[model.sizeType]}
        </p>
      </div>

      <ProductViewTabs products={model.products} />
    </>
  );
}

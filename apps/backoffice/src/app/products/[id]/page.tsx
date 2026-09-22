import { Suspense } from "react";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import {
  MODEL_PURPOSE_LABELS,
  MODEL_SEASON_LABELS,
  MODEL_TYPE_LABELS,
  SIZE_TYPE_LABELS,
} from "../const";
import { ProductViewTabs } from "./ProductViewTabs";
import { Field, FieldLabel } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";

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
      <div className="mb-6 text-sm">
        <h1 className="text-xl mb-4 font-semibold">
          {MODEL_TYPE_LABELS[model.type]} {model.name}
        </h1>
        <div className="flex flex-wrap gap-x-12 gap-y-6">
          <Field className="w-auto">
            <FieldLabel>Сезон</FieldLabel>
            <p>{MODEL_SEASON_LABELS[model.season]}</p>
          </Field>
          <Field className="w-auto">
            <FieldLabel>Ростовка</FieldLabel>
            <p>{model.height}</p>
          </Field>
          <Field className="w-auto">
            <FieldLabel>Стиль</FieldLabel>
            <p>
              {model.purposes.map((purpose) => {
                return (
                  <Badge key={purpose} variant="secondary">
                    {MODEL_PURPOSE_LABELS[purpose]}
                  </Badge>
                );
              })}
            </p>
          </Field>
        </div>
      </div>

      <ProductViewTabs products={model.products} />
    </>
  );
}

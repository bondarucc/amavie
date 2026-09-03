"use client";

import { useState } from "react";
import type {
  ProductImageModel,
  ProductModel,
  ProductVariantModel,
} from "@amavie/database/browser";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductView } from "./ProductView";

export type ProductWithRelations = ProductModel & {
  variants: ProductVariantModel[];
  images: ProductImageModel[];
};

export function ProductViewTabs({
  products,
}: {
  products: ProductWithRelations[];
}) {
  const [activeId, setActiveId] = useState(products[0]?.id ?? "");

  if (products.length === 0) {
    return <p className="text-muted-foreground">Нет артикулов.</p>;
  }

  return (
    <Tabs
      value={activeId}
      onValueChange={(value) => {
        if (typeof value === "string") {
          setActiveId(value);
        }
      }}
    >
      <TabsList
        variant="line"
        className="h-auto min-w-0 flex-wrap justify-start"
      >
        {products.map((product) => (
          <TabsTrigger
            key={product.id}
            value={product.id}
            className="flex-none px-2.5"
          >
            {product.externalId}
          </TabsTrigger>
        ))}
      </TabsList>

      {products.map((product) => (
        <TabsContent key={product.id} value={product.id}>
          <ProductView product={product} />
        </TabsContent>
      ))}
    </Tabs>
  );
}

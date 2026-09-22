"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductView, ProductViewProps } from "./ProductView";
import { FieldLabel } from "@/components/ui/field";

type ProductViewTabsProps = {
  products: Array<ProductViewProps["product"]>;
};

export function ProductViewTabs({ products }: ProductViewTabsProps) {
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
      <div className="flex gap-x-3 mb-3">
        <FieldLabel>Артикулы</FieldLabel>
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
      </div>

      {products.map((product) => (
        <TabsContent key={product.id} value={product.id}>
          <ProductView product={product} />
        </TabsContent>
      ))}
    </Tabs>
  );
}

"use client";

import { PlusIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCreateProductForm } from "./CreateProductFormContext";
import { ProductFields } from "./ProductFields";

function tabLabel(externalId: string) {
  const trimmed = externalId.trim();
  return trimmed || "Новый артикул";
}

export function ProductTabs() {
  const { products, activeProductId, setActiveProductId, addProduct } =
    useCreateProductForm();

  return (
    <Tabs
      value={activeProductId}
      onValueChange={(value) => {
        if (typeof value === "string") {
          setActiveProductId(value);
        }
      }}
    >
      <div className="flex items-start gap-2">
        <TabsList
          variant="line"
          className="h-auto min-w-0 flex-1 flex-wrap justify-start"
        >
          {products.map((product) => (
            <TabsTrigger
              key={product.id}
              value={product.id}
              className="flex-none px-2.5"
            >
              {tabLabel(product.externalId)}
            </TabsTrigger>
          ))}
        </TabsList>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Добавить артикул"
          onClick={addProduct}
        >
          <PlusIcon />
        </Button>
      </div>

      {products.map((product) => (
        <TabsContent key={product.id} value={product.id}>
          <ProductFields productId={product.id} />
        </TabsContent>
      ))}
    </Tabs>
  );
}

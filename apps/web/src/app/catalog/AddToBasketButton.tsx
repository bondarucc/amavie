"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useBasket } from "../basket/BasketProvider";
import type { BasketColorOption } from "./colors";

type AddToBasketButtonProps = {
  title: string;
  colors: BasketColorOption[];
};

export function AddToBasketButton({ title, colors }: AddToBasketButtonProps) {
  const { addItem } = useBasket();
  const [open, setOpen] = useState(false);
  const [colorId, setColorId] = useState<string | null>(null);
  const [variantId, setVariantId] = useState<string | null>(null);

  const selectedColor =
    colors.find((color) => color.colorDefinitionId === colorId) ?? null;
  const selectedSize =
    selectedColor?.sizes.find((size) => size.variantId === variantId) ?? null;

  function handleOpenChange(next: boolean) {
    setOpen(next);

    if (!next) {
      setColorId(null);
      setVariantId(null);
    }
  }

  function handleAdd() {
    if (!selectedColor || !selectedSize) {
      return;
    }

    addItem({
      variantId: selectedSize.variantId,
      title,
      colorName: selectedColor.name,
      colorHex: selectedColor.hex,
      size: selectedSize.size,
    });
    handleOpenChange(false);
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="h-11 w-full px-2 @[17rem]:w-auto @[17rem]:flex-1"
        disabled={colors.length === 0}
        onClick={() => setOpen(true)}
      >
        В корзину
      </Button>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>В корзину</DialogTitle>
            <DialogDescription>{title}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <p className="text-muted-foreground">Цвет</p>
            <div className="flex flex-wrap gap-2">
              {colors.map((color) => {
                const selected = color.colorDefinitionId === colorId;

                return (
                  <button
                    key={color.colorDefinitionId}
                    type="button"
                    aria-label={color.name}
                    aria-pressed={selected}
                    onClick={() => {
                      setColorId(color.colorDefinitionId);
                      setVariantId(null);
                    }}
                    className={cn(
                      "size-8 rounded-full border border-border",
                      selected && "ring-2 ring-ring ring-offset-2",
                    )}
                    style={{ backgroundColor: color.hex }}
                  />
                );
              })}
            </div>
            {selectedColor ? (
              <p className="text-foreground">{selectedColor.name}</p>
            ) : null}
          </div>
          {selectedColor ? (
            <div className="flex flex-col gap-3">
              <p className="text-muted-foreground">Размер</p>
              <div className="flex flex-wrap gap-2">
                {selectedColor.sizes.map((size) => (
                  <Button
                    key={size.variantId}
                    type="button"
                    variant={
                      variantId === size.variantId ? "default" : "outline"
                    }
                    onClick={() => setVariantId(size.variantId)}
                  >
                    {size.size}
                  </Button>
                ))}
              </div>
            </div>
          ) : null}
          <Button type="button" disabled={!selectedSize} onClick={handleAdd}>
            Добавить
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}

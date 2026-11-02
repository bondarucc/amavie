"use client";

import { TrashIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useBasket } from "./BasketProvider";

export default function BasketPage() {
  const { items, ready, removeItem } = useBasket();

  return (
    <div className="mx-auto w-full max-w-page px-gutter">
      <h1 className="mt-8 font-display text-h3 text-foreground">Корзина</h1>
      {!ready ? (
        <p className="mt-8 text-muted-foreground">Загрузка…</p>
      ) : items.length === 0 ? (
        <p className="mt-8 font-display text-h3 text-foreground">
          Корзина пуста.
        </p>
      ) : (
        <ul className="mt-8 flex flex-col">
          {items.map((item) => (
            <li
              key={item.variantId}
              className="flex items-center justify-between gap-4 border-b border-border py-4"
            >
              <div className="flex min-w-0 flex-col gap-1">
                <p className="text-sm text-foreground">{item.title}</p>
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span
                    className="size-3 shrink-0 rounded-full border border-border"
                    style={{ backgroundColor: item.colorHex }}
                    aria-hidden
                  />
                  <span>{item.colorName}</span>
                  <span>{item.size}</span>
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Удалить"
                onClick={() => removeItem(item.variantId)}
              >
                <TrashIcon />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

"use client";

import { TrashIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { deleteColorDefinition } from "./action";
import type { ColorDefinitionListItem } from "./color";

export function ColorTag({ color }: { color: ColorDefinitionListItem }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-2xl border border-border bg-secondary px-2 py-1 text-sm">
      <span
        className="size-4 shrink-0 rounded-sm border border-border"
        style={{ backgroundColor: color.hex }}
        aria-hidden
      />
      <span className="font-medium">{color.displayValue}</span>
      <span className="text-muted-foreground">{color.hex}</span>
      {color.deletable && (
        <form action={deleteColorDefinition} className="flex">
          <input type="hidden" name="id" value={color.id} />
          <Button
            type="submit"
            variant="ghost"
            size="icon-xs"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            aria-label={`Удалить цвет ${color.displayValue}`}
          >
            <TrashIcon />
          </Button>
        </form>
      )}
    </div>
  );
}

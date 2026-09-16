"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { ColorTag } from "./ColorTag";
import { CreateColorDefinitionDialog } from "./CreateColorDefinitionDialog";
import type { ColorDefinitionListItem } from "./color";

export function ColorsView({ colors }: { colors: ColorDefinitionListItem[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) {
      return colors;
    }

    return colors.filter(
      (color) =>
        color.displayValue.toLowerCase().includes(needle) ||
        color.normalizedValue.includes(needle) ||
        color.hex.toLowerCase().includes(needle),
    );
  }, [colors, query]);

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div className="flex min-w-56 flex-1 flex-col gap-1.5">
          <label htmlFor="color-search" className="text-sm font-medium">
            Поиск
          </label>
          <Input
            id="color-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Название или HEX"
          />
        </div>
        <CreateColorDefinitionDialog mode="persist" />
      </div>

      {colors.length === 0 ? (
        <p className="text-muted-foreground">Пока нет цветов.</p>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground">Ничего не найдено.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {filtered.map((color) => (
            <ColorTag key={color.id} color={color} />
          ))}
        </div>
      )}
    </>
  );
}

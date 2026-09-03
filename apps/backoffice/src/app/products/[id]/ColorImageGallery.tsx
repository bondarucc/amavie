"use client";

import { useState } from "react";
import Image from "next/image";
import type { ProductImageModel } from "@amavie/database/browser";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

// Only the images belonging to the currently selected color are rendered
// (and therefore requested/downloaded) at any given time.
export function ColorImageGallery({
  colors,
  images,
}: {
  colors: string[];
  images: ProductImageModel[];
}) {
  const [selectedColor, setSelectedColor] = useState(colors[0] ?? "");
  const [previewFilename, setPreviewFilename] = useState<string | null>(null);

  if (colors.length === 0) {
    return null;
  }

  const visibleImages = images.filter(
    (image) => image.color === selectedColor,
  );

  return (
    <div className="flex flex-col gap-3">
      <ToggleGroup
        variant="outline"
        className="flex w-full flex-wrap"
        value={selectedColor ? [selectedColor] : []}
        onValueChange={(value) => {
          if (value.length > 0) {
            setSelectedColor(value[0]);
          }
        }}
      >
        {colors.map((color) => (
          <ToggleGroupItem key={color} value={color}>
            {color}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      <div className="flex flex-wrap gap-2">
        {visibleImages.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Нет изображений для этого цвета.
          </p>
        )}
        {visibleImages.map((image) => (
          <button
            key={image.id}
            type="button"
            onClick={() => setPreviewFilename(image.filename)}
            className="relative size-21 shrink-0 overflow-hidden rounded-(--radius) border transition-opacity hover:opacity-80"
            aria-label="Открыть изображение"
          >
            <Image
              src={`/products/images/${image.filename}`}
              alt=""
              fill
              sizes="84px"
              className="object-cover"
            />
          </button>
        ))}
      </div>

      <Dialog
        open={previewFilename !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPreviewFilename(null);
          }
        }}
      >
        <DialogContent className="items-center justify-center">
          <DialogTitle className="sr-only">Изображение</DialogTitle>
          {previewFilename && (
            <div className="relative aspect-square w-full max-w-md">
              <Image
                src={`/products/images/${previewFilename}`}
                alt=""
                fill
                sizes="512px"
                className="object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

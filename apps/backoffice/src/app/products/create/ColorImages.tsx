"use client";

import { useEffect, useRef, useState } from "react";
import { PlusIcon, SpinnerGapIcon, StarIcon, XIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import { cn } from "@/lib/utils";
import {
  MAX_IMAGES_PER_COLOR,
  MIN_IMAGES_PER_COLOR,
  PRODUCT_IMAGE_ACCEPT,
} from "../const";
import { type ImageItem, useCreateProductForm } from "./CreateProductFormContext";

export function ColorImages({
  productId,
  colorId,
  colorLabel,
  items,
}: {
  productId: string;
  colorId: string;
  colorLabel: string;
  items: ImageItem[];
}) {
  const { addImages, removeImage, primaryImageId, setPrimaryImageId } =
    useCreateProductForm();
  const inputRef = useRef<HTMLInputElement>(null);
  const canAddMore = items.length < MAX_IMAGES_PER_COLOR;

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (files.length > 0) {
      addImages(productId, colorId, files);
    }
    event.target.value = "";
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-center gap-2">
        {items.map((item) => (
          <ImageThumb
            key={item.localId}
            item={item}
            isPrimary={Boolean(item.id && item.id === primaryImageId)}
            onPrimary={() => {
              if (item.id) {
                setPrimaryImageId(item.id);
              }
            }}
            onRemove={() => removeImage(productId, colorId, item.localId)}
          />
        ))}
        {canAddMore && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex size-16 flex-none flex-col items-center justify-center gap-1 rounded-(--radius) border-2 border-dashed border-border text-muted-foreground transition-colors hover:bg-muted/50"
            aria-label={`Добавить изображение для цвета ${colorLabel}`}
          >
            <PlusIcon className="size-4" />
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={PRODUCT_IMAGE_ACCEPT}
          onChange={handleChange}
          className="sr-only"
        />
      </div>
      {items.length < MIN_IMAGES_PER_COLOR && (
        <p className="text-xs text-muted-foreground">
          Минимум {MIN_IMAGES_PER_COLOR} изображение, максимум{" "}
          {MAX_IMAGES_PER_COLOR}. PNG или JPG, до 5 МБ. Отметьте одно
          изображение модели как главное.
        </p>
      )}
      {items
        .filter((item) => item.status === "error")
        .map((item) => (
          <FieldError key={item.localId}>{item.error}</FieldError>
        ))}
    </div>
  );
}

function ImageThumb({
  item,
  isPrimary,
  onPrimary,
  onRemove,
}: {
  item: ImageItem;
  isPrimary: boolean;
  onPrimary: () => void;
  onRemove: () => void;
}) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(item.file);
    setObjectUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [item.file]);

  const isBusy = item.status === "pending" || item.status === "uploading";
  const canMarkPrimary = item.status === "success" && Boolean(item.id);

  return (
    <div
      className={cn(
        "relative size-16 flex-none overflow-hidden rounded-(--radius) border",
        item.status === "error" && "border-destructive",
        isPrimary && "ring-2 ring-primary",
      )}
    >
      {objectUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={objectUrl}
          src={objectUrl}
          alt=""
          className="size-full object-cover"
          draggable={false}
        />
      )}
      {isBusy && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 bg-background/70 text-foreground">
          <SpinnerGapIcon className="size-4 animate-spin" />
          <span className="text-[10px] font-medium">{item.progress}%</span>
        </div>
      )}
      {item.status === "error" && (
        <div className="absolute inset-0 flex items-center justify-center bg-destructive/10" />
      )}
      {canMarkPrimary && (
        <Button
          type="button"
          variant={isPrimary ? "default" : "secondary"}
          size="icon-xs"
          aria-label={
            isPrimary ? "Главное изображение" : "Сделать главным изображением"
          }
          aria-pressed={isPrimary}
          onClick={onPrimary}
          className="absolute bottom-1 left-1 size-5 rounded-full"
        >
          <StarIcon weight={isPrimary ? "fill" : "regular"} />
        </Button>
      )}
      <Button
        type="button"
        variant="destructive"
        size="icon-xs"
        aria-label="Удалить изображение"
        onClick={onRemove}
        className="absolute top-1 right-1 size-5 rounded-full"
      >
        <XIcon />
      </Button>
    </div>
  );
}

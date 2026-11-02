import Image from "next/image";
import type {
  ModelPurpose,
  ModelSeason,
  ModelType,
} from "@amavie/database/browser";
import { Badge } from "@/components/ui/badge";
import { AddToBasketButton } from "./AddToBasketButton";
import type { BasketColorOption } from "./colors";
import {
  MODEL_PURPOSE_LABELS,
  MODEL_SEASON_LABELS,
  MODEL_TYPE_LABELS,
} from "./const";

type ModelCardProps = {
  name: string;
  type: ModelType;
  height: string;
  season: ModelSeason;
  purposes: ModelPurpose[];
  primaryImage: { filename: string } | null;
  colors: BasketColorOption[];
};

export function ModelCard({
  name,
  type,
  height,
  season,
  purposes,
  primaryImage,
  colors,
}: ModelCardProps) {
  const title = `${MODEL_TYPE_LABELS[type]} ${name}`;

  return (
    <article className="group flex flex-col gap-3">
      <div className="relative aspect-product w-full overflow-hidden rounded-none bg-muted">
        {primaryImage?.filename ? (
          <Image
            src={`/products/images/${primaryImage.filename}`}
            alt={title}
            fill
            sizes="(max-width: 1024px) 50vw, 33vw"
            className="object-cover object-center transition-transform duration-700 ease-brand motion-safe:group-hover:scale-[1.03]"
          />
        ) : null}
      </div>
      <h2 className="font-sans text-sm text-foreground">{title}</h2>
      <div className="flex flex-wrap gap-1.5">
        <Badge variant="outline" className="text-muted-foreground">
          {height}
        </Badge>
        <Badge variant="outline" className="text-muted-foreground">
          {MODEL_SEASON_LABELS[season]}
        </Badge>
        {purposes.map((purpose) => (
          <Badge
            key={purpose}
            variant="outline"
            className="text-muted-foreground"
          >
            {MODEL_PURPOSE_LABELS[purpose]}
          </Badge>
        ))}
      </div>
      <AddToBasketButton title={title} colors={colors} />
    </article>
  );
}

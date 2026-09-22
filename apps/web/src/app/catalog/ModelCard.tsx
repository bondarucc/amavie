import Image from "next/image";
import type {
  ModelPurpose,
  ModelSeason,
  ModelType,
} from "@amavie/database/browser";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
};

export function ModelCard({
  name,
  type,
  height,
  season,
  purposes,
  primaryImage,
}: ModelCardProps) {
  const title = `${MODEL_TYPE_LABELS[type]} ${name}`;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="relative aspect-2667/4000 w-full bg-muted">
          {primaryImage?.filename ? (
            <Image
              src={`/products/images/${primaryImage.filename}`}
              alt={title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 320px"
              className="object-contain"
            />
          ) : null}
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="secondary">{height}</Badge>
          <Badge variant="secondary">{MODEL_SEASON_LABELS[season]}</Badge>
          {purposes.map((purpose) => (
            <Badge key={purpose} variant="secondary">
              {MODEL_PURPOSE_LABELS[purpose]}
            </Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <Button type="button" className="w-full">
          Купить
        </Button>
      </CardFooter>
    </Card>
  );
}

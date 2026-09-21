"use client";

import { ModelSeason, SizeType } from "@amavie/database/browser";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  HEIGHT_PATTERN,
  MODEL_PURPOSE_LABELS,
  MODEL_PURPOSES,
  MODEL_SEASON_LABELS,
  MODEL_SEASONS,
  MODEL_TYPE_LABELS,
  MODEL_TYPES,
  SIZE_TYPE_LABELS,
  SIZE_TYPES,
} from "../const";
import { useCreateProductForm } from "./CreateProductFormContext";

export function ModelFields() {
  const { model, updateModel, fieldErrors } = useCreateProductForm();

  return (
    <>
      <Field>
        <FieldLabel>Тип</FieldLabel>
        <Select
          items={MODEL_TYPE_LABELS}
          value={model.type}
          onValueChange={(value) => updateModel({ type: value })}
        >
          <SelectTrigger className="w-full" aria-invalid={!!fieldErrors?.type}>
            <SelectValue placeholder="Выберите тип" />
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false} align="start">
            {MODEL_TYPES.map((modelType) => (
              <SelectItem key={modelType} value={modelType}>
                {MODEL_TYPE_LABELS[modelType]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError>{fieldErrors?.type}</FieldError>
      </Field>

      <Field>
        <FieldLabel htmlFor="model-name">Название</FieldLabel>
        <Input
          id="model-name"
          value={model.name}
          onChange={(event) => updateModel({ name: event.target.value })}
          placeholder="например, SHELLEY"
          aria-invalid={!!fieldErrors?.name}
        />
        <FieldError>{fieldErrors?.name}</FieldError>
      </Field>

      <Field>
        <FieldLabel>Тип размера</FieldLabel>
        <RadioGroup
          className="gap-2"
          value={model.sizeType}
          onValueChange={(value) => {
            if (SIZE_TYPES.includes(value as SizeType)) {
              updateModel({ sizeType: value as SizeType });
            }
          }}
        >
          {SIZE_TYPES.map((value) => (
            <Field key={value} orientation="horizontal">
              <RadioGroupItem value={value} id={`sizeType-${value}`} />
              <FieldLabel htmlFor={`sizeType-${value}`}>
                {SIZE_TYPE_LABELS[value]}
              </FieldLabel>
            </Field>
          ))}
        </RadioGroup>
        <FieldError>{fieldErrors?.sizeType}</FieldError>
      </Field>

      <Field>
        <FieldLabel htmlFor="model-height">Ростовка</FieldLabel>
        <Input
          id="model-height"
          value={model.height}
          onChange={(event) => updateModel({ height: event.target.value })}
          placeholder="164-168"
          pattern="[0-9]{3}-[0-9]{3}"
          maxLength={7}
          required
          aria-invalid={
            !!fieldErrors?.height || !HEIGHT_PATTERN.test(model.height)
          }
        />
        <FieldError>
          {fieldErrors?.height ??
            (!HEIGHT_PATTERN.test(model.height)
              ? "Формат ростовки: 164-168"
              : undefined)}
        </FieldError>
      </Field>

      <Field>
        <FieldLabel>Сезон</FieldLabel>
        <RadioGroup
          className="gap-2"
          value={model.season ?? ""}
          onValueChange={(value) => {
            if (MODEL_SEASONS.includes(value as ModelSeason)) {
              updateModel({ season: value as ModelSeason });
            }
          }}
        >
          {MODEL_SEASONS.map((value) => (
            <Field key={value} orientation="horizontal">
              <RadioGroupItem value={value} id={`season-${value}`} />
              <FieldLabel htmlFor={`season-${value}`}>
                {MODEL_SEASON_LABELS[value]}
              </FieldLabel>
            </Field>
          ))}
        </RadioGroup>
        <FieldError>{fieldErrors?.season}</FieldError>
      </Field>

      <Field>
        <FieldLabel>Назначение</FieldLabel>
        <ToggleGroup
          multiple
          variant="outline"
          className="flex w-full flex-wrap"
          value={model.purposes}
          onValueChange={(value) => {
            updateModel({
              purposes: MODEL_PURPOSES.filter((purpose) =>
                value.includes(purpose),
              ),
            });
          }}
        >
          {MODEL_PURPOSES.map((value) => (
            <ToggleGroupItem key={value} value={value}>
              {MODEL_PURPOSE_LABELS[value]}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <FieldError>{fieldErrors?.purposes}</FieldError>
      </Field>
    </>
  );
}

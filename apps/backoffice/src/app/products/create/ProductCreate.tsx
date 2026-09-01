"use client";

import {
  Dispatch,
  SetStateAction,
  useActionState,
  useRef,
  useState,
} from "react";
import { ProductType, SizeType } from "@amavie/database/browser";
import { XIcon } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  DIMENSION_PATTERN,
  LETTER_SIZES,
  NUMERIC_SIZES,
  PRODUCT_TYPE_LABELS,
  PRODUCT_TYPES,
  SIZE_TYPE_LABELS,
  SIZE_TYPES,
} from "../const";
import { createProduct, type CreateProductState } from "./action";

const initialState: CreateProductState = {};

type ProductFormValues = {
  type: ProductType | null;
  modelNumber: string;
  name: string;
  description: string;
  fabric: string;
  sizeType: SizeType;
  sizes: string[];
  colors: string[];
};

const emptyValues = {
  type: null,
  modelNumber: "",
  name: "",
  description: "",
  fabric: "",
  sizeType: SizeType.Letter,
  sizes: [],
  colors: [],
} as const satisfies ProductFormValues;

function addUnique(list: string[], value: string) {
  const next = value.trim();
  if (!next || list.includes(next)) {
    return list;
  }
  return [...list, next];
}

export default function ProductCreate() {
  const [state, formAction, pending] = useActionState(
    createProduct,
    initialState,
  );
  const [currentValues, setCurrentValues] =
    useState<ProductFormValues>(emptyValues);

  console.log("render");

  return (
    <form action={formAction}>
      <FieldGroup className="max-w-xl">
        <ProductTypeField errorMessage={state.fieldErrors?.type} />

        <ModelNumberField errorMessage={state.fieldErrors?.modelNumber} />

        <ProductNameField errorMessage={state.fieldErrors?.name} />

        <ProductDescriptionField
          errorMessage={state.fieldErrors?.description}
        />

        <ProductFabricField errorMessage={state.fieldErrors?.fabric} />

        <ProductSizeSettingsField errorMessage={state.fieldErrors} />

        <ProductColorsField errorMessage={state.fieldErrors?.colors} />

        {state.formError && <FieldError>{state.formError}</FieldError>}

        <Button type="submit" disabled={pending}>
          {pending ? "Создание…" : "Создать товар"}
        </Button>
      </FieldGroup>
    </form>
  );
}

function ModelNumberField({
  errorMessage,
}: {
  errorMessage: string | undefined;
}) {
  const [modelNumber, setModelNumber] = useState<
    ProductFormValues["modelNumber"]
  >(emptyValues.modelNumber);
  return (
    <Field>
      <FieldLabel htmlFor="modelNumber">Артикул</FieldLabel>
      <Input
        id="modelNumber"
        name="modelNumber"
        value={modelNumber}
        onChange={(event) => setModelNumber(event.target.value)}
        placeholder="например, 3.1847 A2"
        aria-invalid={!!errorMessage}
      />
      <FieldError>{errorMessage}</FieldError>
    </Field>
  );
}

function ProductNameField({
  errorMessage,
}: {
  errorMessage: string | undefined;
}) {
  const [name, setName] = useState<ProductFormValues["name"]>(emptyValues.name);
  return (
    <Field>
      <FieldLabel htmlFor="name">Название</FieldLabel>
      <Input
        id="name"
        name="name"
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="например, SHELLEY"
        aria-invalid={!!errorMessage}
      />
      <FieldError>{errorMessage}</FieldError>
    </Field>
  );
}

function ProductDescriptionField({
  errorMessage,
}: {
  errorMessage: string | undefined;
}) {
  const [description, setDescription] = useState<
    ProductFormValues["description"]
  >(emptyValues.description);
  return (
    <Field>
      <FieldLabel htmlFor="description">Описание</FieldLabel>
      <Textarea
        id="description"
        name="description"
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        aria-invalid={!!errorMessage}
      />
      <FieldError>{errorMessage}</FieldError>
    </Field>
  );
}

function ProductFabricField({
  errorMessage,
}: {
  errorMessage: string | undefined;
}) {
  const [fabric, setFabric] = useState<ProductFormValues["fabric"]>(
    emptyValues.fabric,
  );
  return (
    <Field>
      <FieldLabel htmlFor="fabric">Ткань</FieldLabel>
      <Input
        id="fabric"
        name="fabric"
        value={fabric}
        onChange={(event) => setFabric(event.target.value)}
        aria-invalid={!!errorMessage}
      />
      <FieldError>{errorMessage}</FieldError>
    </Field>
  );
}

function ProductTypeField({
  errorMessage,
}: {
  errorMessage: string | undefined;
}) {
  const [type, setType] = useState<ProductFormValues["type"]>(emptyValues.type);
  return (
    <Field>
      <FieldLabel>Тип</FieldLabel>
      <Select
        items={PRODUCT_TYPE_LABELS}
        name="type"
        value={type}
        onValueChange={setType}
      >
        <SelectTrigger className="w-full" aria-invalid={!!errorMessage}>
          <SelectValue placeholder="Выберите тип" />
        </SelectTrigger>
        <SelectContent alignItemWithTrigger={false} align="start">
          {PRODUCT_TYPES.map((productType) => (
            <SelectItem key={productType} value={productType}>
              {PRODUCT_TYPE_LABELS[productType]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <FieldError>{errorMessage}</FieldError>
    </Field>
  );
}

function ProductSizeSettingsField({
  errorMessage,
}: {
  errorMessage:
    | Pick<Required<CreateProductState>["fieldErrors"], "sizeType" | "sizes">
    | undefined;
}) {
  const [sizeType, setSizeType] = useState<ProductFormValues["sizeType"]>(
    emptyValues.sizeType,
  );

  function handleSizeTypeChange(value: ProductFormValues["sizeType"]) {
    setSizeType(value);
    setSizes([]);
  }

  const [sizes, setSizes] = useState<ProductFormValues["sizes"]>(
    emptyValues.sizes,
  );

  return (
    <>
      <Field>
        <FieldLabel>Тип размера</FieldLabel>
        <input type="hidden" name="sizeType" value={sizeType} key={sizeType} />
        <RadioGroup
          className="gap-2"
          value={sizeType}
          onValueChange={handleSizeTypeChange}
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
        <FieldError>{errorMessage?.sizeType}</FieldError>
      </Field>

      <Field>
        <FieldLabel>Размеры</FieldLabel>
        {sizes.map((size) => (
          <input key={size} type="hidden" name="sizes" value={size} />
        ))}
        {sizeType !== SizeType.Dimension && (
          <ToggleGroup
            multiple
            variant="outline"
            className="flex w-full flex-wrap"
            value={sizes}
            onValueChange={(value) => setSizes(value)}
          >
            {(sizeType === SizeType.Letter ? LETTER_SIZES : NUMERIC_SIZES).map(
              (size) => (
                <ToggleGroupItem key={size} value={size}>
                  {size}
                </ToggleGroupItem>
              ),
            )}
          </ToggleGroup>
        )}
        {sizeType === SizeType.Dimension && (
          <DimensionSizeField
            sizes={sizes}
            setSizes={setSizes}
            errorMessage={errorMessage?.sizes}
          />
        )}
        <FieldError>{errorMessage?.sizes}</FieldError>
      </Field>
    </>
  );
}

function DimensionSizeField({
  errorMessage,
  sizes,
  setSizes,
}: {
  errorMessage: string | undefined;
  sizes: ProductFormValues["sizes"];
  setSizes: Dispatch<SetStateAction<ProductFormValues["sizes"]>>;
}) {
  const dimensionDraftRef = useRef<HTMLInputElement>(null);
  const [dimensionError, setDimensionError] = useState<string>();

  function addDimension() {
    const next = dimensionDraftRef.current?.value.trim() ?? "";
    if (!DIMENSION_PATTERN.test(next)) {
      setDimensionError("Размер в формате 40x60");
      return;
    }
    setSizes((prevSizes) => [...new Set([...prevSizes, next])]);
    if (dimensionDraftRef.current) {
      dimensionDraftRef.current.value = "";
    }
    setDimensionError(undefined);
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          ref={dimensionDraftRef}
          placeholder="например, 40x60"
          aria-invalid={dimensionError ? true : undefined}
          onChange={() => setDimensionError(undefined)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addDimension();
            }
          }}
        />
        <Button type="button" variant="outline" onClick={addDimension}>
          Добавить
        </Button>
      </div>
      {dimensionError && <FieldError>{dimensionError}</FieldError>}
      {sizes.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {sizes.map((size) => (
            <Badge key={size} variant="secondary">
              {size}
              <button
                type="button"
                aria-label={`Удалить размер ${size}`}
                onClick={() => setSizes(sizes.filter((item) => item !== size))}
              >
                <XIcon />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

function ProductColorsField({
  errorMessage,
}: {
  errorMessage: string | undefined;
}) {
  const [colors, setColors] = useState<ProductFormValues["colors"]>(
    emptyValues.colors,
  );
  const colorDraftRef = useRef<HTMLInputElement>(null);

  function addColor() {
    if (colorDraftRef.current) {
      const { value } = colorDraftRef.current;
      if (!value) return;
      setColors([...new Set([...colors, value])]);
      colorDraftRef.current.value = "";
    }
  }

  return (
    <Field>
      <FieldLabel>Цвета</FieldLabel>
      {colors.map((color) => (
        <input key={color} type="hidden" name="colors" value={color} />
      ))}
      <div className="flex gap-2">
        <Input
          ref={colorDraftRef}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addColor();
            }
          }}
        />
        <Button type="button" variant="outline" onClick={addColor}>
          Добавить
        </Button>
      </div>
      {colors.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {colors.map((color) => (
            <Badge key={color} variant="secondary">
              {color}
              <button
                type="button"
                aria-label={`Удалить цвет ${color}`}
                onClick={() =>
                  setColors(colors.filter((item) => item !== color))
                }
              >
                <XIcon />
              </button>
            </Badge>
          ))}
        </div>
      )}
      <FieldError>{errorMessage}</FieldError>
    </Field>
  );
}

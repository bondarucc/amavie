"use client";

import { Fragment, useActionState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FieldError, FieldGroup } from "@/components/ui/field";
import type { ColorOption } from "../../colors/color";
import { createProduct, type CreateProductState } from "./action";
import {
  CreateProductFormProvider,
  useCreateProductForm,
  type ImageItem,
} from "./CreateProductFormContext";
import { ModelFields } from "./ModelFields";
import { ProductTabs } from "./ProductTabs";

const initialState: CreateProductState = {};

export default function ProductCreate({
  dictionaryColors,
}: {
  dictionaryColors: ColorOption[];
}) {
  const { bfcacheId } = useRouter();

  return (
    <ProductCreateDraft key={bfcacheId} dictionaryColors={dictionaryColors} />
  );
}

function ProductCreateDraft({
  dictionaryColors,
}: {
  dictionaryColors: ColorOption[];
}) {
  const [state, formAction, pending] = useActionState(
    createProduct,
    initialState,
  );

  return (
    <CreateProductFormProvider
      fieldErrors={state.fieldErrors}
      dictionaryColors={dictionaryColors}
    >
      <CreateProductForm
        formAction={formAction}
        pending={pending}
        formError={state.formError}
      />
    </CreateProductFormProvider>
  );
}

function CreateProductForm({
  formAction,
  pending,
  formError,
}: {
  formAction: (formData: FormData) => void;
  pending: boolean;
  formError: string | undefined;
}) {
  const { canSubmit, imagesReady, fieldErrors } = useCreateProductForm();

  return (
    <form action={formAction}>
      <FormHiddenInputs />
      <FieldGroup className="max-w-xl">
        <ModelFields />
        <ProductTabs />
        {fieldErrors?.primaryImageId && (
          <FieldError>{fieldErrors.primaryImageId}</FieldError>
        )}
        {formError && <FieldError>{formError}</FieldError>}
        <Button type="submit" disabled={pending || !canSubmit}>
          {pending
            ? "Создание…"
            : !imagesReady
              ? "Дождитесь загрузки изображений…"
              : !canSubmit
                ? "Выберите главное изображение"
                : "Создать модель"}
        </Button>
      </FieldGroup>
    </form>
  );
}

function FormHiddenInputs() {
  const { model, products, pendingColors, primaryImageId } =
    useCreateProductForm();
  const usedColorIds = new Set(products.flatMap((product) => product.colorIds));
  const attachedPendingColors = pendingColors.filter((color) =>
    usedColorIds.has(color.id),
  );

  return (
    <>
      <input type="hidden" name="type" value={model.type ?? ""} />
      <input type="hidden" name="name" value={model.name} />
      <input type="hidden" name="sizeType" value={model.sizeType} />
      <input type="hidden" name="season" value={model.season ?? ""} />
      <input type="hidden" name="primaryImageId" value={primaryImageId ?? ""} />
      {attachedPendingColors.map((color, index) => (
        <Fragment key={color.id}>
          <input
            type="hidden"
            name={`pendingColors.${index}.id`}
            value={color.id}
          />
          <input
            type="hidden"
            name={`pendingColors.${index}.displayValue`}
            value={color.displayValue}
          />
          <input
            type="hidden"
            name={`pendingColors.${index}.hex`}
            value={color.hex}
          />
        </Fragment>
      ))}
      {products.map((product, index) => (
        <ProductHiddenInputs
          key={product.id}
          index={index}
          externalId={product.externalId}
          description={product.description}
          fabric={product.fabric}
          sizes={product.sizes}
          colorIds={product.colorIds}
          images={product.images}
        />
      ))}
    </>
  );
}

function ProductHiddenInputs({
  index,
  externalId,
  description,
  fabric,
  sizes,
  colorIds,
  images,
}: {
  index: number;
  externalId: string;
  description: string;
  fabric: string;
  sizes: string[];
  colorIds: string[];
  images: Record<string, ImageItem[]>;
}) {
  return (
    <>
      <input
        type="hidden"
        name={`products.${index}.externalId`}
        value={externalId}
      />
      <input
        type="hidden"
        name={`products.${index}.description`}
        value={description}
      />
      <input type="hidden" name={`products.${index}.fabric`} value={fabric} />
      {sizes.map((size) => (
        <input
          key={size}
          type="hidden"
          name={`products.${index}.sizes`}
          value={size}
        />
      ))}
      {colorIds.map((colorId) => (
        <input
          key={colorId}
          type="hidden"
          name={`products.${index}.colorKeys`}
          value={colorId}
        />
      ))}
      {colorIds.map((colorId, colorIndex) => {
        const items = (images[colorId] ?? []).filter(
          (item) => item.status === "success" && item.id && item.filename,
        );
        return (
          <Fragment key={colorId}>
            <input
              type="hidden"
              name={`products.${index}.imageGroups.${colorIndex}.colorKey`}
              value={colorId}
            />
            {items.map((item) => (
              <Fragment key={item.localId}>
                <input
                  type="hidden"
                  name={`products.${index}.imageGroups.${colorIndex}.ids`}
                  value={item.id}
                />
                <input
                  type="hidden"
                  name={`products.${index}.imageGroups.${colorIndex}.filenames`}
                  value={item.filename}
                />
              </Fragment>
            ))}
          </Fragment>
        );
      })}
    </>
  );
}

"use client";

import { Fragment, useActionState } from "react";
import { Button } from "@/components/ui/button";
import { FieldError, FieldGroup } from "@/components/ui/field";
import { createProduct, type CreateProductState } from "./action";
import {
  CreateProductFormProvider,
  useCreateProductForm,
  type ImageItem,
} from "./CreateProductFormContext";
import { ModelFields } from "./ModelFields";
import { ProductTabs } from "./ProductTabs";

const initialState: CreateProductState = {};

export default function ProductCreate() {
  const [state, formAction, pending] = useActionState(
    createProduct,
    initialState,
  );

  return (
    <CreateProductFormProvider fieldErrors={state.fieldErrors}>
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
  const { canSubmit } = useCreateProductForm();

  return (
    <form action={formAction}>
      <FormHiddenInputs />
      <FieldGroup className="max-w-xl">
        <ModelFields />
        <ProductTabs />
        {formError && <FieldError>{formError}</FieldError>}
        <Button type="submit" disabled={pending || !canSubmit}>
          {pending
            ? "Создание…"
            : !canSubmit
              ? "Дождитесь загрузки изображений…"
              : "Создать модель"}
        </Button>
      </FieldGroup>
    </form>
  );
}

function FormHiddenInputs() {
  const { model, products } = useCreateProductForm();

  return (
    <>
      <input type="hidden" name="type" value={model.type ?? ""} />
      <input type="hidden" name="name" value={model.name} />
      <input type="hidden" name="sizeType" value={model.sizeType} />
      {products.map((product, index) => (
        <ProductHiddenInputs
          key={product.id}
          index={index}
          externalId={product.externalId}
          description={product.description}
          fabric={product.fabric}
          sizes={product.sizes}
          colors={product.colors}
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
  colors,
  images,
}: {
  index: number;
  externalId: string;
  description: string;
  fabric: string;
  sizes: string[];
  colors: string[];
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
      {colors.map((color) => (
        <input
          key={color}
          type="hidden"
          name={`products.${index}.colors`}
          value={color}
        />
      ))}
      {colors.map((color, colorIndex) => {
        const items = (images[color] ?? []).filter(
          (item) => item.status === "success" && item.id && item.filename,
        );
        return (
          <Fragment key={color}>
            <input
              type="hidden"
              name={`products.${index}.imageGroups.${colorIndex}.color`}
              value={color}
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

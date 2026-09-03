"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { FieldError, FieldGroup } from "@/components/ui/field";
import { createProduct, type CreateProductState } from "./action";
import {
  CreateProductFormProvider,
  useCreateProductForm,
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
  return (
    <form action={formAction}>
      <FormHiddenInputs />
      <FieldGroup className="max-w-xl">
        <ModelFields />
        <ProductTabs />
        {formError && <FieldError>{formError}</FieldError>}
        <Button type="submit" disabled={pending}>
          {pending ? "Создание…" : "Создать модель"}
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
}: {
  index: number;
  externalId: string;
  description: string;
  fabric: string;
  sizes: string[];
  colors: string[];
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
    </>
  );
}

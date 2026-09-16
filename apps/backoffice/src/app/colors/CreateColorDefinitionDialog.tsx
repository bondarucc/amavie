"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  createColorDefinition,
  validateColorDefinition,
  type CreateColorDefinitionState,
} from "./action";
import { HEX_PATTERN, type ColorOption } from "./color";

const initialState: CreateColorDefinitionState = {};

export function CreateColorDefinitionDialog({
  mode,
  reservedNormalizedValues = [],
  onValidated,
  triggerLabel = "Добавить цвет",
}: {
  mode: "persist" | "validate";
  reservedNormalizedValues?: string[];
  onValidated?: (color: ColorOption) => void;
  triggerLabel?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        {triggerLabel}
      </Button>
      <CreateColorDefinitionModal
        open={open}
        onOpenChange={setOpen}
        mode={mode}
        reservedNormalizedValues={reservedNormalizedValues}
        onValidated={onValidated}
      />
    </>
  );
}

export function CreateColorDefinitionModal({
  open,
  onOpenChange,
  mode,
  reservedNormalizedValues = [],
  onValidated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "persist" | "validate";
  reservedNormalizedValues?: string[];
  onValidated?: (color: ColorOption) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Новый цвет</DialogTitle>
          <DialogDescription>
            Укажите название и HEX-код. Название должно быть уникальным.
          </DialogDescription>
        </DialogHeader>
        {open && (
          <CreateColorDefinitionForm
            mode={mode}
            reservedNormalizedValues={reservedNormalizedValues}
            onValidated={(color) => {
              onValidated?.(color);
              onOpenChange(false);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function CreateColorDefinitionForm({
  mode,
  reservedNormalizedValues,
  onValidated,
}: {
  mode: "persist" | "validate";
  reservedNormalizedValues: string[];
  onValidated: (color: ColorOption) => void;
}) {
  const displayId = useId();
  const hexId = useId();
  const handledRef = useRef<ColorOption | null>(null);
  const [hex, setHex] = useState("#000000");
  const [displayValue, setDisplayValue] = useState("");
  const [state, formAction, pending] = useActionState(
    mode === "persist" ? createColorDefinition : validateColorDefinition,
    initialState,
  );

  useEffect(() => {
    if (!state.color || handledRef.current === state.color) {
      return;
    }
    handledRef.current = state.color;
    onValidated(state.color);
  }, [onValidated, state.color]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {reservedNormalizedValues.map((value) => (
        <input
          key={value}
          type="hidden"
          name="reservedNormalizedValues"
          value={value}
        />
      ))}
      <Field>
        <FieldLabel htmlFor={displayId}>Название</FieldLabel>
        <Input
          id={displayId}
          name="displayValue"
          value={displayValue}
          onChange={(event) => setDisplayValue(event.target.value)}
          autoComplete="off"
          aria-invalid={state.field === "displayValue"}
        />
        {state.field === "displayValue" && (
          <FieldError>{state.fieldError}</FieldError>
        )}
      </Field>
      <Field>
        <FieldLabel htmlFor={hexId}>HEX</FieldLabel>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={HEX_PATTERN.test(hex) ? hex : "#000000"}
            onChange={(event) => setHex(event.target.value)}
            className="size-8 cursor-pointer rounded-lg border border-border bg-transparent p-0.5"
            aria-label="Выбрать цвет"
          />
          <Input
            id={hexId}
            name="hex"
            value={hex}
            onChange={(event) => setHex(event.target.value)}
            autoComplete="off"
            placeholder="#000000"
            aria-invalid={state.field === "hex"}
          />
        </div>
        {state.field === "hex" && <FieldError>{state.fieldError}</FieldError>}
      </Field>
      {state.formError && <FieldError>{state.formError}</FieldError>}
      {state.fieldError && !state.field && (
        <FieldError>{state.fieldError}</FieldError>
      )}
      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={pending}>
          {pending
            ? mode === "persist"
              ? "Создание…"
              : "Проверка…"
            : "Создать"}
        </Button>
      </div>
    </form>
  );
}

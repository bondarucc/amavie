"use client";

import { useActionState, useState } from "react";
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
import { createWarehouse, type CreateWarehouseState } from "./action";
import { toSearchParams, type StockQuery } from "./query";

const initialState: CreateWarehouseState = {};

export function CreateWarehouseDialog({ query }: { query: StockQuery }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        Создать склад
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Новый склад</DialogTitle>
            <DialogDescription>
              Укажите название склада. Остатки по всем вариантам будут созданы
              со значением 0.
            </DialogDescription>
          </DialogHeader>
          {open && (
            <CreateWarehouseForm from={toSearchParams(query).toString()} />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function CreateWarehouseForm({ from }: { from: string }) {
  const [state, formAction, pending] = useActionState(
    createWarehouse,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="from" value={from} />
      <Field>
        <FieldLabel htmlFor="warehouse-name">Название</FieldLabel>
        <Input
          id="warehouse-name"
          name="name"
          autoComplete="off"
          aria-invalid={!!state.fieldError}
        />
        <FieldError>{state.fieldError}</FieldError>
      </Field>
      {state.formError && <FieldError>{state.formError}</FieldError>}
      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Создание…" : "Создать"}
        </Button>
      </div>
    </form>
  );
}

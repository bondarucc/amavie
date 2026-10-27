"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { sendSms, type SendSmsState } from "./action";

const initialState: SendSmsState = {};

export function SmsForm() {
  const [state, formAction, pending] = useActionState(sendSms, initialState);

  return (
    <form action={formAction} className="flex max-w-md flex-col gap-4">
      <Field>
        <FieldLabel htmlFor="sms-phone">Телефон</FieldLabel>
        <Input id="sms-phone" name="phone" type="tel" autoComplete="off" />
      </Field>
      <Field>
        <FieldLabel htmlFor="sms-text">Текст</FieldLabel>
        <Textarea id="sms-text" name="text" />
      </Field>
      {state.message &&
        (state.error ? (
          <FieldError>{state.message}</FieldError>
        ) : (
          <p className="text-sm">{state.message}</p>
        ))}
      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Отправка…" : "Отправить"}
        </Button>
      </div>
    </form>
  );
}

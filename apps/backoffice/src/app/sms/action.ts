"use server";

import { send } from "@amavie/rocket-sms";

export type SendSmsState = {
  message?: string;
  error?: boolean;
};

export async function sendSms(
  _prev: SendSmsState,
  formData: FormData,
): Promise<SendSmsState> {
  const phone = String(formData.get("phone") ?? "").trim();
  const text = String(formData.get("text") ?? "").trim();

  if (!phone || !text) {
    return { message: "Укажите телефон и текст", error: true };
  }

  try {
    const result = await send({ phone, text });
    if ("error" in result) {
      return { message: result.error, error: true };
    }

    return {
      message: `Отправлено. id ${result.id}, статус ${result.status}`,
    };
  } catch (error) {
    return {
      message: error instanceof Error ? error.message : "Не удалось отправить",
      error: true,
    };
  }
}

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type BuyButtonProps = {
  description: string;
};

type WidgetCloseStatus =
  "successful" | "failed" | "pending" | "redirected" | "error" | null;

type BeGatewayInstance = {
  createWidget: () => void;
};

type BeGatewayConstructor = new (params: {
  checkout_url: string;
  token: string;
  checkout: {
    iframe: boolean;
    test: boolean;
    transaction_type: string;
  };
  closeWidget?: (status: WidgetCloseStatus) => void;
}) => BeGatewayInstance;

declare global {
  interface Window {
    BeGateway?: BeGatewayConstructor;
  }
}

const STATUS_LABELS: Record<Exclude<WidgetCloseStatus, null>, string> = {
  successful: "Оплачено",
  failed: "Отклонено",
  pending: "Ожидание",
  redirected: "Перенаправление",
  error: "Ошибка",
};

async function waitForBeGateway() {
  if (window.BeGateway) {
    return window.BeGateway;
  }

  return new Promise<BeGatewayConstructor>((resolve, reject) => {
    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      if (window.BeGateway) {
        window.clearInterval(timer);
        resolve(window.BeGateway);
        return;
      }

      if (Date.now() - startedAt > 8000) {
        window.clearInterval(timer);
        reject(new Error("BeGateway script did not load"));
      }
    }, 50);
  });
}

export function BuyButton({ description }: BuyButtonProps) {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<WidgetCloseStatus>(null);

  async function handleBuy() {
    setBusy(true);
    setStatus(null);

    try {
      const response = await fetch("/api/payments/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      });
      const data = (await response.json()) as {
        token?: string;
        error?: string;
      };

      if (!response.ok || !data.token) {
        setStatus("error");
        setBusy(false);
        return;
      }

      const BeGateway = await waitForBeGateway();

      new BeGateway({
        checkout_url: "https://checkout.bepaid.by",
        token: data.token,
        checkout: {
          iframe: true,
          test: true,
          transaction_type: "payment",
        },
        closeWidget(widgetStatus) {
          setStatus(widgetStatus);
          setBusy(false);
        },
      }).createWidget();
    } catch {
      setStatus("error");
      setBusy(false);
    }
  }

  const label = busy ? "Загрузка…" : status ? STATUS_LABELS[status] : "Купить";

  return (
    <Button
      type="button"
      className="w-full"
      disabled={busy}
      onClick={handleBuy}
    >
      {label}
    </Button>
  );
}

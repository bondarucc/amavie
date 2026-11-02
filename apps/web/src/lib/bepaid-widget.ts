"use client";

export const BEGATEWAY_SCRIPT_URL =
  "https://js.bepaid.by/widget/be_gateway.js";

export type WidgetCloseStatus =
  "successful" | "failed" | "pending" | "redirected" | "error" | null;

export type BeGatewayInstance = {
  createWidget: () => void;
};

export type BeGatewayConstructor = new (params: {
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

export async function waitForBeGateway() {
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

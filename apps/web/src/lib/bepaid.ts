import { randomInt, randomUUID, verify } from "node:crypto";

const CHECKOUT_URL = "https://checkout.bepaid.by/ctp/api/checkouts";
const MIN_AMOUNT = 100;
const MAX_AMOUNT_EXCLUSIVE = 5001;

export class BePaidError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "BePaidError";
  }
}

type ShopConfig = {
  shopId: string;
  secretKey: string;
  rsaPublicKey: string;
  appUrl: string;
};

function requiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new BePaidError(`Missing ${name} environment variable`, 500);
  }

  return value;
}

export function getShopConfig(): ShopConfig {
  return {
    shopId: requiredEnv("NO_3D_SHOP_ID"),
    secretKey: requiredEnv("NO_3D_KEY"),
    rsaPublicKey: requiredEnv("NO_3D_RSA_PUB_KEY"),
    appUrl: requiredEnv("APP_URL").replace(/\/$/, ""),
  };
}

function basicAuthHeader(shopId: string, secretKey: string): string {
  return `Basic ${Buffer.from(`${shopId}:${secretKey}`).toString("base64")}`;
}

type CheckoutResponse = {
  checkout?: { token?: string };
  message?: string;
};

export async function createPaymentToken(input: {
  description: string;
  returnUrl: string;
}): Promise<{ token: string }> {
  const { shopId, secretKey, appUrl } = getShopConfig();
  let response: Response;

  try {
    response = await fetch(CHECKOUT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-API-Version": "2",
        Authorization: basicAuthHeader(shopId, secretKey),
      },
      body: JSON.stringify({
        checkout: {
          test: true,
          transaction_type: "payment",
          iframe: true,
          order: {
            amount: randomInt(MIN_AMOUNT, MAX_AMOUNT_EXCLUSIVE),
            currency: "BYN",
            description: input.description,
            tracking_id: randomUUID(),
          },
          settings: {
            notification_url: `${appUrl}/api/payments/notifications`,
            return_url: input.returnUrl,
            language: "ru",
          },
        },
      }),
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Network error creating payment token";
    throw new BePaidError(message, 502);
  }

  let data: CheckoutResponse;

  try {
    data = (await response.json()) as CheckoutResponse;
  } catch {
    throw new BePaidError(
      `bePaid returned a non-JSON response (${response.status})`,
      502,
    );
  }

  const token = data.checkout?.token;

  if (!response.ok || !token) {
    throw new BePaidError(
      data.message ?? "Failed to create payment token",
      response.status >= 400 ? response.status : 502,
    );
  }

  return { token };
}

function toPemPublicKey(base64Key: string): string {
  const trimmed = base64Key.trim();

  if (trimmed.includes("BEGIN PUBLIC KEY")) {
    return trimmed;
  }

  const body = trimmed.replace(/\s+/g, "");
  const wrapped = body.match(/.{1,64}/g)?.join("\n") ?? body;

  return `-----BEGIN PUBLIC KEY-----\n${wrapped}\n-----END PUBLIC KEY-----`;
}

function extractSignature(header: string): string | null {
  const signatureMatch = header.match(/signature="?([^";]+)"?/i);

  if (signatureMatch?.[1]) {
    return signatureMatch[1];
  }

  const value = header.trim();

  return value.length > 0 ? value : null;
}

export function verifyWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  publicKeyBase64: string,
): boolean {
  if (!signatureHeader) {
    return false;
  }

  const signature = extractSignature(signatureHeader);

  if (!signature) {
    return false;
  }

  try {
    return verify(
      "SHA256",
      Buffer.from(rawBody),
      toPemPublicKey(publicKeyBase64),
      Buffer.from(signature, "base64"),
    );
  } catch {
    return false;
  }
}

export function isValidBasicAuth(
  authorizationHeader: string | null,
  shopId: string,
  secretKey: string,
): boolean {
  if (!authorizationHeader?.startsWith("Basic ")) {
    return false;
  }

  const decoded = Buffer.from(authorizationHeader.slice(6), "base64").toString(
    "utf8",
  );
  const separator = decoded.indexOf(":");

  if (separator < 0) {
    return false;
  }

  return (
    decoded.slice(0, separator) === shopId &&
    decoded.slice(separator + 1) === secretKey
  );
}

type JsonRecord = Record<string, unknown>;

function asRecord(value: unknown): JsonRecord | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as JsonRecord;
}

export function summarizeNotification(payload: unknown) {
  const body = asRecord(payload);

  if (!body) {
    return { payload };
  }

  const transaction = asRecord(body.transaction);

  if (transaction) {
    return {
      status: transaction.status,
      uid: transaction.uid,
      tracking_id: transaction.tracking_id,
      amount: transaction.amount,
      test: transaction.test,
    };
  }

  const order = asRecord(body.order);

  return {
    status: body.status,
    uid: body.uid,
    tracking_id: order?.tracking_id ?? body.tracking_id,
    expired: body.expired,
    token: body.token,
  };
}

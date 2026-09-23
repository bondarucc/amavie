import { NextResponse } from "next/server";
import {
  getShopConfig,
  isValidBasicAuth,
  summarizeNotification,
  verifyWebhookSignature,
} from "@/lib/bepaid";

export async function POST(request: Request) {
  const rawBody = await request.text();
  let shopId: string;
  let secretKey: string;
  let rsaPublicKey: string;

  try {
    ({ shopId, secretKey, rsaPublicKey } = getShopConfig());
  } catch {
    return NextResponse.json(
      { error: "Payment notifications are not configured" },
      { status: 500 },
    );
  }

  const authorization = request.headers.get("authorization");

  if (
    authorization !== null &&
    !isValidBasicAuth(authorization, shopId, secretKey)
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const signature =
    request.headers.get("content-signature") ??
    request.headers.get("x-content-signature");

  if (!verifyWebhookSignature(rawBody, signature, rsaPublicKey)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: unknown = rawBody;

  try {
    payload = JSON.parse(rawBody) as unknown;
  } catch {
    payload = rawBody;
  }

  console.info("bePaid notification", summarizeNotification(payload));

  return NextResponse.json({ ok: true });
}

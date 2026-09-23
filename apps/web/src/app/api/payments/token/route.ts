import { NextResponse } from "next/server";
import { BePaidError, createPaymentToken } from "@/lib/bepaid";

type TokenRequestBody = {
  description?: unknown;
};

export async function POST(request: Request) {
  let body: TokenRequestBody = {};

  try {
    body = (await request.json()) as TokenRequestBody;
  } catch {
    body = {};
  }

  const description =
    typeof body.description === "string" && body.description.trim().length > 0
      ? body.description.trim()
      : "Test payment";

  try {
    const { token } = await createPaymentToken({
      description,
      returnUrl: new URL("/catalog", request.url).toString(),
    });

    return NextResponse.json({ token });
  } catch (error) {
    if (error instanceof BePaidError) {
      console.error("bePaid token error:", error.message);
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }

    console.error("bePaid token error:", error);
    return NextResponse.json(
      { error: "Failed to create payment token" },
      { status: 502 },
    );
  }
}

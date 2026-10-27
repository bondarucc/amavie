import "server-only";

import { createHash } from "node:crypto";

const API_BASE = "https://api.rocketsms.by";

export type RocketSmsStatus = "QUEUED" | "SENT" | "DELIVERED" | "FAILED";

export type SendRequest = {
  phone: string;
  text: string;
};

export type SendSuccessResponse = {
  id: number;
  status: RocketSmsStatus;
  cost: {
    credits: number;
    money: number;
  };
};

export type RocketSmsErrorResponse = {
  error: string;
};

export type SendResponse = SendSuccessResponse | RocketSmsErrorResponse;

export type BulkSendRequest = {
  phones: string[];
  text: string;
};

export type BulkSendItem = {
  id: number;
  status: RocketSmsStatus;
};

export type BulkSendResponse = BulkSendItem[] | RocketSmsErrorResponse;

const username = process.env.ROCKETSMS_USERNAME;
const password = process.env.ROCKETSMS_PASSWORD;

if (!username || !password) {
  throw new Error("ROCKETSMS_USERNAME and ROCKETSMS_PASSWORD must be set");
}

const credentials = {
  username,
  password: createHash("md5").update(password).digest("hex"),
};

async function postForm(url: string, body: URLSearchParams): Promise<unknown> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  try {
    return await response.json();
  } catch {
    throw new Error(
      `RocketSMS returned a non-JSON response (${response.status})`,
    );
  }
}

export async function send(request: SendRequest): Promise<SendResponse> {
  const body = new URLSearchParams({
    username: credentials.username,
    password: credentials.password,
    phone: request.phone,
    text: request.text,
  });

  return (await postForm(`${API_BASE}/simple/send`, body)) as SendResponse;
}

export async function bulkSend(
  request: BulkSendRequest,
): Promise<BulkSendResponse> {
  const body = new URLSearchParams({
    username: credentials.username,
    password: credentials.password,
    text: request.text,
  });

  for (const phone of request.phones) {
    body.append("phones[]", phone);
  }

  return (await postForm(
    `${API_BASE}/simple/bulkSend`,
    body,
  )) as BulkSendResponse;
}

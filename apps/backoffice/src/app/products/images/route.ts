import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";
import { PRODUCT_IMAGE_MAX_BYTES, PRODUCT_IMAGE_TYPES } from "../const";

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Файл не найден" }, { status: 400 });
  }

  const extension = PRODUCT_IMAGE_TYPES[file.type];
  if (!extension) {
    return NextResponse.json(
      { error: "Поддерживаются только PNG и JPG" },
      { status: 400 },
    );
  }

  if (file.size > PRODUCT_IMAGE_MAX_BYTES) {
    return NextResponse.json(
      { error: "Максимальный размер изображения — 5 МБ" },
      { status: 400 },
    );
  }

  const id = randomUUID();
  const filename = `${id}${extension}`;

  const uploadDirectory = path.join(process.cwd(), "../../storage/products");
  const filePath = path.join(uploadDirectory, filename);

  await mkdir(uploadDirectory, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buffer);

  return NextResponse.json({ id, filename });
}

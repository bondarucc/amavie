import { readFile } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";
import { PRODUCT_IMAGE_FILENAME_PATTERN } from "../../../catalog/const";

const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".png": "image/png",
};

function resolveFilePath(filename: string) {
  if (!PRODUCT_IMAGE_FILENAME_PATTERN.test(filename)) {
    return null;
  }

  return path.join(process.cwd(), "../../storage/products", filename);
}

export async function GET(
  _request: Request,
  { params }: RouteContext<"/products/images/[filename]">,
) {
  const { filename } = await params;
  const extension = path.extname(filename).toLowerCase();
  const contentType = CONTENT_TYPES[extension];
  const filePath = resolveFilePath(filename);

  if (!contentType || !filePath) {
    return new NextResponse("Unsupported image type", { status: 400 });
  }

  try {
    const file = await readFile(filePath);

    return new NextResponse(file, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Image not found", { status: 404 });
  }
}

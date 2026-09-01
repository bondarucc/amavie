import { readFile } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

export async function GET(
  _request: Request,
  { params }: RouteContext<"/cms/images/[filename]">,
) {
  const { filename } = await params;
  console.log("export async function GET(");

  const extension = path.extname(filename).toLowerCase();
  const contentType = CONTENT_TYPES[extension];

  if (!contentType) {
    return new NextResponse("Unsupported image type", {
      status: 400,
    });
  }

  const filePath = path.join(process.cwd(), "../../storage/cms", filename);

  try {
    const file = await readFile(filePath);

    return new NextResponse(file, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Image not found", {
      status: 404,
    });
  }
}

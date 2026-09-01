"use server";

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { Template1Assets, Template2Assets } from "@amavie/shared";
import { Templates } from "@amavie/database";
import { formPaths } from "./const";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

function validateImages(images: (File | string | null)[]): images is File[] {
  images.forEach((image) => {
    if (!(image instanceof File) || image.size === 0) {
      throw new Error("Image is required");
    }

    if (!ALLOWED_IMAGE_TYPES.has(image.type)) {
      throw new Error("Unsupported image type");
    }

    if (image.size > MAX_IMAGE_SIZE) {
      throw new Error("Image is too large");
    }
  });

  return true;
}

async function saveImage(image: File) {
  const extension = EXTENSIONS[image.type];
  const filename = `${randomUUID()}${extension}`;

  const uploadDirectory = path.join(process.cwd(), "../../storage/cms");
  const filePath = path.join(uploadDirectory, filename);

  await mkdir(uploadDirectory, { recursive: true });

  const buffer = Buffer.from(await image.arrayBuffer());

  await writeFile(filePath, buffer);

  return filename;
}

// function validateImagesv2(formData: FormData) {
//   for (const entry of formData.values()) {
//     if (entry instanceof File) {
//       if (
//         entry.size === 0 ||
//         !ALLOWED_IMAGE_TYPES.has(entry.type) ||
//         entry.size > MAX_IMAGE_SIZE
//       ) return false
//     }
//   }

//   return true
// }

async function validateAndTransform(formData: FormData) {
  const template = String(formData.get("template") ?? "").trim() as Templates;

  if (!template) throw new Error("No template");

  if (template === Templates.Template1) {
    const body = String(formData.get("body") ?? "").trim();
    if (!body) {
      throw new Error("Body is required");
    }

    const imgs = [
      formData.get(formPaths.mainImg),
      formData.get(formPaths.secImg1),
      formData.get(formPaths.secImg2),
      formData.get(formPaths.secImg3),
    ];

    if (validateImages(imgs)) {
      const [mainImg, secImg1, secImg2, secImg3] = await Promise.all(
        imgs.map(saveImage),
      );

      return {
        body,
        mainImg,
        secImgs: [secImg1, secImg2, secImg3],
      } satisfies Template1Assets;
    }
  }

  if (template === Templates.Template2) {
    const body = String(formData.get("body") ?? "").trim();
    if (!body) {
      throw new Error("Body is required");
    }

    console.log(formPaths.mainImg);

    console.log("formData");

    console.log(formData);

    console.log("formData.get(formPaths.mainImg)");

    console.log(formData.get("mainImg"));

    const imgs = [formData.get(formPaths.mainImg)];

    if (validateImages(imgs)) {
      const mainImg = await saveImage(imgs[0]);

      return {
        body,
        mainImg,
      } satisfies Template2Assets;
    }
  }

  throw "error";
}

export async function createBlogPost(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const template = String(formData.get("template") ?? "").trim() as Templates;

  if (!title) {
    throw new Error("Title is required");
  }

  const imgs = [
    formData.get(formPaths.mainImg),
    formData.get(formPaths.secImg1),
    formData.get(formPaths.secImg2),
    formData.get(formPaths.secImg3),
  ];

  const assets = await validateAndTransform(formData);

  await prisma.blogPost.create({
    data: {
      title,
      template,
      assets,
    },
  });

  // if (validateImages(imgs)) {
  //   // const [mainImg, secImg1, secImg2, secImg3] = imgs
  //   const [mainImg, secImg1, secImg2, secImg3] = await Promise.all(
  //     imgs.map(saveImage),
  //   );
  //   await prisma.blogPost.create({
  //     data: {
  //       title,
  //       template: "Template1",
  //       assets: {
  //         body,
  //         mainImg,
  //         secImgs: [secImg1, secImg2, secImg3],
  //       } satisfies Template1Assets,
  //     },
  //   });
  // }
}

import pLimit from "p-limit";
import { UPLOAD_CONCURRENCY } from "../const";

// Shared across the whole create-product form: at most `UPLOAD_CONCURRENCY`
// uploads run at once, regardless of how many products/colors are involved.
export const uploadLimiter = pLimit(UPLOAD_CONCURRENCY);

export type UploadResult = { id: string; filename: string };

/**
 * Uploads a single image file to `/products/images`, reporting progress via
 * `onProgress` (0-100). Uses XMLHttpRequest because `fetch` does not expose
 * upload-progress events in a cross-browser way.
 */
export function uploadImage(
  file: File,
  options: { onProgress?: (percent: number) => void; signal?: AbortSignal },
): Promise<UploadResult> {
  const { onProgress, signal } = options;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        onProgress?.(Math.round((event.loaded / event.total) * 100));
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText) as UploadResult;
          onProgress?.(100);
          resolve(response);
        } catch {
          reject(new Error("Некорректный ответ сервера"));
        }
        return;
      }

      try {
        const response = JSON.parse(xhr.responseText) as { error?: string };
        reject(new Error(response.error ?? "Не удалось загрузить изображение"));
      } catch {
        reject(new Error("Не удалось загрузить изображение"));
      }
    });

    xhr.addEventListener("error", () => {
      reject(new Error("Не удалось загрузить изображение"));
    });

    xhr.addEventListener("abort", () => {
      reject(new DOMException("Upload aborted", "AbortError"));
    });

    if (signal) {
      if (signal.aborted) {
        xhr.abort();
        return;
      }
      signal.addEventListener("abort", () => xhr.abort());
    }

    const body = new FormData();
    body.append("file", file);

    xhr.open("POST", "/products/images");
    xhr.send(body);
  });
}

export async function deleteImage(filename: string): Promise<void> {
  await fetch(`/products/images/${filename}`, { method: "DELETE" });
}

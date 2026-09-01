"use client";

import { useEffect, useRef, useState } from "react";
import { ImageIcon, XIcon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

type ImageUploadProps = {
  name: string;
};

export function ImageUpload({ name }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }

    const url = URL.createObjectURL(file);
    setPreview(url);

    return () => URL.revokeObjectURL(url);
  }, [file]);

  function handleFile(file: File) {
    setError(null);

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("Only JPG, PNG or WebP images are allowed.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("Image must be smaller than 5 MB.");
      return;
    }

    setFile(file);
  }

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    console.log(file);

    if (file) {
      handleFile(file);
    }
  }

  // if (preview) {
  //   return (
  //     <img
  //       src={preview}
  //       alt="Selected image"
  //       className="w-full h-full object-cover"
  //     />
  //   );
  // }

  return (
    <div className="contents">
      <input
        ref={inputRef}
        type="file"
        name={name}
        accept="image/jpeg,image/png,image/webp"
        onChange={handleChange}
        className="sr-only"
        required
      />
      {!preview ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={cn(
            "size-full flex flex-col items-center justify-center",
            // "rounded-xl",
            // "px-6 py-12",
            "border-2 rounded-(--radius) border-dashed",
            "transition-colors",
            "hover:bg-muted/50",
          )}
        >
          <div className="mb-4 rounded-full p-3">
            <ImageIcon className="size-6 text-muted-foreground" />
          </div>

          <p className="text-sm font-medium">
            Нажмите для загрузки изображения
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            JPG, PNG или WebP · макс 5 MB
          </p>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </button>
      ) : (
        <img
          src={preview}
          alt="Selected image"
          className="size-full object-cover"
        />
      )}
    </div>
  );
}

// : (
//   <div className="relative overflow-hidden rounded-xl border">
//     <img
//       src={preview}
//       alt="Selected image"
//       className="aspect-video w-full object-cover"
//     />

//     <Button
//       type="button"
//       variant="destructive"
//       size="icon"
//       onClick={removeFile}
//       className="absolute right-3 top-3 rounded-full"
//       aria-label="Remove image"
//     >
//       <XIcon />
//     </Button>

//     <div className="border-t bg-background px-4 py-3">
//       <p className="truncate text-sm font-medium">{file?.name}</p>

//       <p className="text-xs text-muted-foreground">
//         {file && (file.size / 1024 / 1024).toFixed(2)} MB
//       </p>
//     </div>
//   </div>
// )

// function removeFile() {
//   setFile(null);
//   setError(null);

//   if (inputRef.current) {
//     inputRef.current.value = "";
//   }
// }

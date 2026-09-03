"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ModelType, SizeType } from "@amavie/database/browser";
import type { CreateProductState, ProductFieldErrors } from "../schema";
import { MAX_IMAGES_PER_COLOR, PRODUCT_IMAGE_TYPES } from "../const";
import { deleteImage, uploadImage, uploadLimiter } from "./uploadImage";

export type ModelDraft = {
  type: ModelType | null;
  name: string;
  sizeType: SizeType;
};

export type ImageItem = {
  localId: string;
  file: File;
  status: "pending" | "uploading" | "success" | "error";
  progress: number;
  id?: string;
  filename?: string;
  error?: string;
  abort?: () => void;
};

export type ProductDraft = {
  id: string;
  externalId: string;
  description: string;
  fabric: string;
  sizes: string[];
  colors: string[];
  images: Record<string, ImageItem[]>;
};

type CreateProductFormContextValue = {
  model: ModelDraft;
  products: ProductDraft[];
  activeProductId: string;
  fieldErrors: CreateProductState["fieldErrors"];
  canSubmit: boolean;
  setActiveProductId: (id: string) => void;
  updateModel: (patch: Partial<ModelDraft>) => void;
  updateProduct: (id: string, patch: Partial<Omit<ProductDraft, "id">>) => void;
  addProduct: () => void;
  removeProduct: (id: string) => void;
  addImages: (productId: string, color: string, files: File[]) => void;
  removeImage: (productId: string, color: string, localId: string) => void;
  removeColor: (productId: string, color: string) => void;
};

const CreateProductFormContext =
  createContext<CreateProductFormContextValue | null>(null);

const emptyModel = {
  type: null,
  name: "",
  sizeType: SizeType.Letter,
} as const satisfies ModelDraft;

const firstProductId = "product-0";

function createEmptyProduct(id: string): ProductDraft {
  return {
    id,
    externalId: "",
    description: "",
    fabric: "",
    sizes: [],
    colors: [],
    images: {},
  };
}

function nextProductId(products: ProductDraft[]) {
  const maxIndex = products.reduce((max, product) => {
    const index = Number(product.id.replace(/^product-/, ""));
    return Number.isFinite(index) ? Math.max(max, index) : max;
  }, 0);
  return `product-${maxIndex + 1}`;
}

function abortImageItem(item: ImageItem) {
  if (item.status === "pending" || item.status === "uploading") {
    item.abort?.();
  }
}

function cleanupImageItem(item: ImageItem) {
  abortImageItem(item);
  if (item.status === "success" && item.filename) {
    void deleteImage(item.filename);
  }
}

export function CreateProductFormProvider({
  children,
  fieldErrors,
}: {
  children: ReactNode;
  fieldErrors: CreateProductState["fieldErrors"];
}) {
  const [model, setModel] = useState<ModelDraft>(emptyModel);
  const [products, setProducts] = useState<ProductDraft[]>([
    createEmptyProduct(firstProductId),
  ]);
  const [activeProductId, setActiveProductId] = useState(firstProductId);
  const productsRef = useRef(products);

  useEffect(() => {
    productsRef.current = products;
  });

  const updateModel = useCallback((patch: Partial<ModelDraft>) => {
    setModel((prev) => ({ ...prev, ...patch }));
    if (patch.sizeType !== undefined) {
      setProducts((prevProducts) =>
        prevProducts.map((product) =>
          product.sizes.length === 0 ? product : { ...product, sizes: [] },
        ),
      );
    }
  }, []);

  const updateProduct = useCallback(
    (id: string, patch: Partial<Omit<ProductDraft, "id">>) => {
      setProducts((prev) =>
        prev.map((product) =>
          product.id === id ? { ...product, ...patch } : product,
        ),
      );
    },
    [],
  );

  const addProduct = useCallback(() => {
    const last = products[products.length - 1];
    const next: ProductDraft = {
      ...createEmptyProduct(nextProductId(products)),
      description: last?.description ?? "",
      fabric: last?.fabric ?? "",
    };
    setProducts((prev) => [...prev, next]);
    setActiveProductId(next.id);
  }, [products]);

  const removeProduct = useCallback(
    (id: string) => {
      if (products.length <= 1) {
        return;
      }
      const removed = products.find((product) => product.id === id);
      if (removed) {
        Object.values(removed.images).forEach((items) =>
          items.forEach(cleanupImageItem),
        );
      }
      const next = products.filter((product) => product.id !== id);
      setProducts(next);
      if (activeProductId === id) {
        setActiveProductId(next[0]?.id ?? activeProductId);
      }
    },
    [activeProductId, products],
  );

  const patchImageItem = useCallback(
    (
      productId: string,
      color: string,
      localId: string,
      patch: Partial<ImageItem>,
    ) => {
      setProducts((prev) =>
        prev.map((product) => {
          if (product.id !== productId) {
            return product;
          }
          const items = product.images[color] ?? [];
          return {
            ...product,
            images: {
              ...product.images,
              [color]: items.map((item) =>
                item.localId === localId ? { ...item, ...patch } : item,
              ),
            },
          };
        }),
      );
    },
    [],
  );

  const runUpload = useCallback(
    (productId: string, color: string, item: ImageItem) => {
      const controller = new AbortController();
      patchImageItem(productId, color, item.localId, {
        abort: () => controller.abort(),
      });

      void uploadLimiter(async () => {
        if (controller.signal.aborted) {
          return;
        }

        patchImageItem(productId, color, item.localId, {
          status: "uploading",
        });

        try {
          const result = await uploadImage(item.file, {
            signal: controller.signal,
            onProgress: (progress) =>
              patchImageItem(productId, color, item.localId, { progress }),
          });

          patchImageItem(productId, color, item.localId, {
            status: "success",
            progress: 100,
            id: result.id,
            filename: result.filename,
          });
        } catch (error) {
          if ((error as Error)?.name === "AbortError") {
            return;
          }
          patchImageItem(productId, color, item.localId, {
            status: "error",
            error:
              error instanceof Error
                ? error.message
                : "Не удалось загрузить изображение",
          });
        }
      });
    },
    [patchImageItem],
  );

  const addImages = useCallback(
    (productId: string, color: string, files: File[]) => {
      const product = productsRef.current.find((p) => p.id === productId);
      if (!product) {
        return;
      }
      const existing = product.images[color] ?? [];
      const remainingSlots = Math.max(
        0,
        MAX_IMAGES_PER_COLOR - existing.length,
      );

      const newItems: ImageItem[] = files.slice(0, remainingSlots).map(
        (file): ImageItem => {
          const localId = crypto.randomUUID();
          const typeError = !PRODUCT_IMAGE_TYPES[file.type]
            ? "Разрешены только PNG и JPG"
            : file.size > 5 * 1024 * 1024
              ? "Максимальный размер изображения — 5 МБ"
              : undefined;

          return {
            localId,
            file,
            status: typeError ? "error" : "pending",
            progress: 0,
            error: typeError,
          };
        },
      );

      setProducts((prev) =>
        prev.map((p) =>
          p.id === productId
            ? {
                ...p,
                images: {
                  ...p.images,
                  [color]: [...existing, ...newItems],
                },
              }
            : p,
        ),
      );

      newItems
        .filter((item) => item.status === "pending")
        .forEach((item) => runUpload(productId, color, item));
    },
    [runUpload],
  );

  const removeImage = useCallback(
    (productId: string, color: string, localId: string) => {
      const product = productsRef.current.find((p) => p.id === productId);
      const item = product?.images[color]?.find(
        (candidate) => candidate.localId === localId,
      );
      if (item) {
        cleanupImageItem(item);
      }

      setProducts((prev) =>
        prev.map((p) =>
          p.id === productId
            ? {
                ...p,
                images: {
                  ...p.images,
                  [color]: (p.images[color] ?? []).filter(
                    (candidate) => candidate.localId !== localId,
                  ),
                },
              }
            : p,
        ),
      );
    },
    [],
  );

  const removeColor = useCallback(
    (productId: string, color: string) => {
      const product = productsRef.current.find((p) => p.id === productId);
      (product?.images[color] ?? []).forEach(cleanupImageItem);

      setProducts((prev) =>
        prev.map((p) => {
          if (p.id !== productId) {
            return p;
          }
          const nextImages = { ...p.images };
          delete nextImages[color];
          return {
            ...p,
            colors: p.colors.filter((candidate) => candidate !== color),
            images: nextImages,
          };
        }),
      );
    },
    [],
  );

  const canSubmit = useMemo(
    () =>
      products.every((product) =>
        Object.values(product.images).every((items) =>
          items.every((item) => item.status === "success"),
        ),
      ),
    [products],
  );

  useEffect(() => {
    const index = fieldErrors?.products?.findIndex(
      (errors) => errors && Object.values(errors).some(Boolean),
    );
    if (index === undefined || index < 0) {
      return;
    }

    const productId = productsRef.current[index]?.id;
    if (productId) {
      setActiveProductId(productId);
    }
  }, [fieldErrors]);

  const value = useMemo(
    () => ({
      model,
      products,
      activeProductId,
      fieldErrors,
      canSubmit,
      setActiveProductId,
      updateModel,
      updateProduct,
      addProduct,
      removeProduct,
      addImages,
      removeImage,
      removeColor,
    }),
    [
      model,
      products,
      activeProductId,
      fieldErrors,
      canSubmit,
      updateModel,
      updateProduct,
      addProduct,
      removeProduct,
      addImages,
      removeImage,
      removeColor,
    ],
  );

  return (
    <CreateProductFormContext.Provider value={value}>
      {children}
    </CreateProductFormContext.Provider>
  );
}

export function useCreateProductForm() {
  const context = useContext(CreateProductFormContext);
  if (!context) {
    throw new Error(
      "useCreateProductForm must be used within CreateProductFormProvider",
    );
  }
  return context;
}

export function useProductDraft(productId: string): {
  product: ProductDraft;
  errors: ProductFieldErrors | undefined;
  update: (patch: Partial<Omit<ProductDraft, "id">>) => void;
} {
  const { products, fieldErrors, updateProduct } = useCreateProductForm();
  const index = products.findIndex((product) => product.id === productId);
  const product = products[index];

  if (!product) {
    throw new Error(`Unknown product draft: ${productId}`);
  }

  return {
    product,
    errors: fieldErrors?.products?.[index],
    update: (patch) => updateProduct(productId, patch),
  };
}

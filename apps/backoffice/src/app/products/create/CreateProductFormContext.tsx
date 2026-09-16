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
import { ModelSeason, ModelType, SizeType } from "@amavie/database/browser";
import type { ColorOption } from "../../colors/color";
import type { CreateProductState, ProductFieldErrors } from "../schema";
import { MAX_IMAGES_PER_COLOR, PRODUCT_IMAGE_TYPES } from "../const";
import { deleteImage, uploadImage, uploadLimiter } from "./uploadImage";

export type ModelDraft = {
  type: ModelType | null;
  name: string;
  sizeType: SizeType;
  season: ModelSeason | null;
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
  colorIds: string[];
  images: Record<string, ImageItem[]>;
};

type CreateProductFormContextValue = {
  model: ModelDraft;
  products: ProductDraft[];
  activeProductId: string;
  dictionaryColors: ColorOption[];
  pendingColors: ColorOption[];
  primaryImageId: string | null;
  fieldErrors: CreateProductState["fieldErrors"];
  canSubmit: boolean;
  imagesReady: boolean;
  setActiveProductId: (id: string) => void;
  updateModel: (patch: Partial<ModelDraft>) => void;
  updateProduct: (id: string, patch: Partial<Omit<ProductDraft, "id">>) => void;
  addProduct: () => void;
  removeProduct: (id: string) => void;
  addColor: (productId: string, color: ColorOption) => void;
  addPendingColor: (productId: string, color: ColorOption) => void;
  addImages: (productId: string, colorId: string, files: File[]) => void;
  removeImage: (productId: string, colorId: string, localId: string) => void;
  removeColor: (productId: string, colorId: string) => void;
  setPrimaryImageId: (imageId: string) => void;
};

const CreateProductFormContext =
  createContext<CreateProductFormContextValue | null>(null);

const emptyModel = {
  type: null,
  name: "",
  sizeType: SizeType.Letter,
  season: null,
} as const satisfies ModelDraft;

const firstProductId = "product-0";

function createEmptyProduct(id: string): ProductDraft {
  return {
    id,
    externalId: "",
    description: "",
    fabric: "",
    sizes: [],
    colorIds: [],
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

function collectImageIds(products: ProductDraft[]) {
  const ids = new Set<string>();
  for (const product of products) {
    for (const items of Object.values(product.images)) {
      for (const item of items) {
        if (item.id) {
          ids.add(item.id);
        }
      }
    }
  }
  return ids;
}

export function CreateProductFormProvider({
  children,
  fieldErrors,
  dictionaryColors,
}: {
  children: ReactNode;
  fieldErrors: CreateProductState["fieldErrors"];
  dictionaryColors: ColorOption[];
}) {
  const [model, setModel] = useState<ModelDraft>(emptyModel);

  const [products, setProducts] = useState<ProductDraft[]>([
    createEmptyProduct(firstProductId),
  ]);
  const [activeProductId, setActiveProductId] = useState(firstProductId);
  const [pendingColors, setPendingColors] = useState<ColorOption[]>([]);
  const [primaryImageId, setPrimaryImageIdState] = useState<string | null>(
    null,
  );
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
      const remainingIds = collectImageIds(next);
      setPrimaryImageIdState((current) =>
        current && remainingIds.has(current) ? current : null,
      );
    },
    [activeProductId, products],
  );

  const patchImageItem = useCallback(
    (
      productId: string,
      colorId: string,
      localId: string,
      patch: Partial<ImageItem>,
    ) => {
      setProducts((prev) =>
        prev.map((product) => {
          if (product.id !== productId) {
            return product;
          }
          const items = product.images[colorId] ?? [];
          return {
            ...product,
            images: {
              ...product.images,
              [colorId]: items.map((item) =>
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
    (productId: string, colorId: string, item: ImageItem) => {
      const controller = new AbortController();
      patchImageItem(productId, colorId, item.localId, {
        abort: () => controller.abort(),
      });

      void uploadLimiter(async () => {
        if (controller.signal.aborted) {
          return;
        }

        patchImageItem(productId, colorId, item.localId, {
          status: "uploading",
        });

        try {
          const result = await uploadImage(item.file, {
            signal: controller.signal,
            onProgress: (progress) =>
              patchImageItem(productId, colorId, item.localId, { progress }),
          });

          patchImageItem(productId, colorId, item.localId, {
            status: "success",
            progress: 100,
            id: result.id,
            filename: result.filename,
          });
        } catch (error) {
          if ((error as Error)?.name === "AbortError") {
            return;
          }
          patchImageItem(productId, colorId, item.localId, {
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
    (productId: string, colorId: string, files: File[]) => {
      const product = productsRef.current.find((p) => p.id === productId);
      if (!product) {
        return;
      }
      const existing = product.images[colorId] ?? [];
      const remainingSlots = Math.max(
        0,
        MAX_IMAGES_PER_COLOR - existing.length,
      );

      const newItems: ImageItem[] = files
        .slice(0, remainingSlots)
        .map((file): ImageItem => {
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
        });

      setProducts((prev) =>
        prev.map((p) =>
          p.id === productId
            ? {
                ...p,
                images: {
                  ...p.images,
                  [colorId]: [...existing, ...newItems],
                },
              }
            : p,
        ),
      );

      newItems
        .filter((item) => item.status === "pending")
        .forEach((item) => runUpload(productId, colorId, item));
    },
    [runUpload],
  );

  const removeImage = useCallback(
    (productId: string, colorId: string, localId: string) => {
      const product = productsRef.current.find((p) => p.id === productId);
      const item = product?.images[colorId]?.find(
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
                  [colorId]: (p.images[colorId] ?? []).filter(
                    (candidate) => candidate.localId !== localId,
                  ),
                },
              }
            : p,
        ),
      );

      if (item?.id) {
        setPrimaryImageIdState((current) =>
          current === item.id ? null : current,
        );
      }
    },
    [],
  );

  const addColor = useCallback((productId: string, color: ColorOption) => {
    setProducts((prev) =>
      prev.map((product) => {
        if (product.id !== productId || product.colorIds.includes(color.id)) {
          return product;
        }
        return {
          ...product,
          colorIds: [...product.colorIds, color.id],
        };
      }),
    );
  }, []);

  const addPendingColor = useCallback(
    (productId: string, color: ColorOption) => {
      setPendingColors((prev) =>
        prev.some((candidate) => candidate.id === color.id)
          ? prev
          : [...prev, color],
      );
      addColor(productId, color);
    },
    [addColor],
  );

  const removeColor = useCallback((productId: string, colorId: string) => {
    const product = productsRef.current.find((p) => p.id === productId);
    const removedIds = new Set(
      (product?.images[colorId] ?? [])
        .map((item) => item.id)
        .filter((id): id is string => Boolean(id)),
    );
    (product?.images[colorId] ?? []).forEach(cleanupImageItem);

    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== productId) {
          return p;
        }
        const nextImages = { ...p.images };
        delete nextImages[colorId];
        return {
          ...p,
          colorIds: p.colorIds.filter((candidate) => candidate !== colorId),
          images: nextImages,
        };
      }),
    );

    setPrimaryImageIdState((current) =>
      current && removedIds.has(current) ? null : current,
    );
  }, []);

  const setPrimaryImageId = useCallback((imageId: string) => {
    setPrimaryImageIdState(imageId);
  }, []);

  const imagesReady = useMemo(
    () =>
      products.every((product) =>
        Object.values(product.images).every((items) =>
          items.every((item) => item.status === "success"),
        ),
      ),
    [products],
  );

  const canSubmit = imagesReady && primaryImageId !== null;

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
      dictionaryColors,
      pendingColors,
      primaryImageId,
      fieldErrors,
      canSubmit,
      imagesReady,
      setActiveProductId,
      updateModel,
      updateProduct,
      addProduct,
      removeProduct,
      addColor,
      addPendingColor,
      addImages,
      removeImage,
      removeColor,
      setPrimaryImageId,
    }),
    [
      model,
      products,
      activeProductId,
      dictionaryColors,
      pendingColors,
      primaryImageId,
      fieldErrors,
      canSubmit,
      imagesReady,
      updateModel,
      updateProduct,
      addProduct,
      removeProduct,
      addColor,
      addPendingColor,
      addImages,
      removeImage,
      removeColor,
      setPrimaryImageId,
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

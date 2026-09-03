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

export type ModelDraft = {
  type: ModelType | null;
  name: string;
  sizeType: SizeType;
};

export type ProductDraft = {
  id: string;
  externalId: string;
  description: string;
  fabric: string;
  sizes: string[];
  colors: string[];
};

type CreateProductFormContextValue = {
  model: ModelDraft;
  products: ProductDraft[];
  activeProductId: string;
  fieldErrors: CreateProductState["fieldErrors"];
  setActiveProductId: (id: string) => void;
  updateModel: (patch: Partial<ModelDraft>) => void;
  updateProduct: (id: string, patch: Partial<Omit<ProductDraft, "id">>) => void;
  addProduct: () => void;
  removeProduct: (id: string) => void;
};

const CreateProductFormContext =
  createContext<CreateProductFormContextValue | null>(null);

const emptyModel = {
  type: null,
  name: "",
  sizeType: SizeType.Letter,
} as const satisfies ModelDraft;

const firstProductId = "product-0";

const emptyProduct: ProductDraft = {
  id: firstProductId,
  externalId: "",
  description: "",
  fabric: "",
  sizes: [],
  colors: [],
};

function nextProductId(products: ProductDraft[]) {
  const maxIndex = products.reduce((max, product) => {
    const index = Number(product.id.replace(/^product-/, ""));
    return Number.isFinite(index) ? Math.max(max, index) : max;
  }, 0);
  return `product-${maxIndex + 1}`;
}

export function CreateProductFormProvider({
  children,
  fieldErrors,
}: {
  children: ReactNode;
  fieldErrors: CreateProductState["fieldErrors"];
}) {
  const [model, setModel] = useState<ModelDraft>(emptyModel);
  const [products, setProducts] = useState<ProductDraft[]>([emptyProduct]);
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
      id: nextProductId(products),
      externalId: "",
      description: last?.description ?? "",
      fabric: last?.fabric ?? "",
      sizes: [],
      colors: [],
    };
    setProducts((prev) => [...prev, next]);
    setActiveProductId(next.id);
  }, [products]);

  const removeProduct = useCallback(
    (id: string) => {
      if (products.length <= 1) {
        return;
      }
      const next = products.filter((product) => product.id !== id);
      setProducts(next);
      if (activeProductId === id) {
        setActiveProductId(next[0]?.id ?? activeProductId);
      }
    },
    [activeProductId, products],
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
      setActiveProductId,
      updateModel,
      updateProduct,
      addProduct,
      removeProduct,
    }),
    [
      model,
      products,
      activeProductId,
      fieldErrors,
      updateModel,
      updateProduct,
      addProduct,
      removeProduct,
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

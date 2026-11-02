"use client";

import {
  createContext,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";

const STORAGE_KEY = "amavie.basket";
const EMPTY_BASKET: BasketItem[] = [];

export type BasketItem = {
  variantId: string;
  title: string;
  colorName: string;
  colorHex: string;
  size: string;
};

type BasketContextValue = {
  items: BasketItem[];
  ready: boolean;
  addItem: (item: BasketItem) => void;
  removeItem: (variantId: string) => void;
};

const BasketContext = createContext<BasketContextValue | null>(null);

let storedItems: BasketItem[] | null = null;
const listeners = new Set<() => void>();

export function BasketProvider({ children }: { children: ReactNode }) {
  const ready = useSyncExternalStore(
    subscribeReady,
    getClientReady,
    getServerReady,
  );
  const snapshot = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  const items = ready ? snapshot : EMPTY_BASKET;

  const value = useMemo<BasketContextValue>(
    () => ({
      items,
      ready,
      addItem,
      removeItem,
    }),
    [items, ready],
  );

  return (
    <BasketContext.Provider value={value}>{children}</BasketContext.Provider>
  );
}

export function useBasket() {
  const value = useContext(BasketContext);

  if (!value) {
    throw new Error("useBasket must be used within BasketProvider");
  }

  return value;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  storedItems ??= readBasket();
  return storedItems;
}

function getServerSnapshot() {
  return EMPTY_BASKET;
}

function subscribeReady() {
  return () => {};
}

function getClientReady() {
  return true;
}

function getServerReady() {
  return false;
}

function emit() {
  for (const listener of listeners) {
    listener();
  }
}

function addItem(item: BasketItem) {
  const current = getSnapshot();

  if (current.some((line) => line.variantId === item.variantId)) {
    return;
  }

  storedItems = [...current, item];
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(storedItems));
  emit();
}

function removeItem(variantId: string) {
  storedItems = getSnapshot().filter((line) => line.variantId !== variantId);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(storedItems));
  emit();
}

function readBasket(): BasketItem[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return EMPTY_BASKET;
    }

    const parsed: unknown = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return EMPTY_BASKET;
    }

    return parsed.filter(isBasketItem);
  } catch {
    return EMPTY_BASKET;
  }
}

function isBasketItem(value: unknown): value is BasketItem {
  if (!value || typeof value !== "object") {
    return false;
  }

  const item = value as Record<string, unknown>;

  return (
    typeof item.variantId === "string" &&
    typeof item.title === "string" &&
    typeof item.colorName === "string" &&
    typeof item.colorHex === "string" &&
    typeof item.size === "string"
  );
}

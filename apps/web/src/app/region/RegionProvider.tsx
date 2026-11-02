"use client";

import {
  createContext,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";

const STORAGE_KEY = "amavie.region";

export const REGIONS = ["by", "ru", "eu"] as const;

export type Region = (typeof REGIONS)[number];

export const REGION_LABELS: Record<Region, string> = {
  by: "Беларусь",
  ru: "РФ",
  eu: "Европа",
};

const DEFAULT_REGION: Region = "by";

type RegionContextValue = {
  region: Region;
  setRegion: (region: Region) => void;
};

const RegionContext = createContext<RegionContextValue | null>(null);

let storedRegion: Region | null = null;
const listeners = new Set<() => void>();

export function RegionProvider({ children }: { children: ReactNode }) {
  const region = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const value = useMemo<RegionContextValue>(
    () => ({
      region,
      setRegion,
    }),
    [region],
  );

  return (
    <RegionContext.Provider value={value}>{children}</RegionContext.Provider>
  );
}

export function useRegion() {
  const value = useContext(RegionContext);

  if (!value) {
    throw new Error("useRegion must be used within RegionProvider");
  }

  return value;
}

export function isRegion(value: unknown): value is Region {
  return value === "by" || value === "ru" || value === "eu";
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  storedRegion ??= readRegion();
  return storedRegion;
}

function getServerSnapshot() {
  return DEFAULT_REGION;
}

function emit() {
  for (const listener of listeners) {
    listener();
  }
}

function setRegion(region: Region) {
  storedRegion = region;
  window.localStorage.setItem(STORAGE_KEY, region);
  emit();
}

function readRegion(): Region {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (isRegion(raw)) {
      return raw;
    }

    return DEFAULT_REGION;
  } catch {
    return DEFAULT_REGION;
  }
}

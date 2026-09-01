import type { Config } from "jest";
import nextJest from "next/jest.js";

export function createNextJestConfig(dir: string, config: Config = {}) {
  const createJestConfig = nextJest({
    dir,
  });

  return createJestConfig({
    testEnvironment: "jsdom",
    ...config,
  });
}

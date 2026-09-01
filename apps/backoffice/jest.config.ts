import { createNextJestConfig } from "@amavie/jest-config/next";

export default createNextJestConfig("./", {
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
});

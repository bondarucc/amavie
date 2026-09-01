import { defineConfig, globalIgnores } from "eslint/config";
import prettier from "eslint-config-prettier/flat";

export default defineConfig([
  globalIgnores(["node_modules/**", "dist/**", "build/**"]),
  prettier,
]);

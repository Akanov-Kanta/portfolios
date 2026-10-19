import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // research material (frames, scripts, the source portfolio file), not app code
    "reference/**",
    // the "edit" variant: a separate Vite project with its own build
    "edit/**",
    // the "hybrid" variant: a separate Next app with its own build
    "hybrid/**",
  ]),
]);

export default eslintConfig;

import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  {
    // three.js scenes mutate scratch vectors / animation actions inside useFrame and effects on purpose;
    // the React Compiler "immutability" rule cannot see that these are not React state.
    files: ["src/components/world/**/*.{ts,tsx}"],
    rules: { "react-hooks/immutability": "off" },
  },
  globalIgnores([
    "public/**",
    "scripts/**",
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;

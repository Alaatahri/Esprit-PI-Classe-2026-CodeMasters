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
  ]),
  {
    rules: {
      /**
       * Cette règle est trop agressive dans ce projet (elle signale des patterns
       * valides comme le bootstrap via localStorage et les chargements async).
       */
      "react-hooks/set-state-in-effect": "off",
    },
  },
]);

export default eslintConfig;

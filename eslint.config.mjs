import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([".next/**", "out/**", "next-env.d.ts"]),
  {
    files: ["app/page.tsx", "lib/pm-engine.ts"],
    rules: {
      "react-hooks/set-state-in-effect": "off",
      "@typescript-eslint/no-non-null-asserted-optional-chain": "off"
    }
  }
]);

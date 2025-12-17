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
    // Project-specific ignores
    "public/**",
    "agents/**",
    "scripts/**",
  ]),
  {
    rules: {
      "react-hooks/set-state-in-effect": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "react-hooks/exhaustive-deps": "off",
      "@next/next/no-img-element": "off",
    },
  },
  {
    files: ["src/app/admin/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@/components/atoms/*",
                "@/components/molecules/*",
                "@/components/organisms/*",
                "@/components/templates/*",
              ],
              message: "Admin pages should use '@/components/ui/*' (B-mode: User=atoms, Admin=ui).",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/app/[lang]/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/components/ui/*"],
              message: "User pages should not import '@/components/ui/*' directly (B-mode: User=atoms, Admin=ui).",
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      "src/components/**/*.{ts,tsx}",
      "src/providers/**/*.{ts,tsx}",
      "src/utils/**/*.{ts,tsx}",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["../**"],
              message: "Use '@/...' path aliases for cross-folder imports (avoid '../').",
            },
          ],
        },
      ],
    },
  },
]);

export default eslintConfig;

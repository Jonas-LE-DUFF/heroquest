import js from "@eslint/js";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import importPlugin from "eslint-plugin-import";
import prettierConfig from "eslint-config-prettier";
import jestPlugin from "eslint-plugin-jest";

export default [
  // Fichiers ignorés
  {
    ignores: ["dist/**", "coverage/**", "*.config.js"],
  },

  // Base ESLint recommandée
  js.configs.recommended,

  // Config principale pour tout le code TypeScript
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: "./tsconfig.json",
        ecmaVersion: "latest",
        sourceType: "module",
      },
      globals: {
        console: "readonly",
        process: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
      import: importPlugin,
    },
    rules: {
      // TypeScript
      ...tsPlugin.configs["recommended"].rules,
      ...tsPlugin.configs["recommended-requiring-type-checking"].rules,
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-floating-promises": "error",

      // Imports
      "import/prefer-default-export": "off",

      // Console autorisée côté serveur
      "no-console": "off",
    },
  },

  // test files
  {
    files: ["src/**/*.test.{ts,tsx}", "src/**/*.spec.{ts,tsx}"],
    plugins: {jest: jestPlugin },
    ...jestPlugin.configs["flat/recommended"],
    
  },

  // Prettier en dernier
  prettierConfig,
];
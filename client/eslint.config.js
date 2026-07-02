import js from "@eslint/js";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import importPlugin from "eslint-plugin-import";
import jsxA11yPlugin from "eslint-plugin-jsx-a11y";
import prettierConfig from "eslint-config-prettier";
import jestPlugin from "eslint-plugin-jest";

export default [
  // Fichiers ignorés (remplace .eslintignore)
  {
    ignores: ["dist/**", "build/**", "coverage/**", "*.config.js"],
  },

  // Base ESLint recommandée
  js.configs.recommended,

  // Config principale pour tout le code TypeScript/React
  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: "./tsconfig.json",
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: { jsx: true },
      },
      globals: {
        window: "readonly",
        document: "readonly",
        console: "readonly",
        browser: "readonly",
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
      react: reactPlugin,
      "react-hooks": reactHooksPlugin,
      import: importPlugin,
      "jsx-a11y": jsxA11yPlugin,
    },
    rules: {
      // TypeScript
      ...tsPlugin.configs["recommended"].rules,
      ...tsPlugin.configs["recommended-requiring-type-checking"].rules,
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-floating-promises": "error",

      // React
      ...reactPlugin.configs.recommended.rules,
      ...reactHooksPlugin.configs.recommended.rules,
      "react/react-in-jsx-scope": "off", // Inutile depuis React 17
      "react/jsx-filename-extension": ["error", { extensions: [".tsx"] }],
      "react/require-default-props": "off", // TypeScript gère ça
      "react/jsx-props-no-spreading": "off",

      // Imports
      "import/prefer-default-export": "off",

      // Accessibilité
      ...jsxA11yPlugin.configs.recommended.rules,
    },
    settings: {
      react: { version: "detect" },
    },
  },

  // test files
  {
    files: ["src/**/*.test.{ts,tsx}", "src/**/*.spec.{ts,tsx}"],
    plugins: { jest: jestPlugin },
    ...jestPlugin.configs["flat/recommended"],
    settings: {
      jest: {
        version: 29, // mets ici ta version de Jest (vérifie avec: npm list jest)
      },
    },
  },

  // Prettier en dernier — désactive les règles qui conflictent avec le formatage
  prettierConfig,
];

import js from "@eslint/js";
import graphql from "@graphql-eslint/eslint-plugin";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactNative from "eslint-plugin-react-native";
import globals from "globals";
import ts from "typescript-eslint";
import swan from "./scripts/eslint/index.mjs";

const typescriptRules = [ts.configs.eslintRecommended, ...ts.configs.recommended]
  .map(config => config.rules)
  .reduce((acc, rules) => ({ ...acc, ...rules }), {});

/** @type {import("eslint").Linter.Config[]} */
export default [
  {
    ignores: [
      "**/*.d.ts",
      "**/*.js",
      "**/*.mjs",

      "**/graphql/*.ts",
      "docs/**",
      "node_modules/**",
      "playwright.config.ts",
      "scripts/**",
      "server/dist/**",
      "tests/**",
      "vite.config.js",
    ],
  },
  {
    files: ["clients/*/src/**/*.ts", "clients/*/src/**/*.tsx", "server/src/**/*.ts"],

    plugins: {
      react,
      swan,
      "@typescript-eslint": ts.plugin,
      "react-hooks": reactHooks,
      "react-native": reactNative,
    },

    languageOptions: {
      sourceType: "module",
      parser: ts.parser,

      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        tsconfigRootDir: import.meta.dirname,
        projectService: false,
      },
    },

    rules: {
      ...js.configs.recommended.rules,
      ...typescriptRules,

      curly: "warn",
      "no-extra-boolean-cast": "off",
      "no-implicit-coercion": "error",
      "no-param-reassign": "error",
      "no-var": "error",
      "object-shorthand": "warn",
      "prefer-const": "error",
      "prefer-rest-params": "error",
      "prefer-spread": "error",
      "no-empty": ["error", { allowEmptyCatch: true }],

      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", ignoreRestSiblings: true },
      ],

      "@typescript-eslint/ban-ts-comment": [
        "error",
        { "ts-check": true, "ts-expect-error": false },
      ],

      "@typescript-eslint/consistent-type-definitions": ["error", "type"],
      "@typescript-eslint/no-array-constructor": "error",
      "@typescript-eslint/no-empty-object-type": "error",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-misused-new": "error",
      "@typescript-eslint/no-namespace": "error",
      "@typescript-eslint/no-non-null-assertion": "error",
      "@typescript-eslint/no-require-imports": "error",
      "@typescript-eslint/no-unnecessary-type-constraint": "error",
      "@typescript-eslint/no-unsafe-declaration-merging": "error",
      "@typescript-eslint/no-unsafe-function-type": "error",
      "@typescript-eslint/no-unused-expressions": "off",
      "@typescript-eslint/no-wrapper-object-types": "error",
      "@typescript-eslint/prefer-as-const": "error",

      "react/jsx-boolean-value": ["error", "always"],

      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",

      // https://github.com/intellicode/eslint-plugin-react-native
      "react-native/no-color-literals": "warn",
      "react-native/no-inline-styles": "warn",
      "react-native/no-single-element-style-arrays": "warn",
      "react-native/no-unused-styles": "warn",

      "swan/jsx-newline": "warn",
      "swan/no-template-in-t": "error",
    },
  },
  {
    files: ["clients/*/src/graphql/*.gql"],

    languageOptions: {
      parser: graphql.parser,
    },
    plugins: {
      "@graphql-eslint": graphql,
    },
    rules: {
      "@graphql-eslint/require-selections": "error",
    },
  },
];

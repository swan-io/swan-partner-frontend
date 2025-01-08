import js from "@eslint/js";
import graphql from "@graphql-eslint/eslint-plugin";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactNative from "eslint-plugin-react-native";
import globals from "globals";
import ts from "typescript-eslint";
import swan from "./scripts/eslint/index.mjs";

const typescriptRules = [
  ts.configs.eslintRecommended,
  ...ts.configs.recommended,
  ...ts.configs.recommendedTypeChecked,
]
  .map(config => config.rules)
  .reduce((acc, rules) => ({ ...acc, ...rules }), {});

/** @type {import("eslint").Linter.Config[]} */
export default [
  {
    ignores: [
      "**/*.d.ts",
      "**/*.js",
      "**/*.mjs",
      "**/graphql/**/*.ts",
      "docs/**",
      "server/dist/**",
      "tests/**",
      "vite.config.ts",
    ],
  },
  {
    files: ["**/*.ts", "**/*.tsx", "**/*.mts", "**/*.cts"],

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
        projectService: true,
      },
    },

    rules: {
      ...js.configs.recommended.rules,
      ...typescriptRules,

      curly: "warn",
      "no-extra-boolean-cast": "off",
      "no-param-reassign": "error",
      "no-implicit-coercion": "error",
      "no-var": "error",
      "prefer-const": "error",
      "object-shorthand": "warn",
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
      "@typescript-eslint/no-base-to-string": "error",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-non-null-assertion": "error",
      "@typescript-eslint/no-unnecessary-qualifier": "error",
      "@typescript-eslint/no-unnecessary-type-arguments": "error",
      "@typescript-eslint/prefer-nullish-coalescing": "error",
      "@typescript-eslint/prefer-optional-chain": "error",
      "@typescript-eslint/require-await": "error",
      "@typescript-eslint/strict-boolean-expressions": "error",

      "@typescript-eslint/no-empty-function": "off",
      "@typescript-eslint/no-inferrable-types": "off",
      "@typescript-eslint/no-unused-expressions": "off",
      "@typescript-eslint/no-var-requires": "off",
      "@typescript-eslint/only-throw-error": "off",
      "@typescript-eslint/prefer-regexp-exec": "off",
      "@typescript-eslint/unbound-method": "off",

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

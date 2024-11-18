// https://github.com/facebook/create-react-app/tree/v4.0.0/packages/eslint-config-react-app
// const { dependencies } = require("./package.json");
const path = require("pathe");

const errorOnCI = process.env.CI === "true" ? "error" : "warn";

module.exports = {
  overrides: [
    {
      files: ["clients/*/src/**/*.{ts,tsx}"],
      plugins: ["@typescript-eslint", "react", "react-hooks", "react-native", "swan"],

      extends: [
        "eslint:recommended",
        "plugin:@typescript-eslint/eslint-recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:@typescript-eslint/recommended-requiring-type-checking",
      ],

      parserOptions: {
        project: path.resolve(__dirname + "/tsconfig.json"),
      },

      env: {
        browser: true,
        es2022: true,
      },

      overrides: [
        {
          files: ["**/__{mocks,tests}__/**/*.{ts,tsx}"],
        },
        {
          files: ["*.d.ts"],
          rules: {
            "@typescript-eslint/consistent-type-definitions": "off",
            "@typescript-eslint/no-unused-vars": "off",
          },
        },
        {
          files: ["clients/**/src/graphql/**/*.{ts,tsx}"],
          rules: {
            "@typescript-eslint/ban-types": "off",
            "@typescript-eslint/no-explicit-any": "off",
          },
        },
      ],

      rules: {
        curly: errorOnCI,

        "no-implicit-coercion": "error",
        "no-param-reassign": "error",
        "no-var": "error",
        "object-shorthand": "error",
        "prefer-const": "error",

        "no-extra-boolean-cast": "off",
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
        "react-native/no-color-literals": errorOnCI,
        "react-native/no-inline-styles": errorOnCI,
        "react-native/no-single-element-style-arrays": errorOnCI,
        "react-native/no-unused-styles": errorOnCI,

        "swan/jsx-newline": errorOnCI,
        "swan/no-template-in-t": "error",
      },
    },
    {
      files: ["clients/*/src/graphql/*.gql"],
      plugins: ["@graphql-eslint"],
      parser: "@graphql-eslint/eslint-plugin",
      rules: {
        "@graphql-eslint/require-id-when-available": "error",
      },
    },
  ],
};

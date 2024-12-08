import prettier from "eslint-plugin-prettier"
import typescriptEslint from "@typescript-eslint/eslint-plugin"
import tsParser from "@typescript-eslint/parser"
import globals from "globals"
import js from "@eslint/js"
import eslintConfigPrettier from "eslint-config-prettier"

export default [
  {
    // Note: there should be no other properties in this object
    ignores: ["dist/*"],
  },
  js.configs.recommended,
  eslintConfigPrettier,
  {
    languageOptions: {
      ecmaVersion: 2022,
      globals: {
        ...globals.node,
      },
      parser: tsParser,
    },
    plugins: {
      prettier,
      "@typescript-eslint": typescriptEslint,
    },
    rules: {
      "prettier/prettier": [
        "error",
        {
          semi: false,
        },
      ],
    },
  },
]

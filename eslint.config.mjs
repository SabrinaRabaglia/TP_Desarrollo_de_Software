import js from "@eslint/js"
import globals from "globals"
import pluginReact from "eslint-plugin-react"
import { defineConfig } from "eslint/config"

export default defineConfig([
  {
    files: ["packages/backend/**/*.{js,mjs,cjs,jsx}"],
    plugins: { js },
    extends: ["js/recommended"],
    languageOptions: { globals: globals.node },
    rules: {
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  },
  {
    files: ["packages/frontend/src/**/*.{js,jsx,mjs,cjs}"],
    extends: [
      pluginReact.configs.flat.recommended,
      pluginReact.configs.flat["jsx-runtime"],
    ],
    languageOptions: { globals: globals.browser },
    settings: { react: { version: "detect" } },
    rules: {
      "react/prop-types": "off",
    },
  },
  {
    files: ["packages/frontend/src/**/*.test.{js,jsx}"],
    languageOptions: { globals: globals.jest },
  },
])

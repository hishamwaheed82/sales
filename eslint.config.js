import tseslint from "typescript-eslint";

const banToLocaleString = {
  selector: "CallExpression[callee.property.name='toLocaleString']",
  message:
    "Use formatMoney / formatQty / formatDate / formatDateTime from @softplan/ui — never call toLocaleString in UI code.",
};

export default tseslint.config(
  { ignores: ["dist/**", "node_modules/**", "backend/**"] },
  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { "@typescript-eslint": tseslint.plugin },
    rules: {
      "no-restricted-syntax": ["error", banToLocaleString],
    },
  },
);
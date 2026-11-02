/** @type {import('prettier').Config} */
module.exports = {
  endOfLine: "lf",
  semi: false,
  singleQuote: false,
  tabWidth: 2,
  trailingComma: "es5",
  printWidth: 80,
  importOrder: [
    "^(react/(.*)$)|^(react$)|^(react-dom(/.*)?$)",
    "^react-router(/.*)?$",
    "<THIRD_PARTY_MODULES>",
    "",
    "^@/constants(/.*)?$",
    "^@/lib(/.*)?$",
    "^@/hooks(/.*)?$",
    "^@/context(/.*)?$",
    "^@/data(/.*)?$",
    "^@/types$",
    "^@/components/ui(/.*)?$",
    "^@/components(/.*)?$",
    "^@/pages(/.*)?$",
    "^@/assets(/.*)?$",
    "",
    "^[./]",
  ],
  importOrderParserPlugins: ["typescript", "jsx", "decorators-legacy"],
  plugins: [
    // An object, not a name, so the Tailwind plugin also finds it in VS Code.
    {
      ...require("@ianvs/prettier-plugin-sort-imports"),
      name: "@ianvs/prettier-plugin-sort-imports",
      // Stops Prettier's config logging from loading its optional parsers.
      toJSON: () => "@ianvs/prettier-plugin-sort-imports",
    },
    "prettier-plugin-tailwindcss",
  ],
  tailwindStylesheet: "./src/index.css",
  tailwindFunctions: ["cn", "cva"],
}

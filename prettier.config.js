/** @type {import("prettier").Config} */
export default {
  arrowParens: "always",
  jsdocPreferCodeFences: true,
  jsdocSeparateReturnsFromParam: true,
  jsdocSeparateTagGroups: true,
  plugins: ["prettier-plugin-packagejson", "prettier-plugin-jsdoc"],
  printWidth: 120,
  semi: true,
  singleQuote: false,
  tabWidth: 2,
  trailingComma: "all",
  tsdoc: true,
};

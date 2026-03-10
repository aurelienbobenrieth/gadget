import oxlintPlugin from "eslint-plugin-oxlint";
import perfectionistPlugin from "eslint-plugin-perfectionist";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: ["**/dist/**", "**/node_modules/**", "**/coverage/**"],
  },
  {
    files: ["packages/eslint-plugin-gadget/src/**/*.ts"],
    extends: [...tseslint.configs.strictTypeChecked, perfectionistPlugin.configs["recommended-natural"]],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "perfectionist/sort-modules": "off",
    },
  },
  // Disables every ESLint rule already covered by oxlint. Must be last.
  ...oxlintPlugin.buildFromOxlintConfigFile("./.oxlintrc.json"),
);

import type { Linter } from "eslint";

import { recommended } from "./configs/recommended.js";
import { strict } from "./configs/strict.js";
import { rules } from "./rules/index.js";

interface GadgetPlugin {
  [key: string]: unknown;
  configs: { recommended: Linter.Config; strict: Linter.Config };
  meta: { name: string; version: string };
  rules: typeof rules;
}

declare const __PACKAGE_VERSION__: string;

const plugin: GadgetPlugin = {
  configs: undefined as never,
  meta: { name: "@aurelienbbn/eslint-plugin-gadget", version: __PACKAGE_VERSION__ },
  rules,
};

plugin.configs = {
  recommended: recommended(plugin),
  strict: strict(plugin),
};

export default plugin;

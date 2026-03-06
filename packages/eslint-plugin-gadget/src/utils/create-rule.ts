import { ESLintUtils } from "@typescript-eslint/utils";

const DOCS_BASE_URL = "https://github.com/aurelienbobenrieth/gadget/blob/main/packages/eslint-plugin-gadget/README.md#";

export const createRule = ESLintUtils.RuleCreator((name) => `${DOCS_BASE_URL}${name}`);

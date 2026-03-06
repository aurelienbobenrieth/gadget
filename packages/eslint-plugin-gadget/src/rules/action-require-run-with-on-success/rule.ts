import { AST_NODE_TYPES } from "@typescript-eslint/utils";

import { createRule } from "../../utils/create-rule.js";
import { isActionFile } from "../../utils/is-action-file.js";

type MessageIds = "onSuccessWithoutRun";

export const actionRequireRunWithOnSuccess = createRule<[], MessageIds>({
  create(context) {
    if (!isActionFile(context.filename)) return {};

    return {
      "Program:exit"(node) {
        let hasRun = false;
        let onSuccessNode: (typeof node.body)[number] | null = null;

        for (const statement of node.body) {
          if (statement.type !== AST_NODE_TYPES.ExportNamedDeclaration) continue;

          const declaration = statement.declaration;
          if (!declaration || declaration.type !== AST_NODE_TYPES.VariableDeclaration) continue;

          const declarator = declaration.declarations[0];
          if (declarator.id.type !== AST_NODE_TYPES.Identifier) continue;

          if (declarator.id.name === "run") hasRun = true;
          if (declarator.id.name === "onSuccess") onSuccessNode = statement;
        }

        if (onSuccessNode && !hasRun) {
          context.report({
            messageId: "onSuccessWithoutRun",
            node: onSuccessNode,
          });
        }
      },
    };
  },
  defaultOptions: [],
  meta: {
    docs: {
      description: "Require a run export when onSuccess is exported in Gadget actions.",
    },
    messages: {
      onSuccessWithoutRun: "onSuccess requires a run export.",
    },
    schema: [],
    type: "problem",
  },
  name: "action-require-run-with-on-success",
});

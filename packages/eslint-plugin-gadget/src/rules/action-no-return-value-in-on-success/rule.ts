import type { TSESTree } from "@typescript-eslint/utils";

import { AST_NODE_TYPES } from "@typescript-eslint/utils";

import { createRule } from "../../utils/create-rule.js";
import { createExportScopeTracker } from "../../utils/export-scope-tracker.js";
import { isActionFile } from "../../utils/is-action-file.js";

type MessageIds = "noReturnValue";

export const actionNoReturnValueInOnSuccess = createRule<[], MessageIds>({
  create(context) {
    if (!isActionFile(context.filename)) return {};

    const tracker = createExportScopeTracker({ onSuccess: "onSuccess" as const });

    return {
      ...tracker.listeners(),
      ReturnStatement(node: TSESTree.ReturnStatement) {
        if (tracker.getDirectScope() !== "onSuccess") return;
        if (node.argument === null) return;

        context.report({
          fix(fixer) {
            if (isLastStatementInBlock(node)) {
              const text = context.sourceCode.getText();
              let start = node.range[0];
              let end = node.range[1];

              const lineStart = text.lastIndexOf("\n", start - 1);
              if (lineStart !== -1) {
                const beforeOnLine = text.slice(lineStart + 1, start);
                if (/^\s*$/.test(beforeOnLine)) {
                  start = lineStart + 1;
                }
              }

              const lineEnd = text.indexOf("\n", end);
              if (lineEnd !== -1) {
                end = lineEnd + 1;
              }

              return fixer.removeRange([start, end]);
            }

            return fixer.replaceText(node, "return;");
          },
          messageId: "noReturnValue",
          node,
        });
      },
    };
  },
  defaultOptions: [],
  meta: {
    docs: {
      description: "Disallow returning a value from onSuccess in Gadget actions.",
    },
    fixable: "code",
    messages: {
      noReturnValue: "onSuccess return values are ignored. Use return; or remove it.",
    },
    schema: [],
    type: "suggestion",
  },
  name: "action-no-return-value-in-on-success",
});

function isLastStatementInBlock(node: TSESTree.ReturnStatement): boolean {
  const parent = node.parent;
  if (parent.type !== AST_NODE_TYPES.BlockStatement) return false;
  const lastStatement = parent.body[parent.body.length - 1];
  return lastStatement === node;
}

import type { TSESTree } from "@typescript-eslint/utils";

import { AST_NODE_TYPES } from "@typescript-eslint/utils";

import { createRule } from "../../utils/create-rule.js";
import { getExportedFunctionInit } from "../../utils/exported-function-init.js";
import { isActionFile } from "../../utils/is-action-file.js";

type MessageIds = "emptyOnSuccess";

export const actionNoEmptyOnSuccess = createRule<[], MessageIds>({
  create(context) {
    if (!isActionFile(context.filename)) return {};

    return {
      ExportNamedDeclaration(node) {
        const init = getExportedFunctionInit(node, "onSuccess");
        if (!init) return;
        if (init.body.type !== AST_NODE_TYPES.BlockStatement) return;
        if (init.body.body.length > 0) return;

        context.report({
          fix(fixer) {
            return removeExportStatement(fixer, context, node);
          },
          messageId: "emptyOnSuccess",
          node,
        });
      },
    };
  },
  defaultOptions: [],
  meta: {
    docs: {
      description: "Disallow empty onSuccess exports in Gadget actions.",
    },
    fixable: "code",
    messages: {
      emptyOnSuccess: "Remove empty onSuccess.",
    },
    schema: [],
    type: "suggestion",
  },
  name: "action-no-empty-on-success",
});

type RuleContext = Parameters<typeof actionNoEmptyOnSuccess.create>[0];
type Fixer = Parameters<NonNullable<Parameters<RuleContext["report"]>[0]["fix"]>>[0];

function removeExportStatement(
  fixer: Fixer,
  context: RuleContext,
  node: TSESTree.ExportNamedDeclaration,
): ReturnType<Fixer["remove"]> {
  const sourceCode = context.sourceCode;
  const tokenBefore = sourceCode.getTokenBefore(node, { includeComments: true });
  const tokenAfter = sourceCode.getTokenAfter(node, { includeComments: true });

  let startIndex = node.range[0];
  let endIndex = node.range[1];

  const text = sourceCode.getText();
  if (tokenBefore) {
    const betweenBefore = text.slice(tokenBefore.range[1], startIndex);
    const newlines = betweenBefore.match(/\n/g);
    if (newlines && newlines.length > 0) {
      startIndex = tokenBefore.range[1];
    }
  } else {
    startIndex = 0;
  }

  if (tokenAfter) {
    const betweenAfter = text.slice(endIndex, tokenAfter.range[0]);
    const firstNewline = betweenAfter.indexOf("\n");
    if (firstNewline !== -1) {
      endIndex = endIndex + firstNewline + 1;
    }
  } else {
    endIndex = text.length;
  }

  return fixer.removeRange([startIndex, endIndex]);
}

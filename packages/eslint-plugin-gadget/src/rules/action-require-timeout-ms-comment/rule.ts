import { AST_NODE_TYPES } from "@typescript-eslint/utils";

import { extractExportedConstObject } from "../../utils/action-export-object.js";
import { createRule } from "../../utils/create-rule.js";
import { findSameLineComment, formatDurationComment, isDurationComment } from "../../utils/duration-comment.js";
import { isActionFile } from "../../utils/is-action-file.js";
import { staticKeyName } from "../../utils/static-key-name.js";

type MessageIds = "missingComment";

export const actionRequireTimeoutMsComment = createRule<[], MessageIds>({
  create(context) {
    if (!isActionFile(context.filename)) return {};

    return {
      ExportNamedDeclaration(node) {
        const objectExpression = extractExportedConstObject(node, {
          identifierName: "options",
        });
        if (!objectExpression) return;

        for (const property of objectExpression.properties) {
          if (property.type === AST_NODE_TYPES.SpreadElement || property.computed || property.shorthand) continue;
          if (staticKeyName(property.key) !== "timeoutMS") continue;

          const valueNode = property.value;
          if (valueNode.type !== AST_NODE_TYPES.Literal || typeof valueNode.value !== "number") return;

          checkDurationComment(context, valueNode, valueNode.value);
        }
      },
    };
  },
  defaultOptions: [],
  meta: {
    docs: {
      description:
        "Require a trailing inline comment describing the duration on the timeoutMS property in Gadget action options.",
    },
    fixable: "code",
    messages: {
      missingComment: "Add an inline duration comment to timeoutMS.",
    },
    schema: [],
    type: "suggestion",
  },
  name: "action-require-timeout-ms-comment",
});

type RuleContext = Parameters<typeof actionRequireTimeoutMsComment.create>[0];

function checkDurationComment(
  context: RuleContext,
  valueNode: Parameters<typeof findSameLineComment>[1],
  ms: number,
): void {
  const tokenAfterValue = context.sourceCode.getTokenAfter(valueNode);
  const trailingComma =
    tokenAfterValue && tokenAfterValue.value === "," && tokenAfterValue.loc.start.line === valueNode.loc.end.line
      ? tokenAfterValue
      : null;

  const anchorNode = trailingComma ?? valueNode;

  const existingComment = findSameLineComment(context.sourceCode, anchorNode);
  const expectedComment = formatDurationComment(ms);

  if (existingComment && isDurationComment(existingComment)) return;

  if (existingComment) {
    const tokenAfterComment = context.sourceCode.getTokenAfter(existingComment, { includeComments: true });
    const hasContentAfterComment =
      tokenAfterComment !== null && tokenAfterComment.loc.start.line === existingComment.loc.end.line;
    const replacement = hasContentAfterComment ? `${expectedComment}\n` : expectedComment;

    context.report({
      fix: (fixer) => fixer.replaceTextRange([existingComment.range[0], existingComment.range[1]], replacement),
      messageId: "missingComment",
      node: valueNode,
    });
    return;
  }

  const nextToken = context.sourceCode.getTokenAfter(anchorNode);
  const hasContentAfterOnSameLine = nextToken !== null && nextToken.loc.start.line === anchorNode.loc.end.line;

  context.report({
    fix: (fixer) => {
      const text = hasContentAfterOnSameLine ? ` ${expectedComment}\n` : ` ${expectedComment}`;
      return fixer.insertTextAfter(anchorNode, text);
    },
    messageId: "missingComment",
    node: valueNode,
  });
}

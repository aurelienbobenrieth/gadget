import { AST_NODE_TYPES } from "@typescript-eslint/utils";

import { extractExportedConstObject } from "../../utils/action-export-object.js";
import { createRule } from "../../utils/create-rule.js";
import { isActionFile } from "../../utils/is-action-file.js";
import { staticKeyName } from "../../utils/static-key-name.js";

const MAX_TIMEOUT_MS = 15 * 60 * 1000;

type MessageIds = "exceedsMaximum";

export const actionNoInvalidTimeoutMs = createRule<[], MessageIds>({
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

          if (valueNode.value > MAX_TIMEOUT_MS) {
            context.report({
              data: { value: String(valueNode.value) },
              fix: (fixer) => fixer.replaceText(valueNode, String(MAX_TIMEOUT_MS)),
              messageId: "exceedsMaximum",
              node: valueNode,
            });
          }
        }
      },
    };
  },
  defaultOptions: [],
  meta: {
    docs: {
      description: "Enforce that timeoutMS in Gadget action options does not exceed 900000ms (15 minutes).",
    },
    fixable: "code",
    messages: {
      exceedsMaximum: "timeoutMS {{ value }} exceeds Gadget's max of 900000ms.",
    },
    schema: [],
    type: "problem",
  },
  name: "action-no-invalid-timeout-ms",
});

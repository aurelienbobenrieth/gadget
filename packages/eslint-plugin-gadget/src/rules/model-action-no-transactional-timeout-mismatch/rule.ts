import type { TSESTree } from "@typescript-eslint/utils";

import { AST_NODE_TYPES } from "@typescript-eslint/utils";

import { createRule } from "../../utils/create-rule.js";
import { findOptionsExport } from "../../utils/find-options-export.js";
import { isModelActionFile } from "../../utils/is-action-file.js";
import { staticKeyName } from "../../utils/static-key-name.js";

const TRANSACTIONAL_TIMEOUT_LIMIT = 5000;

type MessageIds = "mismatch";

export const modelActionNoTransactionalTimeoutMismatch = createRule<[], MessageIds>({
  create(context) {
    if (!isModelActionFile(context.filename)) return {};

    return {
      "Program:exit"(node: TSESTree.Program) {
        const objectExpression = findOptionsExport(node.body);
        if (!objectExpression) return;

        let timeoutMSProperty: TSESTree.Property | undefined;
        let transactionalValue: boolean | undefined;

        for (const prop of objectExpression.properties) {
          if (prop.type !== AST_NODE_TYPES.Property || prop.computed) continue;

          const keyName = staticKeyName(prop.key);

          if (keyName === "timeoutMS") {
            if (prop.value.type === AST_NODE_TYPES.Literal && typeof prop.value.value === "number") {
              timeoutMSProperty = prop;
            }
          }

          if (keyName === "transactional") {
            if (prop.value.type === AST_NODE_TYPES.Literal && typeof prop.value.value === "boolean") {
              transactionalValue = prop.value.value;
            }
          }
        }

        if (!timeoutMSProperty) return;

        const timeoutValue = timeoutMSProperty.value;
        if (timeoutValue.type !== AST_NODE_TYPES.Literal || typeof timeoutValue.value !== "number") return;

        if (timeoutValue.value > TRANSACTIONAL_TIMEOUT_LIMIT && transactionalValue !== false) {
          context.report({
            data: { value: String(timeoutValue.value) },
            messageId: "mismatch",
            node: timeoutMSProperty,
          });
        }
      },
    };
  },
  defaultOptions: [],
  meta: {
    docs: {
      description: "Disallow timeoutMS above 5000ms on model actions without explicitly setting transactional: false.",
    },
    messages: {
      mismatch: "timeoutMS {{ value }}ms has no effect on transactional model actions above 5000ms.",
    },
    schema: [],
    type: "problem",
  },
  name: "model-action-no-transactional-timeout-mismatch",
});
